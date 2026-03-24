import React, { useState } from 'react';
import { Bell, X, AlertTriangle, ShieldAlert, Calculator, Target, Info, Bot, Activity } from 'lucide-react';

const ICON_MAP = {
  AlertTriangle: <AlertTriangle size={16} color="#f59e0b" />,
  ShieldAlert: <ShieldAlert size={16} color="#ef4444" />,
  Calculator: <Calculator size={16} color="#10b981" />,
  Target: <Target size={16} color="#6366f1" />,
  Info: <Info size={16} color="#3b82f6" />,
  Activity: <Activity size={16} color="#3b82f6" />,
};

export default function NotificationsPanel({ notifications = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = Array.isArray(notifications) ? notifications.length : 0;
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'rgba(255,255,255,0.05)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          color: 'white', 
          padding: '8px', 
          borderRadius: '12px', 
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px'
        }}
        title="AI Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{ 
            position: 'absolute', 
            top: -2, 
            right: -2, 
            background: '#ef4444', 
            color: 'white', 
            fontSize: '0.6rem', 
            fontWeight: 700,
            padding: '2px 5px', 
            borderRadius: '10px',
            border: '2px solid #111827',
            zIndex: 10
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            onClick={() => setIsOpen(false)} 
            style={{ position: 'fixed', inset: 0, zIndex: 1000 }} 
          />
          <div style={{ 
            position: 'fixed', 
            top: '80px', 
            left: '20px', 
            width: '280px', 
            background: '#1e293b', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '16px', 
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', 
            zIndex: 9999,
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>AI Agent Insights</span>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {notifications.length > 0 ? (
                notifications.map((n, i) => (
                  <div key={i} style={{ 
                    padding: '16px', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    display: 'flex', 
                    gap: 12,
                    background: i === 0 ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
                  }}>
                    <div style={{ marginTop: 2 }}>
                      {ICON_MAP[n.icon] || <Info size={16} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: '0.8rem', lineHeight: 1.4, color: 'rgba(255,255,255,0.9)' }}>{n.message}</span>
                      <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Agent {i + 1} • Just Now
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <Bot size={32} style={{ marginBottom: 12, opacity: 0.2 }} />
                    <p>All agents are quiet. Your finances look stable!</p>
                </div>
              )}
            </div>
            
            <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 500 }}>Proactive Monitoring Active</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
