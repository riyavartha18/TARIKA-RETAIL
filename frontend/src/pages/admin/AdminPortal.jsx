import React, { useState } from 'react';
import AdminSidebar, { ADMIN_NAV_ITEMS } from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminDashboardView from './AdminDashboardView';
import AdminStaffView from './AdminStaffView';
import AdminWarehouseView from './AdminWarehouseView';
import AdminProductView from './AdminProductView';
import AdminOrderView from './AdminOrderView';
import AdminSectionPlaceholder from './AdminSectionPlaceholder';
import '../../styles/tarika.css';
import '../../styles/admin-portal.css';

export default function AdminPortal() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Find metadata for current active nav item
  const currentNavItem = ADMIN_NAV_ITEMS.find((item) => item.id === activeSection) || ADMIN_NAV_ITEMS[0];

  const handleToggleMobileMenu = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const handleCloseMobileMenu = () => {
    setIsMobileOpen(false);
  };

  return (
    <div className="admin-portal-layout">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`admin-mobile-backdrop ${isMobileOpen ? 'mobile-open' : ''}`}
        onClick={handleCloseMobileMenu}
      />

      {/* Left Sidebar Navigation */}
      <AdminSidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        isMobileOpen={isMobileOpen}
        onCloseMobile={handleCloseMobileMenu}
      />

      {/* Main Content Wrapper */}
      <div className="admin-main-wrapper">
        {/* Top Header */}
        <AdminHeader
          activeNavLabel={currentNavItem.label}
          onToggleMobileMenu={handleToggleMobileMenu}
        />

        {/* Main Section Content */}
        <main className="admin-main-content">
          {activeSection === 'dashboard' ? (
            <AdminDashboardView onNavigateSection={setActiveSection} />
          ) : activeSection === 'staff' ? (
            <AdminStaffView />
          ) : activeSection === 'warehouses' ? (
            <AdminWarehouseView />
          ) : activeSection === 'products' ? (
            <AdminProductView />
          ) : activeSection === 'orders' ? (
            <AdminOrderView />
          ) : (
            <AdminSectionPlaceholder
              title={currentNavItem.label}
              icon={currentNavItem.icon}
            />
          )}
        </main>
      </div>
    </div>
  );
}
