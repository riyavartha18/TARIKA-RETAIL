from django.urls import path
from .views import (
    CategoryListView,
    ProductListView,
    ProductDetailView,
    NewArrivalsView,
    TrendingView,
    SaleView
)

app_name = 'catalog'

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<str:product_id>/', ProductDetailView.as_view(), name='product-detail'),
    path('new-arrivals/', NewArrivalsView.as_view(), name='new-arrivals'),
    path('trending/', TrendingView.as_view(), name='trending'),
    path('sale/', SaleView.as_view(), name='sale'),
]
