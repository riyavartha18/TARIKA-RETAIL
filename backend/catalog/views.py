import math
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.pagination import PageNumberPagination
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404

from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer
)
from .services import CatalogService


class StandardCatalogPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        total_pages = math.ceil(self.page.paginator.count / self.get_page_size(self.request))
        return Response({
            'count': self.page.paginator.count,
            'total_pages': total_pages,
            'current_page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })


class CategoryListView(APIView):
    """
    GET /api/catalog/categories/
    Returns all available product categories with product count and image URLs.
    Publicly accessible.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        # Annotate each category with count of active products
        categories = (
            Category.objects.all()
            .annotate(
                product_count=Count('products', filter=Q(products__is_active=True))
            )
            .order_by('category_name')
        )
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProductListView(APIView):
    """
    GET /api/catalog/products/
    Returns paginated list of active products with support for:
      - category: filter by category_id (UUID) or category_name
      - search: text search across product_name, description, color, material, sku
      - min_price: filter selling_price >= min_price
      - max_price: filter selling_price <= max_price
      - sort: newest, price_low_high, price_high_low, name
    Publicly accessible.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        category = request.query_params.get('category')
        search = request.query_params.get('search')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        sort = request.query_params.get('sort')

        queryset = CatalogService.filter_and_sort_products(
            category=category,
            search=search,
            min_price=min_price,
            max_price=max_price,
            sort=sort
        )

        paginator = StandardCatalogPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = ProductListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = ProductListSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProductDetailView(APIView):
    """
    GET /api/catalog/products/<product_id>/
    Returns complete product details including:
      - All database columns
      - Category details
      - Total stock and in_stock flag
      - Warehouse inventory breakdown
      - Rating summary from reviews
    Publicly accessible.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, product_id):
        product = get_object_or_404(
            Product.objects.select_related('category').prefetch_related('inventory_items__warehouse', 'reviews'),
            product_id=product_id
        )
        serializer = ProductDetailSerializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NewArrivalsView(APIView):
    """
    GET /api/catalog/new-arrivals/
    Returns the newest launched / added products.
    Accepts optional ?limit= query parameter (default 12).
    Publicly accessible.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        limit = request.query_params.get('limit', 12)
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            limit = 12

        products = CatalogService.get_new_arrivals(limit=limit)
        serializer = ProductListSerializer(products, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data
        }, status=status.HTTP_200_OK)


class TrendingView(APIView):
    """
    GET /api/catalog/trending/
    Returns trending products based on total sales volume in order_items.
    Accepts optional ?limit= query parameter (default 12).
    Publicly accessible.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        limit = request.query_params.get('limit', 12)
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            limit = 12

        products = CatalogService.get_trending(limit=limit)
        serializer = ProductListSerializer(products, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data
        }, status=status.HTTP_200_OK)


class SaleView(APIView):
    """
    GET /api/catalog/sale/
    Returns products on sale or promotional clearance.
    Accepts optional ?limit= query parameter (default 12).
    Publicly accessible.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        limit = request.query_params.get('limit', 12)
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            limit = 12

        products = CatalogService.get_sale_products(limit=limit)
        serializer = ProductListSerializer(products, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data
        }, status=status.HTTP_200_OK)
