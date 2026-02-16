import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BarChart3, Users, MapPin, TrendingUp, RefreshCw } from 'lucide-react';

interface UserProfile {
  id: string;
  accountType: 'individual' | 'organization';
  title?: string; // Mr., Mme., non_specifie
  city?: string;
  country?: string;
  createdAt?: any;
}

interface StatsData {
  totalUsers: number;
  individuals: number;
  organizations: number;
  genderStats: { mr: number; mme: number; nonSpecifie: number };
  countryStats: Record<string, number>;
  cityStats: Record<string, number>;
  monthlySignups: Record<string, number>;
}

export function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];

      // Calculate stats
      const individuals = users.filter(u => u.accountType === 'individual');
      const organizations = users.filter(u => u.accountType === 'organization');

      // Gender stats (based on title for individuals)
      const genderStats = {
        mr: individuals.filter(u => u.title === 'Mr.').length,
        mme: individuals.filter(u => u.title === 'Mme.').length,
        nonSpecifie: individuals.filter(u => !u.title || u.title === 'non_specifie').length
      };

      // Country stats
      const countryStats: Record<string, number> = {};
      users.forEach(u => {
        const country = u.country || 'Non renseigne';
        countryStats[country] = (countryStats[country] || 0) + 1;
      });

      // City stats (top 10)
      const cityStats: Record<string, number> = {};
      users.forEach(u => {
        if (u.city) {
          cityStats[u.city] = (cityStats[u.city] || 0) + 1;
        }
      });

      // Monthly signups (last 6 months)
      const monthlySignups: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        monthlySignups[key] = 0;
      }

      setStats({
        totalUsers: users.length,
        individuals: individuals.length,
        organizations: organizations.length,
        genderStats,
        countryStats,
        cityStats,
        monthlySignups
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  // Simple bar chart component
  const BarChart = ({ data, title, color }: { data: Record<string, number>; title: string; color: string }) => {
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxValue = Math.max(...entries.map(e => e[1]), 1);

    return (
      <div style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>{title}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {entries.map(([label, value]) => (
            <div key={label}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
                fontSize: '13px'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontWeight: '600' }}>{value}</span>
              </div>
              <div style={{
                height: '8px',
                backgroundColor: 'var(--background)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${(value / maxValue) * 100}%`,
                  backgroundColor: color,
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>
              Aucune donnee
            </p>
          )}
        </div>
      </div>
    );
  };

  // Pie chart component (simple version with segments)
  const PieChart = ({ data, title, colors }: { data: { label: string; value: number }[]; title: string; colors: string[] }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
      <div style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>{title}</h3>

        {/* Simple horizontal bar representation */}
        <div style={{
          height: '24px',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          marginBottom: '20px'
        }}>
          {data.map((item, index) => (
            <div
              key={item.label}
              style={{
                height: '100%',
                width: total > 0 ? `${(item.value / total) * 100}%` : '0%',
                backgroundColor: colors[index % colors.length],
                transition: 'width 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          {data.map((item, index) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                backgroundColor: colors[index % colors.length]
              }} />
              <span style={{ fontSize: '13px' }}>
                {item.label}: <strong>{item.value}</strong>
                {total > 0 && (
                  <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>
                    ({Math.round((item.value / total) * 100)}%)
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Chargement des statistiques...
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Erreur lors du chargement des statistiques
      </div>
    );
  }

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            Statistiques
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Analyse des donnees de la plateforme
          </p>
        </div>
        <button
          onClick={loadStats}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          <RefreshCw size={18} />
          Actualiser
        </button>
      </div>

      {/* Overview cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary)15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={24} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>{stats.totalUsers}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Total utilisateurs</div>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#3B82F615',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={24} color="#3B82F6" />
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>{stats.individuals}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Particuliers</div>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--accent)15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart3 size={24} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>{stats.organizations}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Associations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '24px'
      }}>
        {/* Gender distribution */}
        <PieChart
          title="Repartition par civilite"
          data={[
            { label: 'Monsieur', value: stats.genderStats.mr },
            { label: 'Madame', value: stats.genderStats.mme },
            { label: 'Non specifie', value: stats.genderStats.nonSpecifie }
          ]}
          colors={['#3B82F6', '#EC4899', '#9CA3AF']}
        />

        {/* Account types */}
        <PieChart
          title="Types de comptes"
          data={[
            { label: 'Particuliers', value: stats.individuals },
            { label: 'Associations', value: stats.organizations }
          ]}
          colors={['var(--primary)', 'var(--accent)']}
        />

        {/* Country distribution */}
        <BarChart
          title="Repartition par pays"
          data={stats.countryStats}
          color="var(--primary)"
        />

        {/* City distribution */}
        <BarChart
          title="Top villes"
          data={stats.cityStats}
          color="var(--accent)"
        />
      </div>
    </div>
  );
}
