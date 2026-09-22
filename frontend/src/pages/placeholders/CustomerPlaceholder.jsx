import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { ShoppingBag, LogOut, CheckCircle, User } from 'lucide-react';

export default function CustomerPlaceholder() {
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '3rem', textAlign: 'center' }}>
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
          <ShoppingBag size={32} />
        </div>

        <span style={{
          display: 'inline-block',
          padding: '0.35rem 1rem',
          borderRadius: '20px',
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          fontSize: '0.78rem',
          fontWeight: '700',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '1rem'
        }}>
          Customer Portal
        </span>

        <h1 className="font-serif" style={{ fontSize: '2rem', marginBottom: '0.75rem', color: '#fff' }}>
          Welcome, {user?.full_name || 'Valued Customer'}!
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '2rem' }}>
          You are authenticated as <strong>{user?.email}</strong> with role <strong>CUSTOMER</strong>.
        </p>

        <div style={{
          padding: '1.25rem',
          borderRadius: '14px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-gold)' }}>
            <CheckCircle size={18} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Part 1 Verification Status</span>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Customer authentication, role isolation, and session persistence verified. The luxury shopping catalog, personalized recommendations, and cart modules will be enabled in Part 2.
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
