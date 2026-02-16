import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, increment, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Heart, AlertTriangle, Building2, MapPin, RefreshCw, Wallet, Search, Check } from 'lucide-react';

interface Request {
  id: string;
  title: string;
  description: string;
  authorDisplayName: string;
  authorUserId: string;
  goalAmount: number;
  receivedAmountCents: number;
  donorCount: number;
  city: string;
  country: string;
  urgent: boolean;
  createdAt: any;
}

interface Organization {
  id: string;
  name: string;
  description?: string;
  country: string;
  walletBalanceCents: number;
  donorCount: number;
}

type TabType = 'urgent' | 'requests' | 'organizations';

export function DonationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('urgent');
  const [requests, setRequests] = useState<Request[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [treasuryBalance, setTreasuryBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [donationModal, setDonationModal] = useState<{
    type: 'request' | 'organization';
    id: string;
    name: string;
  } | null>(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationLoading, setDonationLoading] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load treasury
      const treasuryDoc = await getDoc(doc(db, 'treasury', 'global'));
      if (treasuryDoc.exists()) {
        setTreasuryBalance(treasuryDoc.data().totalAmountCents || treasuryDoc.data().balanceCents || 0);
      }

      // Load verified requests
      const requestsQuery = query(
        collection(db, 'requests'),
        where('status', '==', 'verified'),
        orderBy('createdAt', 'desc')
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      setRequests(requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Request[]);

      // Load verified organizations
      const orgsQuery = query(
        collection(db, 'organizations'),
        where('status', '==', 'verified')
      );
      const orgsSnapshot = await getDocs(orgsQuery);
      setOrganizations(orgsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Organization[]);
    } catch (error) {
      console.error('Error loading data:', error);
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

  async function handleDonate() {
    if (!donationModal || !donationAmount) return;

    const amountCents = Math.round(parseFloat(donationAmount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      alert('Montant invalide');
      return;
    }

    if (amountCents > treasuryBalance) {
      alert('Fonds insuffisants dans le coffre');
      return;
    }

    setDonationLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Non connecte');

      // Create donation record
      await addDoc(collection(db, 'donations'), {
        donorUid: currentUser.uid,
        donorName: 'Admin ZaKaT',
        donorType: 'admin',
        targetType: donationModal.type,
        targetId: donationModal.id,
        targetName: donationModal.name,
        amountCents,
        fromTreasury: true,
        createdAt: serverTimestamp()
      });

      // Update target counters
      if (donationModal.type === 'request') {
        await updateDoc(doc(db, 'requests', donationModal.id), {
          receivedAmountCents: increment(amountCents),
          donorCount: increment(1)
        });
      } else {
        await updateDoc(doc(db, 'organizations', donationModal.id), {
          walletBalanceCents: increment(amountCents),
          donorCount: increment(1)
        });
      }

      // Deduct from treasury
      await updateDoc(doc(db, 'treasury', 'global'), {
        totalAmountCents: increment(-amountCents)
      });

      setDonationSuccess(true);
      setTreasuryBalance(prev => prev - amountCents);

      // Reload data
      await loadData();

      setTimeout(() => {
        setDonationModal(null);
        setDonationAmount('');
        setDonationSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error making donation:', error);
      alert('Erreur lors du don');
    } finally {
      setDonationLoading(false);
    }
  }

  // Filter data based on search
  const filteredRequests = requests.filter(req => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return req.title.toLowerCase().includes(q) ||
           req.authorDisplayName.toLowerCase().includes(q) ||
           req.city.toLowerCase().includes(q);
  });

  const urgentRequests = filteredRequests.filter(r => r.urgent);

  const filteredOrganizations = organizations.filter(org => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return org.name.toLowerCase().includes(q) ||
           org.country.toLowerCase().includes(q);
  });

  const renderRequestCard = (req: Request) => {
    const progress = req.goalAmount > 0
      ? Math.min(100, (req.receivedAmountCents / 100 / req.goalAmount) * 100)
      : 0;

    return (
      <div
        key={req.id}
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderLeft: req.urgent ? '4px solid var(--error)' : '4px solid var(--primary)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              {req.urgent && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  backgroundColor: 'var(--error)',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  <AlertTriangle size={12} />
                  URGENT
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{req.title}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <MapPin size={14} />
              <span>{req.city}, {req.country}</span>
              <span style={{ margin: '0 4px' }}>-</span>
              <span>par {req.authorDisplayName}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--primary)' }}>
              {formatAmountEuros(req.goalAmount)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {formatAmount(req.receivedAmountCents)} recu
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '8px',
          backgroundColor: 'var(--border)',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '16px'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: req.urgent ? 'var(--error)' : 'var(--primary)',
            borderRadius: '4px',
            transition: 'width 0.3s'
          }} />
        </div>

        <button
          onClick={() => setDonationModal({ type: 'request', id: req.id, name: req.title })}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
            backgroundColor: req.urgent ? 'var(--error)' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <Heart size={18} />
          Verser un don
        </button>
      </div>
    );
  };

  const renderOrganizationCard = (org: Organization) => (
    <div
      key={org.id}
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderLeft: '4px solid var(--accent)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
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
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{org.name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '13px' }}>
            <MapPin size={12} />
            {org.country}
          </div>
        </div>
      </div>

      {org.description && (
        <p style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: '12px',
          lineHeight: '1.5'
        }}>
          {org.description.slice(0, 100)}{org.description.length > 100 ? '...' : ''}
        </p>
      )}

      <div style={{
        display: 'flex',
        gap: '16px',
        padding: '12px',
        backgroundColor: 'var(--background)',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)' }}>
            {formatAmount(org.walletBalanceCents)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cagnotte</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '700' }}>
            {org.donorCount || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Donateurs</div>
        </div>
      </div>

      <button
        onClick={() => setDonationModal({ type: 'organization', id: org.id, name: org.name })}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px',
          backgroundColor: 'var(--accent)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        <Heart size={18} />
        Soutenir l'association
      </button>
    </div>
  );

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
            Dons Admin
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Versez des dons depuis le coffre de l'application
          </p>
        </div>
        <button
          onClick={loadData}
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

      {/* Treasury Balance */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Wallet size={24} />
          <div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>Solde du coffre</div>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>{formatAmount(treasuryBalance)}</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{
        position: 'relative',
        marginBottom: '24px'
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
          placeholder="Rechercher une demande ou association..."
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

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setActiveTab('urgent')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'urgent' ? 'var(--error)' : 'var(--surface)',
            color: activeTab === 'urgent' ? 'white' : 'var(--text)',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <AlertTriangle size={18} />
          Urgents ({urgentRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'requests' ? 'var(--primary)' : 'var(--surface)',
            color: activeTab === 'requests' ? 'white' : 'var(--text)',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <Heart size={18} />
          Demandes ({filteredRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('organizations')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'organizations' ? 'var(--accent)' : 'var(--surface)',
            color: activeTab === 'organizations' ? 'white' : 'var(--text)',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <Building2 size={18} />
          Associations ({filteredOrganizations.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          Chargement...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {activeTab === 'urgent' && urgentRequests.map(renderRequestCard)}
          {activeTab === 'requests' && filteredRequests.map(renderRequestCard)}
          {activeTab === 'organizations' && filteredOrganizations.map(renderOrganizationCard)}

          {activeTab === 'urgent' && urgentRequests.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '48px',
              backgroundColor: 'var(--surface)',
              borderRadius: '12px'
            }}>
              <AlertTriangle size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
              <p style={{ color: 'var(--text-muted)' }}>Aucune demande urgente</p>
            </div>
          )}
          {activeTab === 'requests' && filteredRequests.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '48px',
              backgroundColor: 'var(--surface)',
              borderRadius: '12px'
            }}>
              <Heart size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
              <p style={{ color: 'var(--text-muted)' }}>Aucune demande trouvee</p>
            </div>
          )}
          {activeTab === 'organizations' && filteredOrganizations.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '48px',
              backgroundColor: 'var(--surface)',
              borderRadius: '12px'
            }}>
              <Building2 size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
              <p style={{ color: 'var(--text-muted)' }}>Aucune association trouvee</p>
            </div>
          )}
        </div>
      )}

      {/* Donation Modal */}
      {donationModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => !donationLoading && setDonationModal(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '16px',
              padding: '28px',
              width: '100%',
              maxWidth: '420px',
              margin: '20px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {donationSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--success)15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Check size={32} color="var(--success)" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                  Don effectue !
                </h3>
                <p style={{ color: 'var(--text-muted)' }}>
                  Le montant a ete verse avec succes
                </p>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                  Verser un don
                </h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
                  {donationModal.type === 'request' ? 'Demande' : 'Association'}: <strong>{donationModal.name}</strong>
                </p>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Montant (EUR)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      fontSize: '18px'
                    }}>
                      EUR
                    </span>
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '14px 14px 14px 54px',
                        fontSize: '24px',
                        fontWeight: '700',
                        border: '2px solid var(--border)',
                        borderRadius: '10px',
                        outline: 'none',
                        textAlign: 'right'
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Solde disponible: {formatAmount(treasuryBalance)}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setDonationModal(null)}
                    disabled={donationLoading}
                    style={{
                      flex: 1,
                      padding: '14px',
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDonate}
                    disabled={donationLoading || !donationAmount}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '14px',
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '600',
                      cursor: donationLoading ? 'wait' : 'pointer',
                      opacity: donationLoading || !donationAmount ? 0.7 : 1
                    }}
                  >
                    {donationLoading ? 'En cours...' : (
                      <>
                        <Heart size={18} />
                        Confirmer
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
