import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Warehouse, LogOut, Box, MapPin } from 'lucide-react';

export default function WarehousePlaceholder() {
  const { user, warehouseId, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '3rem', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(59, 130, 246, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: '#60a5fa'
        }}>
          <Warehouse size={32} />
        </div>

        <span style={{
          display: 'inline-block',
          padding: '0.35rem 1rem',
          borderRadius: '20px',
          background: 'rgba(59, 130, 246, 0.15)',
          color: '#60a5fa',
          fontSize: '0.78rem',
          fontWeight: '700',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '1rem'
        }}>
          Warehouse Operations
        </span>

        <h1 className="font-serif" style={{ fontSize: '2rem', marginBottom: '0.75rem', color: '#fff' }}>
          Warehouse Manager Portal
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1.5rem' }}>
          Authenticated as <strong>{user?.email}</strong> with role <strong>WAREHOUSE_MANAGER</strong>.
        </p>

        {/* Assigned Warehouse Details */}
        <div style={{
          padding: '1.25rem',
          borderRadius: '14px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-gold)' }}>
            <MapPin size={18} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Assigned Warehouse Association</span>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Warehouse ID: <code style={{ background: 'rgba(0,0,0,0.4)', padding: '0.2rem 0.5rem', borderRadius: '6px', color: '#fff' }}>{warehouseId || user?.warehouse_id || 'Assigned via Backend'}</code>
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Multi-warehouse isolation active: Access is scoped exclusively to this facility. Inventory and batch intake controls will be active in Part 3.
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
