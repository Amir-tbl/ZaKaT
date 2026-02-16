import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Check, X, Clock, CheckCircle, XCircle, Calendar, Globe, MapPin, RefreshCw, ExternalLink } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  description: string;
  country: string;
  status: string;
  createdAt: any;
  themes: string[];
  website?: string;
  partnershipLevel?: string;
}

type StatusFilter = 'pending' | 'verified' | 'rejected';

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'var(--warning)', icon: Clock },
  verified: { label: 'Verifiee', color: 'var(--success)', icon: CheckCircle },
  rejected: { label: 'Refusee', color: 'var(--error)', icon: XCircle }
};

export function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadOrganizations();
  }, [activeFilter]);

  async function loadOrganizations() {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'organizations'),
        where('status', '==', activeFilter),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Organization[];
      setOrganizations(data);
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, newStatus: 'verified' | 'rejected') {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, 'organizations', id), {
        status: newStatus,
        reviewedAt: serverTimestamp(),
        reviewedBy: 'admin'
      });
      setOrganizations(prev => prev.filter(o => o.id !== id));
    } catch (error) {
      console.error('Error updating organization:', error);
      alert('Erreur lors de la mise a jour');
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(timestamp: any): string {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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
            Associations
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Verifiez et approuvez les associations
          </p>
        </div>
        <button
          onClick={loadOrganizations}
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

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {(['pending', 'verified', 'rejected'] as StatusFilter[]).map(status => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          return (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeFilter === status ? config.color : 'var(--surface)',
                color: activeFilter === status ? 'white' : 'var(--text)',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={18} />
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          Chargement...
        </div>
      ) : organizations.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          backgroundColor: 'var(--surface)',
          borderRadius: '12px'
        }}>
          <CheckCircle size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            Aucune association {STATUS_CONFIG[activeFilter].label.toLowerCase()}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '20px'
        }}>
          {organizations.map(org => (
            <div
              key={org.id}
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: '700',
                  flexShrink: 0
                }}>
                  {org.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
                      {org.name}
                    </h3>
                    {org.partnershipLevel === 'officiel' && (
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: 'var(--primary)15',
                        color: 'var(--primary)',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        Officiel
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    <MapPin size={14} />
                    <span>{org.country}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: 'var(--text-muted)',
                marginBottom: '16px',
                maxHeight: '60px',
                overflow: 'hidden'
              }}>
                {org.description}
              </p>

              {/* Themes */}
              {org.themes && org.themes.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {org.themes.map(theme => (
                    <span
                      key={theme}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: 'var(--background)',
                        borderRadius: '20px',
                        fontSize: '12px',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border)',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <Calendar size={14} />
                  <span>{formatDate(org.createdAt)}</span>
                </div>
                {org.website && (
                  <a
                    href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--accent)',
                      fontSize: '13px',
                      textDecoration: 'none'
                    }}
                  >
                    <Globe size={14} />
                    <span>Site web</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {/* Actions */}
              {activeFilter === 'pending' && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => handleAction(org.id, 'verified')}
                    disabled={actionLoading === org.id}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      backgroundColor: 'var(--success)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      opacity: actionLoading === org.id ? 0.7 : 1
                    }}
                  >
                    <Check size={18} />
                    Verifier
                  </button>
                  <button
                    onClick={() => handleAction(org.id, 'rejected')}
                    disabled={actionLoading === org.id}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      backgroundColor: 'var(--error)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      opacity: actionLoading === org.id ? 0.7 : 1
                    }}
                  >
                    <X size={18} />
                    Refuser
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
