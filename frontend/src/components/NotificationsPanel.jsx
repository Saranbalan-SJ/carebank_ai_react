import { X, Bell, Info, AlertCircle } from 'lucide-react';

export default function NotificationsPanel({ isOpen, onClose, notifications }) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: 350,
            height: '100%',
            background: 'var(--bg-secondary)',
            borderLeft: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.3s ease-out'
        }}>
            <style>
                {`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}
            </style>
            
            <div style={{ padding: 24, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Bell size={20} style={{ color: 'var(--accent-primary)' }} />
                    <h3 style={{ margin: 0 }}>Notifications</h3>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                {notifications && notifications.length > 0 ? (
                    notifications.map((notif, i) => (
                        <div key={i} className={`alert-item ${notif.type}`} style={{ padding: 16 }}>
                            <div className="alert-icon">
                                {notif.type === 'danger' ? <AlertCircle size={18} /> : <Info size={18} />}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span style={{ fontWeight: 600 }}>{notif.title}</span>
                                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{notif.message}</span>
                                <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{notif.time}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>
                        <Bell size={40} style={{ marginBottom: 16, opacity: 0.2 }} />
                        <p>No new notifications</p>
                    </div>
                )}
            </div>
        </div>
    );
}
