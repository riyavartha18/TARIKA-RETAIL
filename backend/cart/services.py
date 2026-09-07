from rest_framework.exceptions import ValidationError, NotFound
from django.db.models import Sum
from catalog.models import Product, Inventory
from accounts.models import Customer
from .models import WishlistItem, CartItem
from .serializers import CartItemSerializer


class CustomerResolver:
    @staticmethod
    def get_customer_for_user(user):
        """
        Extracts or retrieves the Customer profile instance for an authenticated user.
        """
        if hasattr(user, 'profile') and isinstance(user.profile, Customer):
            return user.profile

        auth_user_id = getattr(user, 'auth_user_id', None) or getattr(user, 'id', None)
        if auth_user_id:
            customer = Customer.objects.filter(auth_user_id=auth_user_id).first()
            if customer:
                return customer

        email = getattr(user, 'email', None)
        if email:
            customer = Customer.objects.filter(email__iexact=email).first()
            if customer:
                return customer

        raise ValidationError("Authenticated user does not have a linked Customer profile.")


class WishlistService:
    @classmethod
    def get_customer_wishlist(cls, customer):
        return (
            WishlistItem.objects.filter(customer=customer)
            .select_related('product__category')
            .prefetch_related('product__inventory_items')
            .order_by('-created_at')
        )

    @classmethod
    def add_to_wishlist(cls, customer, product_id):
        try:
            product = Product.objects.get(product_id=product_id, is_active=True)
        except Product.DoesNotExist:
            raise NotFound("Product not found or is currently inactive.")

        item, created = WishlistItem.objects.get_or_create(
            customer=customer,
            product=product
        )
        return item, created

    @classmethod
    def remove_from_wishlist(cls, customer, product_id):
        deleted_count, _ = WishlistItem.objects.filter(
            customer=customer,
            product_id=product_id
        ).delete()
        return deleted_count > 0


class CartService:
    @staticmethod
    def get_available_stock(product):
        """
        Returns real-time sum of stock across all fulfillment center warehouses.
        """
        try:
            total = sum(i.stock_quantity or 0 for i in product.inventory_items.all())
            return total
        except Exception:
            return 0

    @classmethod
    def get_customer_cart_items(cls, customer):
        return (
            CartItem.objects.filter(customer=customer)
            .select_related('product__category')
            .prefetch_related('product__inventory_items')
            .order_by('-created_at')
        )

    @classmethod
    def get_cart_summary(cls, customer):
        items = cls.get_customer_cart_items(customer)
        item_data = CartItemSerializer(items, many=True).data

        total_items = sum(item.quantity or 0 for item in items)
        subtotal = sum(
            (item.quantity or 0) * (item.product.selling_price or 0)
            for item in items if item.product
        )

        return {
            'items': item_data,
            'total_items': total_items,
            'subtotal': subtotal,
            'total': subtotal,
        }

    @classmethod
    def add_to_cart(cls, customer, product_id, quantity=1):
        try:
            product = (
                Product.objects.prefetch_related('inventory_items')
                .get(product_id=product_id, is_active=True)
            )
        except Product.DoesNotExist:
            raise NotFound("Product not found or is currently inactive.")

        available_stock = cls.get_available_stock(product)
        if available_stock <= 0:
            raise ValidationError(
                f"'{product.product_name}' is currently out of stock."
            )

        existing_item = CartItem.objects.filter(
            customer=customer,
            product=product
        ).first()

        current_qty = existing_item.quantity if existing_item else 0
        desired_qty = current_qty + quantity

        if desired_qty > available_stock:
            raise ValidationError(
                f"Cannot add {quantity} item(s). Only {available_stock} available in stock "
                f"(you currently have {current_qty} in your bag)."
            )

        if existing_item:
            existing_item.quantity = desired_qty
            existing_item.save(update_fields=['quantity', 'updated_at'])
            return existing_item, False
        else:
            new_item = CartItem.objects.create(
                customer=customer,
                product=product,
                quantity=quantity
            )
            return new_item, True

    @classmethod
    def update_cart_quantity(cls, customer, product_id, quantity):
        try:
            item = (
                CartItem.objects.select_related('product')
                .prefetch_related('product__inventory_items')
                .get(customer=customer, product_id=product_id)
            )
        except CartItem.DoesNotExist:
            raise NotFound("Item not found in your shopping bag.")

        available_stock = cls.get_available_stock(item.product)
        if quantity > available_stock:
            raise ValidationError(
                f"Cannot update quantity to {quantity}. Only {available_stock} available in stock."
            )

        item.quantity = quantity
        item.save(update_fields=['quantity', 'updated_at'])
        return item

    @classmethod
    def remove_from_cart(cls, customer, product_id):
        deleted_count, _ = CartItem.objects.filter(
            customer=customer,
            product_id=product_id
        ).delete()
        return deleted_count > 0

    @classmethod
    def clear_cart(cls, customer):
        CartItem.objects.filter(customer=customer).delete()
