// src/pages/Ledger.jsx
import { useState } from 'react';
import { UserPlus, Phone, Users, ChevronRight, MessageCircle } from 'lucide-react';
import GlobalHeader          from '../components/GlobalHeader';
import AddShopkeeperModal    from '../components/AddShopkeeperModal';
import ShopkeeperDetailsModal from '../components/ShopkeeperDetailsModal';
import { useApp }            from '../context/AppContext';

export default function Ledger() {
  const { shopkeepers, shopkeepersLoading, showAddShopkeeperModal, openAddShopkeeperModal, closeAddShopkeeperModal, globalSearchQuery } = useApp();
  const [selectedShopkeeper, setSelectedShopkeeper] = useState(null);

  const filteredShopkeepers = shopkeepers.filter(acc => {
    if (!globalSearchQuery) return true;
    const q = globalSearchQuery.toLowerCase();
    return (
      (acc.name && acc.name.toLowerCase().includes(q)) ||
      (acc.phone && acc.phone.toLowerCase().includes(q))
    );
  });

  const handleSendReminder = (acc) => {
    if (!acc.phone) {
      alert("No phone number available for this shopkeeper.");
      return;
    }

    const pending = (acc.totalSales || 0) - (acc.totalPaid || 0);
    if (pending <= 0) {
      alert("This shopkeeper has no pending balance.");
      return;
    }

    // Use current date
    const dateStr = new Date().toLocaleDateString('ur-PK', { day: 'numeric', month: 'long', year: 'numeric' });

    const message = `*تاریخ:* ${dateStr}
*دکاندار کا نام:* *_${acc.name}_*

*ٹوٹل بقایا:* ${pending.toLocaleString()} روپے

براہ کرم اپنا بقایا جلد از جلد کلیئر کریں۔ شکریہ!`;

    // Normalize phone number (e.g. 0301... to 92301...)
    let phoneStr = acc.phone.trim();
    if (phoneStr.startsWith('03')) {
      phoneStr = '92' + phoneStr.substring(1);
    }
    phoneStr = phoneStr.replace(/[^0-9]/g, '');

    const whatsappUrl = `https://wa.me/${phoneStr}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="animate-fade-in">
      <GlobalHeader title="Ledger" subtitle="Shopkeeper Balances & Dues" />

      {/* ── Header Bar ── */}
      <div className="floating-card p-0" style={{ padding: '0 24px' }}>
        <div className="flex justify-between items-center py-5 border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg">Shopkeepers</h3>
            <span style={{
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)',
              color: '#60a5fa',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '2px 10px',
              borderRadius: '999px',
            }}>
              {shopkeepers.length} registered
            </span>
          </div>
          <button
            className="action-btn"
            style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
            onClick={openAddShopkeeperModal}
          >
            <UserPlus size={17} />
            <span>Add Shopkeeper</span>
          </button>
        </div>

        {/* ── Loading State ── */}
        {shopkeepersLoading && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#52525b' }}>
            <div className="modal-spinner" style={{ margin: '0 auto 12px', width: '28px', height: '28px' }} />
            <p>Loading shopkeepers...</p>
          </div>
        )}

        {/* ── Empty State ── */}
        {!shopkeepersLoading && filteredShopkeepers.length === 0 && (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: '#3b82f6',
            }}>
              <Users size={28} />
            </div>
            <h3 style={{ color: '#fafafa', marginBottom: '8px' }}>No shopkeepers found</h3>
            <p style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '20px' }}>
              Add your first shopkeeper to start tracking balances
            </p>
            <button
              className="modal-submit"
              onClick={openAddShopkeeperModal}
              style={{ margin: '0 auto' }}
            >
              <UserPlus size={17} /> Add First Shopkeeper
            </button>
          </div>
        )}

        {/* ── Desktop Table ── */}
        {!shopkeepersLoading && filteredShopkeepers.length > 0 && (
          <div className="data-table-container desktop-only">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shopkeeper Name</th>
                  <th>Phone Number</th>
                  <th>Total Sales</th>
                  <th>Amount Paid</th>
                  <th>Pending Balance</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShopkeepers.map(acc => {
                  const pending = (acc.totalSales || 0) - (acc.totalPaid || 0);
                  return (
                    <tr key={acc.id}>
                      <td className="font-bold text-primary">{acc.name}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a1a1aa' }}>
                          <Phone size={13} />
                          {acc.phone || 'N/A'}
                        </span>
                      </td>
                      <td>₨ {(acc.totalSales || 0).toLocaleString()}</td>
                      <td className="text-success">₨ {(acc.totalPaid || 0).toLocaleString()}</td>
                      <td className={`font-bold ${pending > 0 ? 'text-danger' : 'text-success'}`}>
                        ₨ {pending.toLocaleString()}
                        {pending > 0 && (
                          <span className="badge badge-warning" style={{ marginLeft: '8px', fontSize: '0.7rem' }}>Udhaar</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex justify-end gap-2">
                          <button
                            className="action-btn"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#27272a', color: '#fafafa' }}
                            onClick={() => setSelectedShopkeeper(acc)}
                          >
                            Details <ChevronRight size={14} />
                          </button>
                          
                          {pending > 0 && acc.phone && (
                            <button
                              className="action-btn"
                              style={{ padding: '6px 10px', fontSize: '0.8rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)' }}
                              onClick={() => handleSendReminder(acc)}
                              title="Send Reminder on WhatsApp"
                            >
                              <MessageCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Mobile Cards ── */}
        {!shopkeepersLoading && filteredShopkeepers.length > 0 && (
          <div className="mobile-card-list pb-4 pt-4">
            {filteredShopkeepers.map(acc => {
              const pending = (acc.totalSales || 0) - (acc.totalPaid || 0);
              return (
                <div key={acc.id} className="floating-card" style={{ padding: '16px', boxShadow: 'none', background: '#18181b' }}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-primary">{acc.name}</h3>
                    {pending > 0 && <span className="badge badge-warning">Udhaar</span>}
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#71717a', fontSize: '0.8rem', marginBottom: '12px' }}>
                    <Phone size={12} /> {acc.phone || 'N/A'}
                  </span>
                  <div className="flex justify-between text-xs mt-3 pt-3" style={{ borderTop: '1px solid #27272a', paddingBottom: '12px' }}>
                    <div>
                      <span className="text-secondary block">Sales</span>
                      <span className="text-primary">₨ {(acc.totalSales || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-secondary block">Paid</span>
                      <span className="text-success">₨ {(acc.totalPaid || 0).toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-secondary block">Pending</span>
                      <span className={`font-bold ${pending > 0 ? 'text-danger' : 'text-success'}`}>
                        ₨ {pending.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    className="w-full py-2 mt-2 rounded bg-[#27272a] text-[#fafafa] flex justify-center items-center gap-2 hover:bg-[#3f3f46] transition-colors"
                    onClick={() => setSelectedShopkeeper(acc)}
                  >
                    View Details <ChevronRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Shopkeeper Modal ── */}
      {showAddShopkeeperModal && (
        <AddShopkeeperModal onClose={closeAddShopkeeperModal} />
      )}

      {/* ── Shopkeeper Details Modal ── */}
      {selectedShopkeeper && (
        <ShopkeeperDetailsModal 
          shopkeeper={selectedShopkeeper} 
          onClose={() => setSelectedShopkeeper(null)} 
        />
      )}
    </div>
  );
}
