from django.urls import path
from .views import (
    WarehouseGroupedProductsView,
    WarehouseProductDetailView,
    WarehouseOrdersView,
    WarehouseOrderDetailView,
    WarehouseDeliveriesView,
    WarehouseReturnsView,
    WarehouseProfileView,
    WarehouseReturnAcceptView,
    WarehouseReturnRejectView,
)

app_name = 'warehouse'

urlpatterns = [
    path('products/grouped/', WarehouseGroupedProductsView.as_view(), name='grouped-products'),
    # Product detail + edit: GET /api/warehouse/products/<id>/ and PUT /api/warehouse/products/<id>/
    path('products/<str:product_id>/', WarehouseProductDetailView.as_view(), name='product-detail'),
    path('orders/', WarehouseOrdersView.as_view(), name='orders'),
    path('orders/<str:order_id>/', WarehouseOrderDetailView.as_view(), name='order-detail'),
    path('deliveries/', WarehouseDeliveriesView.as_view(), name='deliveries'),
    path('returns/', WarehouseReturnsView.as_view(), name='returns'),
    # Accept / Reject a return request (status must be 'Requested')
    path('returns/<str:return_id>/accept/', WarehouseReturnAcceptView.as_view(), name='return-accept'),
    path('returns/<str:return_id>/reject/', WarehouseReturnRejectView.as_view(), name='return-reject'),
    path('profile/', WarehouseProfileView.as_view(), name='profile'),
]
