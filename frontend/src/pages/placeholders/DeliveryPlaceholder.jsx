import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Truck, LogOut, CheckCircle } from 'lucide-react';

export default function DeliveryPlaceholder() {
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '3rem', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(245, 158, 11, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: '#fbbf24'
        }}>
          <Truck size={32} />
        </div>

        <span style={{
          display: 'inline-block',
          padding: '0.35rem 1rem',
          borderRadius: '20px',
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          fontSize: '0.78rem',
          fontWeight: '700',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '1rem'
        }}>
          Logistics Dispatch
        </span>

        <h1 className="font-serif" style={{ fontSize: '2rem', marginBottom: '0.75rem', color: '#fff' }}>
          Delivery Partner Portal
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '2rem' }}>
          Authenticated as <strong>{user?.email}</strong> with role <strong>DELIVERY_PARTNER</strong>.
        </p>

        <div style={{
          padding: '1.25rem',
          borderRadius: '14px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#fbbf24' }}>
            <CheckCircle size={18} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Courier Status: Active</span>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Warehouse assignment is Null (system-wide dispatching). Real-time route optimization, package verification, and delivery assignment will be enabled in the delivery management module.
          </p>
        </div>

        <button onClick={logout} className="btn-secondary" style={{ width: 'auto', margin: '0 auto', padding: '0.75rem 2rem' }}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
