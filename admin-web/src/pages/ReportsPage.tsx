import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Flag, Check, X, Clock, CheckCircle, XCircle, Calendar, User, MessageSquare, RefreshCw, Trash2 } from 'lucide-react';

interface Report {
  id: string;
  reporterUserId: string;
  reporterName?: string;
  reportedUserId?: string;
  reportedUserName?: string;
  reportedContentId?: string;
  reportedContentType?: 'post' | 'request' | 'user' | 'comment';
  reason: string;
  message?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: any;
  reviewedAt?: any;
  reviewNote?: string;
}

type StatusFilter = 'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed';

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'var(--warning)', icon: Clock },
  reviewed: { label: 'En cours', color: '#3B82F6', icon: CheckCircle },
  resolved: { label: 'Resolu', color: 'var(--success)', icon: CheckCircle },
  dismissed: { label: 'Rejete', color: 'var(--text-muted)', icon: XCircle }
};

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Harcelement',
  inappropriate: 'Contenu inapproprie',
  scam: 'Arnaque',
  fake: 'Faux profil',
  other: 'Autre'
};

export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
      // If collection doesn't exist, just set empty array
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(id: string, newStatus: 'reviewed' | 'resolved' | 'dismissed') {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, 'reports', id), {
        status: newStatus,
        reviewedAt: new Date()
      });
      setReports(prev => prev.map(r =>
        r.id === id ? { ...r, status: newStatus } : r
      ));
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Erreur lors de la mise a jour');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce signalement ?')) return;

    setActionLoading(id);
    try {
      await deleteDoc(doc(db, 'reports', id));
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting report:', error);
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Filter reports
  const filteredReports = activeFilter === 'all'
    ? reports
    : reports.filter(r => r.status === activeFilter);

  const pendingCount = reports.filter(r => r.status === 'pending').length;

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
            Signalements
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {pendingCount > 0 ? `${pendingCount} signalement(s) en attente` : 'Aucun signalement en attente'}
          </p>
        </div>
        <button
          onClick={loadReports}
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
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        {(['all', 'pending', 'reviewed', 'resolved', 'dismissed'] as StatusFilter[]).map(status => (
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
              backgroundColor: activeFilter === status ? 'var(--primary)' : 'var(--surface)',
              color: activeFilter === status ? 'white' : 'var(--text)',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {status === 'all' ? 'Tous' : STATUS_CONFIG[status].label}
            {status === 'pending' && pendingCount > 0 && (
              <span style={{
                backgroundColor: activeFilter === status ? 'white' : 'var(--warning)',
                color: activeFilter === status ? 'var(--primary)' : 'white',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          Chargement...
        </div>
      ) : filteredReports.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          backgroundColor: 'var(--surface)',
          borderRadius: '12px'
        }}>
          <Flag size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
            Aucun signalement {activeFilter !== 'all' ? STATUS_CONFIG[activeFilter as keyof typeof STATUS_CONFIG]?.label.toLowerCase() : ''}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Les signalements des utilisateurs apparaitront ici
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredReports.map(report => {
            const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={report.id}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderLeft: `4px solid ${statusConfig.color}`
                }}
              >
                {/* Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--error)15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Flag size={20} color="var(--error)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '16px' }}>
                        {REASON_LABELS[report.reason] || report.reason}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {report.reportedContentType === 'user' ? 'Signalement de profil' :
                         report.reportedContentType === 'post' ? 'Signalement de publication' :
                         report.reportedContentType === 'request' ? 'Signalement de demande' :
                         'Signalement'}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    backgroundColor: `${statusConfig.color}15`,
                    color: statusConfig.color,
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    <StatusIcon size={14} />
                    {statusConfig.label}
                  </div>
                </div>

                {/* Message */}
                {report.message && (
                  <div style={{
                    backgroundColor: 'var(--background)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                      color: 'var(--text-muted)',
                      fontSize: '13px'
                    }}>
                      <MessageSquare size={14} />
                      Message du signalement
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      {report.message}
                    </p>
                  </div>
                )}

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
                    <span>Signale par: {report.reporterName || report.reporterUserId?.slice(-8) || 'Anonyme'}</span>
                  </div>
                  {report.reportedUserName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--error)', fontSize: '14px' }}>
                      <User size={16} />
                      <span>Utilisateur signale: {report.reportedUserName}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    <Calendar size={16} />
                    <span>{formatDate(report.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {report.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(report.id, 'reviewed')}
                        disabled={actionLoading === report.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 20px',
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          opacity: actionLoading === report.id ? 0.7 : 1
                        }}
                      >
                        <Check size={18} />
                        Prendre en charge
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                        disabled={actionLoading === report.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 20px',
                          backgroundColor: 'var(--background)',
                          color: 'var(--text)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          opacity: actionLoading === report.id ? 0.7 : 1
                        }}
                      >
                        <X size={18} />
                        Rejeter
                      </button>
                    </>
                  )}
                  {report.status === 'reviewed' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'resolved')}
                      disabled={actionLoading === report.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        backgroundColor: 'var(--success)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        opacity: actionLoading === report.id ? 0.7 : 1
                      }}
                    >
                      <CheckCircle size={18} />
                      Marquer comme resolu
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(report.id)}
                    disabled={actionLoading === report.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      backgroundColor: 'var(--error)15',
                      color: 'var(--error)',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      opacity: actionLoading === report.id ? 0.7 : 1
                    }}
                  >
                    <Trash2 size={18} />
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
