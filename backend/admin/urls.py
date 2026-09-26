from django.urls import path

from admin.views import (
    AdminCreateStaffView,
    AdminDashboardStatsView,
    AdminOrderDetailView,
    AdminOrderListView,
    AdminProductCreateView,
    AdminProductListView,
    AdminStaffListView,
    AdminStaffToggleStatusView,
    AdminWarehouseListView,
)

app_name = 'admin_module'

urlpatterns = [
    path('dashboard/', AdminDashboardStatsView.as_view(), name='dashboard'),
    path('staff/', AdminStaffListView.as_view(), name='staff-list'),
    path('staff/create/', AdminCreateStaffView.as_view(), name='staff-create'),
    path('staff/<int:employee_id>/toggle-status/', AdminStaffToggleStatusView.as_view(), name='staff-toggle-status'),
    path('warehouses/', AdminWarehouseListView.as_view(), name='warehouses'),
    path('products/', AdminProductListView.as_view(), name='products'),
    path('products/create/', AdminProductCreateView.as_view(), name='products-create'),
    path('orders/', AdminOrderListView.as_view(), name='orders'),
    path('orders/<str:order_id>/', AdminOrderDetailView.as_view(), name='order-detail'),
]
