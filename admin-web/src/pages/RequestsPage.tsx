import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Check, X, Clock, CheckCircle, XCircle, MapPin, Calendar, User, RefreshCw, Trash2 } from 'lucide-react';

interface ZakatRequest {
  id: string;
  title: string;
  description: string;
  authorDisplayName: string;
  beneficiary: { firstName: string; lastName: string };
  goalAmount: number;
  city: string;
  country: string;
  status: string;
  createdAt: any;
  themes: string[];
  urgent: boolean;
}

type StatusFilter = 'pending' | 'verified' | 'rejected';

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'var(--warning)', icon: Clock },
  verified: { label: 'Acceptee', color: 'var(--success)', icon: CheckCircle },
  rejected: { label: 'Refusee', color: 'var(--error)', icon: XCircle }
};

export function RequestsPage() {
  const [requests, setRequests] = useState<ZakatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [activeFilter]);

  async function loadRequests() {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'requests'),
        where('status', '==', activeFilter),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ZakatRequest[];
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, newStatus: 'verified' | 'rejected') {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, 'requests', id), {
        status: newStatus,
        reviewedAt: serverTimestamp(),
        reviewedBy: 'admin'
      });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Erreur lors de la mise a jour');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Etes-vous sur de vouloir supprimer cette demande ?')) return;

    setActionLoading(id);
    try {
      await deleteDoc(doc(db, 'requests', id));
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Erreur lors de la suppression');
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

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
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
            Demandes
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Gerez les demandes de zakat
          </p>
        </div>
        <button
          onClick={loadRequests}
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
      ) : requests.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          backgroundColor: 'var(--surface)',
          borderRadius: '12px'
        }}>
          <CheckCircle size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            Aucune demande {STATUS_CONFIG[activeFilter].label.toLowerCase()}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {requests.map(request => (
            <div
              key={request.id}
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
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    {request.urgent && (
                      <span style={{
                        padding: '4px 10px',
                        backgroundColor: 'var(--error)',
                        color: 'white',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        URGENT
                      </span>
                    )}
                    <span style={{
                      padding: '4px 10px',
                      backgroundColor: 'var(--primary)15',
                      color: 'var(--primary)',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {formatAmount(request.goalAmount)}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                    {request.title}
                  </h3>
                  <p style={{
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    maxHeight: '60px',
                    overflow: 'hidden'
                  }}>
                    {request.description}
                  </p>
                </div>
              </div>

              {/* Meta */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border)',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '14px' }}>
                  <User size={16} />
                  <span>Auteur: {request.authorDisplayName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '14px' }}>
                  <User size={16} />
                  <span>Beneficiaire: {request.beneficiary?.firstName} {request.beneficiary?.lastName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '14px' }}>
                  <MapPin size={16} />
                  <span>{request.city}, {request.country}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '14px' }}>
                  <Calendar size={16} />
                  <span>{formatDate(request.createdAt)}</span>
                </div>
              </div>

              {/* Themes */}
              {request.themes && request.themes.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {request.themes.map(theme => (
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

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                {activeFilter === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(request.id, 'verified')}
                      disabled={actionLoading === request.id}
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
                        opacity: actionLoading === request.id ? 0.7 : 1
                      }}
                    >
                      <Check size={20} />
                      Accepter
                    </button>
                    <button
                      onClick={() => handleAction(request.id, 'rejected')}
                      disabled={actionLoading === request.id}
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
                        opacity: actionLoading === request.id ? 0.7 : 1
                      }}
                    >
                      <X size={20} />
                      Refuser
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(request.id)}
                  disabled={actionLoading === request.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    backgroundColor: 'var(--error)15',
                    color: 'var(--error)',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    opacity: actionLoading === request.id ? 0.7 : 1
                  }}
                >
                  <Trash2 size={20} />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
