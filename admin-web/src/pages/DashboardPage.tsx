import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Heart, FileText, Building2, Users, Clock, CheckCircle, XCircle, Wallet, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Stats {
  requests: { pending: number; verified: number; rejected: number };
  posts: { pending: number; verified: number; rejected: number };
  organizations: { pending: number; verified: number; rejected: number };
  users: number;
  treasuryBalance: number;
  urgentRequests: UrgentRequest[];
}

interface UrgentRequest {
  id: string;
  title: string;
  authorDisplayName: string;
  goalAmount: number;
  receivedAmountCents: number;
  city: string;
  country: string;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    requests: { pending: 0, verified: 0, rejected: 0 },
    posts: { pending: 0, verified: 0, rejected: 0 },
    organizations: { pending: 0, verified: 0, rejected: 0 },
    users: 0,
    treasuryBalance: 0,
    urgentRequests: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      // Load requests stats
      const requestsPending = await getDocs(query(collection(db, 'requests'), where('status', '==', 'pending')));
      const requestsVerified = await getDocs(query(collection(db, 'requests'), where('status', '==', 'verified')));
      const requestsRejected = await getDocs(query(collection(db, 'requests'), where('status', '==', 'rejected')));

      // Load posts stats
      const postsPending = await getDocs(query(collection(db, 'posts'), where('status', '==', 'pending')));
      const postsVerified = await getDocs(query(collection(db, 'posts'), where('status', '==', 'verified')));
      const postsRejected = await getDocs(query(collection(db, 'posts'), where('status', '==', 'rejected')));

      // Load organizations stats
      const orgsPending = await getDocs(query(collection(db, 'organizations'), where('status', '==', 'pending')));
      const orgsVerified = await getDocs(query(collection(db, 'organizations'), where('status', '==', 'verified')));
      const orgsRejected = await getDocs(query(collection(db, 'organizations'), where('status', '==', 'rejected')));

      // Load users count
      const usersSnapshot = await getDocs(collection(db, 'users'));

      // Load treasury balance
      let treasuryBalance = 0;
      try {
        const treasuryDoc = await getDoc(doc(db, 'treasury', 'global'));
        if (treasuryDoc.exists()) {
          treasuryBalance = treasuryDoc.data().totalAmountCents || treasuryDoc.data().balanceCents || 0;
        }
      } catch (e) {
        console.warn('Could not load treasury:', e);
      }

      // Load urgent verified requests
      let urgentRequests: UrgentRequest[] = [];
      try {
        const urgentQuery = query(
          collection(db, 'requests'),
          where('status', '==', 'verified'),
          where('urgent', '==', true),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const urgentSnapshot = await getDocs(urgentQuery);
        urgentRequests = urgentSnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
          authorDisplayName: doc.data().authorDisplayName,
          goalAmount: doc.data().goalAmount,
          receivedAmountCents: doc.data().receivedAmountCents || 0,
          city: doc.data().city,
          country: doc.data().country
        }));
      } catch (e) {
        console.warn('Could not load urgent requests:', e);
      }

      setStats({
        requests: {
          pending: requestsPending.size,
          verified: requestsVerified.size,
          rejected: requestsRejected.size
        },
        posts: {
          pending: postsPending.size,
          verified: postsVerified.size,
          rejected: postsRejected.size
        },
        organizations: {
          pending: orgsPending.size,
          verified: orgsVerified.size,
          rejected: orgsRejected.size
        },
        users: usersSnapshot.size,
        treasuryBalance,
        urgentRequests
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatAmount(cents: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(cents / 100);
  }

  function formatAmountEuros(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  const StatCard = ({ title, icon: Icon, pending, verified, rejected, color, onClick }: any) => (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '12px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={24} color={color} />
        </div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{title}</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {pending + verified + rejected} total
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '4px'
          }}>
            <Clock size={14} color="var(--warning)" />
            <span style={{ fontSize: '20px', fontWeight: '700' }}>{pending}</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>En attente</span>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '4px'
          }}>
            <CheckCircle size={14} color="var(--success)" />
            <span style={{ fontSize: '20px', fontWeight: '700' }}>{verified}</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Acceptees</span>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '4px'
          }}>
            <XCircle size={14} color="var(--error)" />
            <span style={{ fontSize: '20px', fontWeight: '700' }}>{rejected}</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Refusees</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Chargement des statistiques...
      </div>
    );
  }

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Vue d'ensemble de la plateforme ZaKaT
        </p>
      </div>

      {/* Treasury Card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '24px',
        color: 'white',
        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Wallet size={28} />
              <span style={{ fontSize: '16px', opacity: 0.9 }}>Coffre de l'application</span>
            </div>
            <div style={{ fontSize: '42px', fontWeight: '700' }}>
              {formatAmount(stats.treasuryBalance)}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '8px' }}>
              Fonds disponibles pour distribution
            </div>
          </div>
          <button
            onClick={() => navigate('/donations')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
          >
            <Heart size={18} />
            Faire un don
          </button>
        </div>
      </div>

      {/* Pending alerts */}
      {(stats.requests.pending > 0 || stats.posts.pending > 0 || stats.organizations.pending > 0) && (
        <div style={{
          backgroundColor: 'var(--warning)15',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Clock size={20} color="var(--warning)" />
          <span style={{ fontWeight: '500' }}>
            {stats.requests.pending + stats.posts.pending + stats.organizations.pending} elements en attente de moderation
          </span>
        </div>
      )}

      {/* Urgent Requests Section */}
      {stats.urgentRequests.length > 0 && (
        <div style={{
          backgroundColor: 'var(--error)08',
          border: '1px solid var(--error)30',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={22} color="var(--error)" />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--error)' }}>
                Demandes Urgentes
              </h3>
            </div>
            <button
              onClick={() => navigate('/donations')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: 'var(--error)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Voir tout
              <ArrowRight size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.urgentRequests.map(req => {
              const progress = req.goalAmount > 0
                ? Math.min(100, (req.receivedAmountCents / 100 / req.goalAmount) * 100)
                : 0;
              return (
                <div
                  key={req.id}
                  onClick={() => navigate('/donations')}
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>{req.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {req.city}, {req.country} - par {req.authorDisplayName}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '700', color: 'var(--primary)' }}>
                        {formatAmountEuros(req.goalAmount)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {formatAmount(req.receivedAmountCents)} recu
                      </div>
                    </div>
                  </div>
                  <div style={{
                    height: '6px',
                    backgroundColor: 'var(--border)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${progress}%`,
                      backgroundColor: 'var(--primary)',
                      borderRadius: '3px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <StatCard
          title="Demandes"
          icon={Heart}
          pending={stats.requests.pending}
          verified={stats.requests.verified}
          rejected={stats.requests.rejected}
          color="var(--primary)"
          onClick={() => navigate('/requests')}
        />
        <StatCard
          title="Publications"
          icon={FileText}
          pending={stats.posts.pending}
          verified={stats.posts.verified}
          rejected={stats.posts.rejected}
          color="var(--accent)"
          onClick={() => navigate('/posts')}
        />
        <StatCard
          title="Associations"
          icon={Building2}
          pending={stats.organizations.pending}
          verified={stats.organizations.verified}
          rejected={stats.organizations.rejected}
          color="#3B82F6"
          onClick={() => navigate('/organizations')}
        />
      </div>

      {/* Users card */}
      <div
        onClick={() => navigate('/users')}
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          padding: '24px',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          maxWidth: '300px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#8B5CF615',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={24} color="#8B5CF6" />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Utilisateurs</h3>
            <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>
              {stats.users}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
