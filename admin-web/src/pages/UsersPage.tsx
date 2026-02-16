import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Building2, MapPin, Mail, Phone, RefreshCw, Search, Trash2 } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  accountType: 'individual' | 'organization';
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  city?: string;
  country?: string;
  phone?: string;
  updatedAt?: any;
}

export function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'individual' | 'organization'>('all');
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(userId: string, userName: string) {
    const confirmed = confirm(
      `Etes-vous sur de vouloir supprimer l'utilisateur "${userName}" ?\n\n` +
      `Cette action supprimera egalement:\n` +
      `- Toutes ses publications\n` +
      `- Toutes ses demandes\n\n` +
      `Cette action est irreversible.`
    );

    if (!confirmed) return;

    setDeletingUser(userId);
    try {
      // Delete user's posts
      const postsQuery = query(collection(db, 'posts'), where('authorUid', '==', userId));
      const postsSnapshot = await getDocs(postsQuery);
      const postDeletePromises = postsSnapshot.docs.map(docSnap =>
        deleteDoc(doc(db, 'posts', docSnap.id))
      );
      await Promise.all(postDeletePromises);

      // Delete user's requests
      const requestsQuery = query(collection(db, 'requests'), where('authorUid', '==', userId));
      const requestsSnapshot = await getDocs(requestsQuery);
      const requestDeletePromises = requestsSnapshot.docs.map(docSnap =>
        deleteDoc(doc(db, 'requests', docSnap.id))
      );
      await Promise.all(requestDeletePromises);

      // Delete user profile
      await deleteDoc(doc(db, 'users', userId));

      // Update local state
      setUsers(prev => prev.filter(u => u.id !== userId));
      alert(`Utilisateur "${userName}" supprime avec succes.\n` +
        `${postsSnapshot.size} publication(s) et ${requestsSnapshot.size} demande(s) supprimees.`);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erreur lors de la suppression de l\'utilisateur');
    } finally {
      setDeletingUser(null);
    }
  }

  function getDisplayName(user: UserProfile): string {
    if (user.accountType === 'organization') {
      return user.organizationName || 'Association';
    }
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur';
  }

  function getInitials(user: UserProfile): string {
    const name = getDisplayName(user);
    return name.charAt(0).toUpperCase();
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    // Account type filter
    if (filter !== 'all' && user.accountType !== filter) return false;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = getDisplayName(user).toLowerCase();
      const email = (user.email || '').toLowerCase();
      const city = (user.city || '').toLowerCase();
      return name.includes(q) || email.includes(q) || city.includes(q);
    }

    return true;
  });

  const individualCount = users.filter(u => u.accountType === 'individual').length;
  const organizationCount = users.filter(u => u.accountType === 'organization').length;

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
            Utilisateurs
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {users.length} utilisateurs inscrits
          </p>
        </div>
        <button
          onClick={loadUsers}
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

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          flex: 1,
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--primary)15',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User size={24} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{individualCount}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Particuliers</div>
          </div>
        </div>
        <div style={{
          flex: 1,
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--accent)15',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building2 size={24} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{organizationCount}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Associations</div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          flex: 1,
          position: 'relative'
        }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px 12px 44px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '15px',
              backgroundColor: 'var(--surface)',
              outline: 'none'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'individual', 'organization'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: filter === f ? 'var(--primary)' : 'var(--surface)',
                color: filter === f ? 'white' : 'var(--text)',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {f === 'all' ? 'Tous' : f === 'individual' ? 'Particuliers' : 'Associations'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          Chargement...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          backgroundColor: 'var(--surface)',
          borderRadius: '12px'
        }}>
          <User size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            Aucun utilisateur trouve
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--background)' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Utilisateur</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Contact</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Localisation</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Type</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: user.accountType === 'organization' ? 'var(--accent)' : 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600'
                      }}>
                        {getInitials(user)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          {getDisplayName(user)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          ID: {user.id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                        <Mail size={14} color="var(--text-muted)" />
                        <span>{user.email || 'N/A'}</span>
                      </div>
                      {user.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-muted)' }}>
                          <Phone size={14} />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {user.city || user.country ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                        <MapPin size={14} color="var(--text-muted)" />
                        <span>{[user.city, user.country].filter(Boolean).join(', ')}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Non renseigne</span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: user.accountType === 'organization' ? 'var(--accent)15' : 'var(--primary)15',
                      color: user.accountType === 'organization' ? 'var(--accent)' : 'var(--primary)'
                    }}>
                      {user.accountType === 'organization' ? 'Association' : 'Particulier'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDeleteUser(user.id, getDisplayName(user))}
                      disabled={deletingUser === user.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        backgroundColor: 'var(--error)15',
                        color: 'var(--error)',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: deletingUser === user.id ? 'not-allowed' : 'pointer',
                        opacity: deletingUser === user.id ? 0.6 : 1
                      }}
                    >
                      <Trash2 size={14} />
                      {deletingUser === user.id ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
