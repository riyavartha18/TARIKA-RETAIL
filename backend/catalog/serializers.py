from rest_framework import serializers
from .models import Category, Product, Inventory, Review


CATEGORY_IMAGE_MAPPING = {
    'dresses': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80',
    't-shirts': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    'shirts': 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80',
    'jeans': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80',
    'trousers': 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80',
    'kurtis': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
    'sarees': 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80',
    'jackets': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
    'sweaters': 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80',
    'ethnic wear': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
    'footwear': 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80',
    'handbags': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80',
    'accessories': 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&auto=format&fit=crop&q=80',
    'kids wear': 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=600&auto=format&fit=crop&q=80',
}


class CategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = [
            'category_id',
            'category_name',
            'parent_category_id',
            'description',
            'image',
            'product_count',
            'created_at'
        ]

    def get_image(self, obj):
        name = (obj.category_name or '').strip().lower()
        return CATEGORY_IMAGE_MAPPING.get(name, None)


class WarehouseStockSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source='warehouse.warehouse_name', read_only=True)
    city = serializers.CharField(source='warehouse.city', read_only=True)
    state = serializers.CharField(source='warehouse.state', read_only=True)

    class Meta:
        model = Inventory
        fields = [
            'warehouse_id',
            'warehouse_name',
            'city',
            'state',
            'stock_quantity',
            'reorder_level',
            'last_restock_date'
        ]


class ProductListSerializer(serializers.ModelSerializer):
    category_id = serializers.CharField(source='category.category_id', read_only=True)
    category_name = serializers.CharField(source='category.category_name', read_only=True)
    in_stock = serializers.SerializerMethodField()
    total_stock = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'product_id',
            'product_name',
            'category_id',
            'category_name',
            'sku',
            'description',
            'gender',
            'color',
            'size',
            'material',
            'base_price',
            'selling_price',
            'launch_date',
            'is_active',
            'in_stock',
            'total_stock',
            'image'
        ]

    def get_total_stock(self, obj):
        # If annotated by queryset service (total_stock_annotated)
        if hasattr(obj, 'total_stock_annotated') and obj.total_stock_annotated is not None:
            return int(obj.total_stock_annotated)
        if hasattr(obj, '_prefetched_objects_cache') and 'inventory_items' in obj._prefetched_objects_cache:
            items = obj._prefetched_objects_cache['inventory_items']
            return sum(item.stock_quantity or 0 for item in items)
        try:
            return sum(item.stock_quantity or 0 for item in obj.inventory_items.all())
        except (Exception, AssertionError):
            return 0

    def get_in_stock(self, obj):
        return self.get_total_stock(obj) > 0

    def get_image(self, obj):
        cat_name = (obj.category.category_name if obj.category else '').strip().lower()
        return CATEGORY_IMAGE_MAPPING.get(cat_name, None)


class ProductDetailSerializer(serializers.ModelSerializer):
    category_id = serializers.CharField(source='category.category_id', read_only=True)
    category_name = serializers.CharField(source='category.category_name', read_only=True)
    category = CategorySerializer(read_only=True)
    in_stock = serializers.SerializerMethodField()
    total_stock = serializers.SerializerMethodField()
    inventory_breakdown = serializers.SerializerMethodField()
    rating_summary = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'product_id',
            'product_name',
            'category_id',
            'category_name',
            'category',
            'manufacturer_id',
            'sku',
            'description',
            'gender',
            'color',
            'size',
            'material',
            'cost_price',
            'base_price',
            'selling_price',
            'launch_date',
            'is_active',
            'created_at',
            'updated_at',
            'in_stock',
            'total_stock',
            'inventory_breakdown',
            'rating_summary',
            'image'
        ]

    def get_total_stock(self, obj):
        if hasattr(obj, 'total_stock_annotated') and obj.total_stock_annotated is not None:
            return int(obj.total_stock_annotated)
        if hasattr(obj, '_prefetched_objects_cache') and 'inventory_items' in obj._prefetched_objects_cache:
            items = obj._prefetched_objects_cache['inventory_items']
            return sum(item.stock_quantity or 0 for item in items)
        try:
            return sum(item.stock_quantity or 0 for item in obj.inventory_items.all())
        except (Exception, AssertionError):
            return 0

    def get_in_stock(self, obj):
        return self.get_total_stock(obj) > 0

    def get_inventory_breakdown(self, obj):
        if hasattr(obj, '_prefetched_objects_cache') and 'inventory_items' in obj._prefetched_objects_cache:
            items = obj._prefetched_objects_cache['inventory_items']
            return WarehouseStockSerializer(items, many=True).data
        try:
            items = obj.inventory_items.select_related('warehouse').all()
            return WarehouseStockSerializer(items, many=True).data
        except (Exception, AssertionError):
            return []

    def get_rating_summary(self, obj):
        if hasattr(obj, '_prefetched_objects_cache') and 'reviews' in obj._prefetched_objects_cache:
            reviews = obj._prefetched_objects_cache['reviews']
            ratings = [r.rating for r in reviews if getattr(r, 'rating', None) is not None]
            review_count = len(ratings)
            average_rating = round(sum(ratings) / review_count, 2) if review_count > 0 else None
            return {
                'average_rating': average_rating,
                'review_count': review_count
            }
        try:
            reviews = obj.reviews.all()
            ratings = [r.rating for r in reviews if getattr(r, 'rating', None) is not None]
            review_count = len(ratings)
            average_rating = round(sum(ratings) / review_count, 2) if review_count > 0 else None
            return {
                'average_rating': average_rating,
                'review_count': review_count
            }
        except (Exception, AssertionError):
            return {'average_rating': None, 'review_count': 0}

    def get_image(self, obj):
        cat_name = (obj.category.category_name if obj.category else '').strip().lower()
        return CATEGORY_IMAGE_MAPPING.get(cat_name, None)
