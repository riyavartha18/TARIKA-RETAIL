import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { ShieldCheck, LogOut, Users, Warehouse, Truck } from 'lucide-react';

export default function AdminPlaceholder() {
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '680px', padding: '3rem', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(226, 183, 85, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: 'var(--accent-gold)'
        }}>
          <ShieldCheck size={32} />
        </div>

        <span style={{
          display: 'inline-block',
          padding: '0.35rem 1rem',
          borderRadius: '20px',
          background: 'rgba(226, 183, 85, 0.15)',
          color: 'var(--accent-gold)',
          fontSize: '0.78rem',
          fontWeight: '700',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '1rem'
        }}>
          Administrator Control Center
        </span>

        <h1 className="font-serif" style={{ fontSize: '2rem', marginBottom: '0.75rem', color: '#fff' }}>
          System Administration
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '2rem' }}>
          Authenticated as <strong>{user?.email}</strong> with role <strong>ADMIN</strong>.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
            <Users size={22} color="var(--accent-gold)" style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>Staff Management</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Backend Ready</p>
          </div>
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
            <Warehouse size={22} color="var(--accent-gold)" style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>Warehouse Scope</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Unrestricted</p>
          </div>
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
            <Truck size={22} color="var(--accent-gold)" style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>Logistics Oversight</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Enabled</p>
          </div>
        </div>

        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Admin employee management UI and warehouse analytics dashboards will be built in the upcoming modules.
        </p>

        <button onClick={logout} className="btn-secondary" style={{ width: 'auto', margin: '0 auto', padding: '0.75rem 2rem' }}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
