import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  RefreshCw,
  X,
  Warehouse as WarehouseIcon,
  ShoppingBag,
  CreditCard,
  User,
  MapPin,
  Clock,
  XCircle,
  Truck
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { getAdminOrders, getAdminOrderDetail } from '../../services/api';

export default function AdminOrderView() {
  const { token } = useAuth();

  // States
  const [metrics, setMetrics] = useState({
    total_orders: 0,
    pending_orders: 0,
    processing_orders: 0,
    completed_orders: 0,
    cancelled_orders: 0,
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    const activeToken = token || localStorage.getItem('iras_token');
    
    const res = await getAdminOrders(activeToken, {
      search: searchTerm,
      status: statusFilter,
    });

    if (res.success) {
      setOrders(res.orders || []);
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    } else {
      setError(res.error || 'Failed to load orders.');
    }
    setLoading(false);
  }, [token, searchTerm, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenDetails = async (orderId) => {
    setDetailsLoading(true);
    setDetailsError(null);
    setSelectedOrder({ order_id: orderId }); // Placeholder to open modal immediately
    
    const activeToken = token || localStorage.getItem('iras_token');
    const res = await getAdminOrderDetail(activeToken, orderId);
    
    if (res.success) {
      setSelectedOrder(res.order);
    } else {
      setDetailsError(res.error || 'Failed to load order details.');
    }
    setDetailsLoading(false);
  };

  const closeDetails = () => {
    setSelectedOrder(null);
  };

  const renderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('pending')) return <span className="status-badge warning"><Clock size={14} className="mr-1" /> Pending</span>;
    if (s.includes('processing')) return <span className="status-badge info"><RefreshCw size={14} className="mr-1" /> Processing</span>;
    if (s.includes('delivered') || s.includes('completed')) return <span className="status-badge success"><CheckCircle2 size={14} className="mr-1" /> Delivered</span>;
    if (s.includes('cancelled') || s.includes('failed')) return <span className="status-badge error"><XCircle size={14} className="mr-1" /> Cancelled</span>;
    return <span className="status-badge default">{status || 'Unknown'}</span>;
  };

  return (
    <div className="admin-view fade-in">
      {/* Header */}
      <div className="view-header">
        <div className="header-content">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ShoppingBag className="text-primary" size={28} />
            Order Management
          </h1>
          <p className="text-gray-500 mt-1">
            Monitor and manage retail orders across customers, warehouses, and fulfillment operations.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={fetchOrders}>
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper bg-gray-100 text-gray-700">
            <Package size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Orders</span>
            <span className="kpi-value">{metrics.total_orders}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon-wrapper bg-amber-100 text-amber-600">
            <Clock size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Pending</span>
            <span className="kpi-value">{metrics.pending_orders}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon-wrapper bg-blue-100 text-blue-600">
            <RefreshCw size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Processing</span>
            <span className="kpi-value">{metrics.processing_orders}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon-wrapper bg-green-100 text-green-600">
            <CheckCircle2 size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Completed</span>
            <span className="kpi-value">{metrics.completed_orders}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon-wrapper bg-red-100 text-red-600">
            <XCircle size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Cancelled</span>
            <span className="kpi-value">{metrics.cancelled_orders}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer, or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <div className="filter-item">
            <Filter size={16} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container">
        {loading ? (
          <div className="empty-state">
            <RefreshCw className="animate-spin text-primary mb-3" size={32} />
            <p>Loading orders...</p>
          </div>
        ) : error ? (
          <div className="empty-state text-red-500">
            <AlertTriangle size={32} className="mb-3" />
            <p>{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <Package size={32} className="mb-3 text-gray-400" />
            <p>No orders found matching your criteria.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Warehouse</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.order_id}>
                  <td className="font-medium text-primary">#{order.order_id.substring(0, 8).toUpperCase()}</td>
                  <td>
                    <div className="text-sm font-medium">{order.customer?.full_name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{order.customer?.email || ''}</div>
                  </td>
                  <td className="text-sm text-gray-600">{order.order_date || 'N/A'}</td>
                  <td>
                    {order.warehouse ? (
                      <span className="flex items-center gap-1 text-sm">
                        <WarehouseIcon size={14} className="text-gray-400" />
                        {order.warehouse.warehouse_name}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">Unassigned</span>
                    )}
                  </td>
                  <td className="font-semibold">${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                  <td>{renderStatusBadge(order.order_status)}</td>
                  <td>
                    <button className="btn-icon" onClick={() => handleOpenDetails(order.order_id)} title="View Details">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ShoppingBag size={24} className="text-primary" />
                Order Details
              </h2>
              <button className="close-btn" onClick={closeDetails}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              {detailsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                  <RefreshCw className="animate-spin text-primary mb-3" size={32} />
                  <p>Loading complete order information...</p>
                </div>
              ) : detailsError ? (
                <div className="py-12 flex flex-col items-center justify-center text-red-500">
                  <AlertTriangle size={32} className="mb-3" />
                  <p>{detailsError}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Top Details Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order ID</p>
                      <p className="font-semibold text-primary">#{selectedOrder.order_id?.substring(0,8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date</p>
                      <p className="font-medium text-gray-800">{selectedOrder.order_date || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
                      {renderStatusBadge(selectedOrder.order_status)}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payment</p>
                      <div className="flex items-center gap-1 font-medium text-gray-800">
                        <CreditCard size={14} className="text-gray-400" />
                        {selectedOrder.payment_status || 'Unknown'}
                      </div>
                    </div>
                  </div>

                  {/* Customer and Shipping Row */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="border border-gray-100 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                        <User size={16} className="text-gray-500" /> Customer Information
                      </h3>
                      {selectedOrder.customer ? (
                        <div className="space-y-2 text-sm">
                          <p><span className="text-gray-500 w-24 inline-block">Name:</span> <span className="font-medium">{selectedOrder.customer.full_name}</span></p>
                          <p><span className="text-gray-500 w-24 inline-block">Email:</span> {selectedOrder.customer.email}</p>
                          <p><span className="text-gray-500 w-24 inline-block">Phone:</span> {selectedOrder.customer.phone || 'N/A'}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No customer information available.</p>
                      )}
                    </div>

                    <div className="border border-gray-100 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                        <Truck size={16} className="text-gray-500" /> Fulfillment
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-start gap-2">
                          <WarehouseIcon size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <span>
                            <span className="text-gray-500 block">Assigned Warehouse:</span>
                            {selectedOrder.warehouse ? selectedOrder.warehouse.warehouse_name : 'Unassigned'}
                          </span>
                        </p>
                        <p className="flex items-start gap-2">
                          <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <span>
                            <span className="text-gray-500 block">Shipping Address:</span>
                            {selectedOrder.shipping_address || 'No address provided'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Package size={18} className="text-primary" /> Order Items
                    </h3>
                    <div className="border border-gray-100 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="py-2 px-4 font-medium">Product</th>
                            <th className="py-2 px-4 font-medium text-right">Price</th>
                            <th className="py-2 px-4 font-medium text-center">Qty</th>
                            <th className="py-2 px-4 font-medium text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedOrder.items && selectedOrder.items.length > 0 ? (
                            selectedOrder.items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="py-3 px-4">
                                  <div className="font-medium text-gray-800">{item.product?.product_name || 'Unknown Product'}</div>
                                  <div className="text-xs text-gray-500">SKU: {item.product?.sku || 'N/A'}</div>
                                </td>
                                <td className="py-3 px-4 text-right">${parseFloat(item.price_at_time || 0).toFixed(2)}</td>
                                <td className="py-3 px-4 text-center">{item.quantity}</td>
                                <td className="py-3 px-4 text-right font-medium">
                                  ${(parseFloat(item.price_at_time || 0) * parseInt(item.quantity || 0, 10)).toFixed(2)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="py-6 text-center text-gray-400 italic">No items found for this order.</td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan="3" className="py-3 px-4 text-right font-medium text-gray-600">Subtotal</td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-800">
                              ${parseFloat(selectedOrder.total_amount || 0).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    <p>
                      Note: Order status modifications are currently managed exclusively by the Warehouse Manager module. 
                      Administrators have view-only access to order status in this dashboard.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeDetails}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
