import { ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { User, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  LayoutDashboard,
  Heart,
  FileText,
  Building2,
  Users,
  BarChart3,
  Flag,
  Wallet,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';

const REPORTS_LAST_SEEN_KEY = 'admin_reports_last_seen';

interface LayoutProps {
  children: ReactNode;
  user: User;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/donations', icon: Wallet, label: 'Dons Admin' },
  { path: '/requests', icon: Heart, label: 'Demandes' },
  { path: '/posts', icon: FileText, label: 'Publications' },
  { path: '/organizations', icon: Building2, label: 'Associations' },
  { path: '/users', icon: Users, label: 'Utilisateurs' },
  { path: '/stats', icon: BarChart3, label: 'Statistiques' },
  { path: '/reports', icon: Flag, label: 'Signalements' },
];

export function Layout({ children, user }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newReportsCount, setNewReportsCount] = useState(0);

  // Listen for new pending reports in real-time
  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lastSeen = parseInt(localStorage.getItem(REPORTS_LAST_SEEN_KEY) || '0', 10);
      let count = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toMillis?.() || data.createdAt || 0;
        if (createdAt > lastSeen) {
          count++;
        }
      });
      setNewReportsCount(count);
    });

    return () => unsubscribe();
  }, []);

  // When visiting the reports page, mark as read
  useEffect(() => {
    if (location.pathname === '/reports') {
      localStorage.setItem(REPORTS_LAST_SEEN_KEY, Date.now().toString());
      setNewReportsCount(0);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '260px' : '70px',
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'fixed',
        height: '100vh',
        zIndex: 100
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '700',
                fontSize: '16px'
              }}>Z</div>
              <span style={{ fontWeight: '700', fontSize: '18px' }}>ZaKaT Admin</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? 'var(--primary)' : 'var(--text)',
                backgroundColor: isActive ? 'var(--primary)10' : 'transparent',
                fontWeight: isActive ? '600' : '500',
                marginBottom: '4px',
                transition: 'all 0.2s',
                position: 'relative'
              })}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
              {item.path === '/reports' && newReportsCount > 0 && (
                <span style={{
                  backgroundColor: 'var(--error)',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  marginLeft: sidebarOpen ? 'auto' : '0',
                  position: sidebarOpen ? 'static' : 'absolute',
                  top: sidebarOpen ? undefined : '4px',
                  right: sidebarOpen ? undefined : '4px',
                  minWidth: '20px',
                  textAlign: 'center',
                  lineHeight: '16px'
                }}>
                  {newReportsCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--border)'
        }}>
          {sidebarOpen && (
            <div style={{
              marginBottom: '12px',
              padding: '12px',
              backgroundColor: 'var(--background)',
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user.email}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Administrateur
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--error)10',
              color: 'var(--error)',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Deconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: sidebarOpen ? '260px' : '70px',
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh',
        backgroundColor: 'var(--background)'
      }}>
        {children}
      </main>
    </div>
  );
}
