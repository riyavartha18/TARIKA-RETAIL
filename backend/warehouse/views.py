import math
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.pagination import PageNumberPagination

from accounts.permissions import IsAuthenticatedUser, IsWarehouseManager
from .services import WarehouseService
from .serializers import (
    WarehouseCategoryGroupedSerializer,
    WarehouseOrderSerializer,
    WarehouseOrderDetailSerializer,
    WarehouseDeliverySerializer,
    WarehouseReturnSerializer,
    WarehouseProductDetailSerializer,
    WarehouseProductUpdateSerializer,
)
from catalog.models import Product
from .models import Order



class StandardWarehousePagination(PageNumberPagination):
    page_size = 15
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


class WarehouseGroupedProductsView(APIView):
    """
    GET /api/warehouse/products/grouped/
    Returns active products grouped according to database categories.
    Single DB query + Python grouping = fast response.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        categories = WarehouseService.get_grouped_category_products()
        # categories is already a list of plain dicts — return directly
        return Response({
            'count': len(categories),
            'categories': categories
        }, status=status.HTTP_200_OK)


class WarehouseProductDetailView(APIView):
    """
    GET  /api/warehouse/products/<product_id>/
        Fetch full product details including inventory-derived stock figures.
        availability_label ('Available' / 'Out of Stock') is computed by
        Django — React must display this value directly.

    PUT  /api/warehouse/products/<product_id>/
        Validate and persist editable product fields.
        Returns the updated product (with refreshed stock data) on success.
        Returns validation errors on failure.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, product_id):
        try:
            product = WarehouseService.get_product_detail(product_id)
        except Product.DoesNotExist:
            return Response(
                {'detail': f'Product "{product_id}" not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = WarehouseProductDetailSerializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, product_id):
        # 1. Verify the product exists before touching anything
        try:
            WarehouseService.get_product_detail(product_id)  # raises DoesNotExist if missing
        except Product.DoesNotExist:
            return Response(
                {'detail': f'Product "{product_id}" not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # 2. Validate incoming data via Django serializer
        write_serializer = WarehouseProductUpdateSerializer(data=request.data)
        if not write_serializer.is_valid():
            return Response(
                {'errors': write_serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Persist to database via service layer
        try:
            updated_product = WarehouseService.update_product(
                product_id, write_serializer.validated_data
            )
        except Exception as exc:
            return Response(
                {'detail': f'Database error: {str(exc)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 4. Serialise and return the updated product (with fresh inventory stock)
        read_serializer = WarehouseProductDetailSerializer(updated_product)
        return Response(
            {
                'message': 'Product updated successfully.',
                'product': read_serializer.data,
            },
            status=status.HTTP_200_OK
        )



class WarehouseOrdersView(APIView):
    """
    GET /api/warehouse/orders/
    Returns paginated database orders with support for search, status, and page.
    """
    permission_classes = [AllowAny]
    authentication_classes = []


    def get(self, request):
        search = request.query_params.get('search')
        order_status = request.query_params.get('status')
        warehouse_id = request.query_params.get('warehouse')

        queryset = WarehouseService.get_orders(
            search=search,
            status=order_status,
            warehouse_id=warehouse_id
        )

        paginator = StandardWarehousePagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = WarehouseOrderSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = WarehouseOrderSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WarehouseOrderDetailView(APIView):
    """
    GET /api/warehouse/orders/<order_id>/
    Fetch complete order detail including customer info and all related order items & products.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, order_id):
        try:
            order = WarehouseService.get_order_detail(order_id)
        except Order.DoesNotExist:
            return Response(
                {'detail': f'Order "{order_id}" not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = WarehouseOrderDetailSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)



class WarehouseDeliveriesView(APIView):
    """
    GET /api/warehouse/deliveries/
    Returns paginated database deliveries with support for search, status, partner.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        search = request.query_params.get('search')
        delivery_status = request.query_params.get('status')
        partner = request.query_params.get('partner')
        warehouse_id = request.query_params.get('warehouse')

        queryset = WarehouseService.get_deliveries(
            search=search,
            status=delivery_status,
            partner=partner,
            warehouse_id=warehouse_id
        )

        paginator = StandardWarehousePagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = WarehouseDeliverySerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = WarehouseDeliverySerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WarehouseReturnsView(APIView):
    """
    GET /api/warehouse/returns/
    Returns paginated database returns with support for search, status, reason.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        search = request.query_params.get('search')
        return_status = request.query_params.get('status')
        reason = request.query_params.get('reason')

        queryset = WarehouseService.get_returns(
            search=search,
            status=return_status,
            reason=reason
        )

        paginator = StandardWarehousePagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = WarehouseReturnSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = WarehouseReturnSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WarehouseProfileView(APIView):
    """
    GET /api/warehouse/profile/
    Returns authenticated Warehouse Manager profile and assigned facility details.
    """
    permission_classes = [IsAuthenticatedUser, IsWarehouseManager]

    def get(self, request):
        user = request.user
        return Response({
            'user': {
                'id': user.auth_user_id,
                'email': user.email,
                'role': user.role,
                'warehouse_id': user.warehouse_id,
                'is_active': user.is_active,
            }
        }, status=status.HTTP_200_OK)


class WarehouseReturnAcceptView(APIView):
    """
    PATCH /api/warehouse/returns/<return_id>/accept/
    Accepts a return request. Only allowed when current status is 'Requested'.
    Updates return_status to 'Accepted' and computes refund_amount.
    All validation and DB update handled by Django service layer.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def patch(self, request, return_id):
        try:
            updated_return = WarehouseService.accept_return(return_id)
        except Exception as exc:
            err_msg = str(exc)
            if 'not found' in err_msg.lower():
                return Response({'detail': err_msg}, status=status.HTTP_404_NOT_FOUND)
            return Response({'detail': err_msg}, status=status.HTTP_400_BAD_REQUEST)

        serializer = WarehouseReturnSerializer(updated_return)
        return Response({
            'message': 'Return accepted successfully.',
            'return': serializer.data,
        }, status=status.HTTP_200_OK)


class WarehouseReturnRejectView(APIView):
    """
    PATCH /api/warehouse/returns/<return_id>/reject/
    Rejects a return request. Only allowed when current status is 'Requested'.
    Updates return_status to 'Rejected'.
    All validation and DB update handled by Django service layer.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def patch(self, request, return_id):
        try:
            updated_return = WarehouseService.reject_return(return_id)
        except Exception as exc:
            err_msg = str(exc)
            if 'not found' in err_msg.lower():
                return Response({'detail': err_msg}, status=status.HTTP_404_NOT_FOUND)
            return Response({'detail': err_msg}, status=status.HTTP_400_BAD_REQUEST)

        serializer = WarehouseReturnSerializer(updated_return)
        return Response({
            'message': 'Return rejected successfully.',
            'return': serializer.data,
        }, status=status.HTTP_200_OK)

