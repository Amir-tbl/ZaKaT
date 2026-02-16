import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Check, X, Clock, CheckCircle, XCircle, Calendar, RefreshCw, Image, Trash2 } from 'lucide-react';

interface Post {
  id: string;
  description: string;
  authorDisplayName: string;
  authorType: string;
  organizationName?: string;
  status: string;
  createdAt: any;
  themes: string[];
  files: { type: string; uri: string }[];
}

type StatusFilter = 'pending' | 'verified' | 'rejected';

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'var(--warning)', icon: Clock },
  verified: { label: 'Acceptee', color: 'var(--success)', icon: CheckCircle },
  rejected: { label: 'Refusee', color: 'var(--error)', icon: XCircle }
};

export function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, [activeFilter]);

  async function loadPosts() {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'posts'),
        where('status', '==', activeFilter),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, newStatus: 'verified' | 'rejected') {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, 'posts', id), {
        status: newStatus,
        reviewedAt: serverTimestamp(),
        reviewedBy: 'admin'
      });
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Erreur lors de la mise a jour');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Etes-vous sur de vouloir supprimer cette publication ?')) return;

    setActionLoading(id);
    try {
      await deleteDoc(doc(db, 'posts', id));
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting post:', error);
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
            Publications
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Moderez les publications des utilisateurs
          </p>
        </div>
        <button
          onClick={loadPosts}
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
      ) : posts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          backgroundColor: 'var(--surface)',
          borderRadius: '12px'
        }}>
          <CheckCircle size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            Aucune publication {STATUS_CONFIG[activeFilter].label.toLowerCase()}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {posts.map(post => (
            <div
              key={post.id}
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {/* Image preview */}
              {post.files && post.files.length > 0 && post.files[0].type === 'photo' && (
                <div style={{
                  height: '180px',
                  backgroundColor: 'var(--background)',
                  backgroundImage: `url(${post.files[0].uri})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} />
              )}

              <div style={{ padding: '20px' }}>
                {/* Author */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: post.authorType === 'organization' ? 'var(--accent)' : 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    {post.authorDisplayName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>
                      {post.authorDisplayName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {post.authorType === 'organization' ? 'Association' : 'Particulier'}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: 'var(--text)',
                  marginBottom: '12px',
                  maxHeight: '80px',
                  overflow: 'hidden'
                }}>
                  {post.description}
                </p>

                {/* Meta */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <Calendar size={14} />
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <Image size={14} />
                    <span>{post.files?.length || 0} fichier(s)</span>
                  </div>
                </div>

                {/* Themes */}
                {post.themes && post.themes.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {post.themes.slice(0, 3).map(theme => (
                      <span
                        key={theme}
                        style={{
                          padding: '3px 10px',
                          backgroundColor: 'var(--background)',
                          borderRadius: '20px',
                          fontSize: '11px',
                          color: 'var(--text-muted)'
                        }}
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {activeFilter === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAction(post.id, 'verified')}
                        disabled={actionLoading === post.id}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '10px',
                          backgroundColor: 'var(--success)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '14px',
                          cursor: 'pointer',
                          opacity: actionLoading === post.id ? 0.7 : 1
                        }}
                      >
                        <Check size={18} />
                        Accepter
                      </button>
                      <button
                        onClick={() => handleAction(post.id, 'rejected')}
                        disabled={actionLoading === post.id}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '10px',
                          backgroundColor: 'var(--error)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '14px',
                          cursor: 'pointer',
                          opacity: actionLoading === post.id ? 0.7 : 1
                        }}
                      >
                        <X size={18} />
                        Refuser
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={actionLoading === post.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      backgroundColor: 'var(--error)15',
                      color: 'var(--error)',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      opacity: actionLoading === post.id ? 0.7 : 1
                    }}
                  >
                    <Trash2 size={18} />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
