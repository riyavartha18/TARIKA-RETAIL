from django.db.models import Count, Q, Sum, Case, When, Value, IntegerField
from django.db.models.functions import Coalesce
from catalog.models import Category, Product, Inventory
from .models import Order, Delivery, Return, Payment
import datetime



class WarehouseService:
    @staticmethod
    def get_grouped_category_products(warehouse_id=None):
        """
        Fetch all active products in ONE query, then group by category in Python.
        Annotates total stock quantity from the inventory table.
        Returns a list of plain dicts ready for direct JSON serialization.
        """
        from catalog.serializers import CATEGORY_IMAGE_MAPPING

        # Query all active products with category, manufacturer & total inventory stock
        products = (
            Product.objects
            .filter(Q(is_active=True) | Q(is_active__isnull=True))
            .select_related('category', 'manufacturer')
            .annotate(stock_qty=Coalesce(Sum('inventory_items__stock_quantity'), 0))
            .order_by('category__category_name', 'product_name')
        )

        # Group in Python
        cat_map = {}
        for p in products:
            cat = p.category
            if cat is None:
                continue
            cid = cat.category_id
            if cid not in cat_map:
                cat_name = cat.category_name or ''
                cat_map[cid] = {
                    'category_id': cid,
                    'category_name': cat_name,
                    'parent_category_id': cat.parent_category_id,
                    'description': cat.description or '',
                    'image': CATEGORY_IMAGE_MAPPING.get(cat_name.strip().lower()),
                    'product_count': 0,
                    'products': []
                }
            cat_name_lower = (p.category.category_name or '').strip().lower()
            total_stock_val = int(getattr(p, 'stock_qty', 0) or 0)
            cat_map[cid]['products'].append({
                'product_id': p.product_id,
                'product_name': p.product_name,
                'category_id': cid,
                'category_name': cat.category_name,
                'manufacturer_id': p.manufacturer_id,
                'manufacturer_name': p.manufacturer.manufacturer_name if p.manufacturer else None,
                'sku': p.sku,
                'description': p.description,
                'gender': p.gender,
                'color': p.color,
                'size': p.size,
                'material': p.material,
                'base_price': p.base_price,
                'selling_price': p.selling_price,
                'launch_date': p.launch_date,
                'is_active': p.is_active,
                'in_stock': total_stock_val > 0,
                'total_stock': total_stock_val,
                'image': CATEGORY_IMAGE_MAPPING.get(cat_name_lower),
            })
            cat_map[cid]['product_count'] += 1

        return sorted(cat_map.values(), key=lambda c: c['category_name'])

    @staticmethod
    def get_product_detail(product_id):
        """
        Fetch a single product by product_id with category, manufacturer,
        and prefetched inventory items so the serializer can compute
        total_stock without extra queries.

        Returns the Product ORM instance or raises Product.DoesNotExist.
        """
        return (
            Product.objects
            .select_related('category', 'manufacturer')
            .prefetch_related('inventory_items')
            .get(product_id=product_id)
        )

    @staticmethod
    def update_product(product_id, validated_data):
        """
        Apply validated_data to the product identified by product_id and
        persist it to the database.  All business-rule validation is expected
        to have been done by the serializer before calling this method.

        Returns the updated Product instance (with inventory prefetched so the
        response serializer can compute in_stock / total_stock immediately).

        Raises Product.DoesNotExist if no product matches product_id.
        """
        product = (
            Product.objects
            .select_related('category', 'manufacturer')
            .get(product_id=product_id)
        )

        # Apply each validated field
        updatable_fields = [
            'product_name', 'description', 'gender', 'color',
            'size', 'material', 'base_price', 'selling_price',
            'launch_date', 'is_active',
        ]
        for field in updatable_fields:
            if field in validated_data:
                value = validated_data[field]
                # Normalise empty strings to None for optional text fields
                if value == '' and field in ('description', 'gender', 'color', 'size', 'material', 'launch_date'):
                    value = None
                setattr(product, field, value)

        # Stamp updated_at with current UTC timestamp string
        product.updated_at = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S')

        product.save()

        # Update stock quantity in inventory table if provided
        if 'stock_quantity' in validated_data and validated_data['stock_quantity'] is not None:
            new_stock = validated_data['stock_quantity']
            inventory_items = Inventory.objects.filter(product_id=product_id)
            if inventory_items.exists():
                first_item = inventory_items.first()
                first_item.stock_quantity = new_stock
                first_item.last_restock_date = datetime.datetime.utcnow().strftime('%Y-%m-%d')
                first_item.save()
            else:
                import uuid
                Inventory.objects.create(
                    inventory_id=str(uuid.uuid4()),
                    product_id=product_id,
                    stock_quantity=new_stock,
                    last_restock_date=datetime.datetime.utcnow().strftime('%Y-%m-%d')
                )

        # Re-fetch with inventory so caller can serialise stock fields
        return (
            Product.objects
            .select_related('category', 'manufacturer')
            .prefetch_related('inventory_items')
            .get(product_id=product_id)
        )

    @staticmethod
    def get_orders(search=None, status=None, warehouse_id=None):
        """
        Queries database orders with pre-fetched customer and warehouse relations.
        Supports search across order_id, customer full_name, email, shipping_address.
        """
        qs = Order.objects.select_related('customer', 'warehouse').all()


        if warehouse_id:
            qs = qs.filter(warehouse_id=warehouse_id)

        if status and status.lower() != 'all':
            qs = qs.filter(order_status__iexact=status)

        if search:
            q = search.strip()
            qs = qs.filter(
                Q(order_id__icontains=q) |
                Q(customer__full_name__icontains=q) |
                Q(customer__email__icontains=q) |
                Q(shipping_address__icontains=q)
            )

        return qs.order_by('-order_date', '-created_at')

    @staticmethod
    def get_order_detail(order_id):
        """
        Fetch a single order by order_id with pre-fetched customer and warehouse relations.
        Raises Order.DoesNotExist if not found.
        """
        return Order.objects.select_related('customer', 'warehouse').get(order_id=order_id)


    @staticmethod
    def get_deliveries(search=None, status=None, partner=None, warehouse_id=None):
        """
        Queries database deliveries with pre-fetched order, customer, and warehouse.
        """
        qs = Delivery.objects.select_related('order__customer', 'warehouse').all()

        if warehouse_id:
            qs = qs.filter(warehouse_id=warehouse_id)

        if status and status.lower() != 'all':
            qs = qs.filter(delivery_status__iexact=status)

        if partner and partner.lower() != 'all':
            qs = qs.filter(delivery_partner__icontains=partner)

        if search:
            q = search.strip()
            qs = qs.filter(
                Q(delivery_id__icontains=q) |
                Q(order_id__icontains=q) |
                Q(delivery_partner__icontains=q) |
                Q(order__customer__full_name__icontains=q)
            )

        return qs.order_by('-dispatch_date')

    @staticmethod
    def get_returns(search=None, status=None, reason=None):
        """
        Queries database returns with pre-fetched order_item, product, and customer.
        When no status filter is applied, returns with status 'requested' appear FIRST.
        """
        qs = Return.objects.select_related('order_item__product', 'customer').all()

        if status and status.lower() != 'all':
            qs = qs.filter(return_status__iexact=status)

        if reason and reason.lower() != 'all':
            qs = qs.filter(return_reason__icontains=reason)

        if search:
            q = search.strip()
            qs = qs.filter(
                Q(return_id__icontains=q) |
                Q(order_item__order_id__icontains=q) |
                Q(customer__full_name__icontains=q) |
                Q(order_item__product__product_name__icontains=q) |
                Q(return_reason__icontains=q)
            )

        # Annotate: 'requested' returns get priority 0, all others get 1
        qs = qs.annotate(
            is_requested=Case(
                When(return_status__iexact='requested', then=Value(0)),
                default=Value(1),
                output_field=IntegerField()
            )
        )

        return qs.order_by('is_requested', '-return_date')

    @staticmethod
    def accept_return(return_id):
        """
        Accept a return request. Only allowed when return_status is 'requested'.
        Updates return_status to 'Accepted'. Computes refund_amount from order_item
        if not already set. Persists changes to the database.
        """
        try:
            ret = Return.objects.select_related(
                'order_item__product', 'customer'
            ).get(return_id=return_id)
        except Return.DoesNotExist:
            raise Return.DoesNotExist(f"Return '{return_id}' not found.")

        if (ret.return_status or '').strip().lower() != 'requested':
            raise ValueError(
                f"Cannot accept return '{return_id}': current status is '{ret.return_status}'. "
                "Only 'Requested' returns can be accepted."
            )

        ret.return_status = 'Accepted'

        # Compute refund_amount from order_item if not already set
        if ret.refund_amount is None or ret.refund_amount == 0:
            if ret.order_item:
                subtotal = getattr(ret.order_item, 'subtotal', None)
                if not subtotal:
                    unit_price = getattr(ret.order_item, 'unit_price', None)
                    qty = getattr(ret.order_item, 'quantity', 1) or 1
                    if unit_price:
                        subtotal = float(unit_price) * int(qty)
                if subtotal:
                    ret.refund_amount = float(subtotal)

        ret.save()

        return Return.objects.select_related(
            'order_item__product', 'customer'
        ).get(return_id=return_id)

    @staticmethod
    def reject_return(return_id):
        """
        Reject a return request. Only allowed when return_status is 'requested'.
        Updates return_status to 'Rejected' and persists to the database.
        """
        try:
            ret = Return.objects.select_related(
                'order_item__product', 'customer'
            ).get(return_id=return_id)
        except Return.DoesNotExist:
            raise Return.DoesNotExist(f"Return '{return_id}' not found.")

        if (ret.return_status or '').strip().lower() != 'requested':
            raise ValueError(
                f"Cannot reject return '{return_id}': current status is '{ret.return_status}'. "
                "Only 'Requested' returns can be rejected."
            )

        ret.return_status = 'Rejected'
        ret.save()

        return Return.objects.select_related(
            'order_item__product', 'customer'
        ).get(return_id=return_id)
