// src/components/ShopkeeperDetailsModal.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Phone, Wallet, Package } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function ShopkeeperDetailsModal({ shopkeeper, onClose }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopkeeper?.id) return;

    const q = query(
      collection(db, 'sales'),
      where('shopkeeperId', '==', shopkeeper.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setSales(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [shopkeeper]);

  if (!shopkeeper) return null;

  const pending = (shopkeeper.totalSales || 0) - (shopkeeper.totalPaid || 0);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon"><User size={20} /></div>
            <div>
              <h2 className="modal-title">{shopkeeper.name}</h2>
              <p className="modal-subtitle flex items-center gap-2">
                <Phone size={12} /> {shopkeeper.phone || 'No phone provided'}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', paddingBottom: '24px' }}>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="floating-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-xs text-secondary mb-1">Total Sales</p>
              <h3 className="text-xl font-bold text-primary">₨ {(shopkeeper.totalSales || 0).toLocaleString()}</h3>
            </div>
            <div className="floating-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-xs text-secondary mb-1">Amount Paid</p>
              <h3 className="text-xl font-bold text-success">₨ {(shopkeeper.totalPaid || 0).toLocaleString()}</h3>
            </div>
            <div className="floating-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderColor: pending > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)' }}>
              <p className="text-xs text-secondary mb-1">Pending Balance</p>
              <h3 className={`text-xl font-bold ${pending > 0 ? 'text-danger' : 'text-success'}`}>
                ₨ {pending.toLocaleString()}
              </h3>
            </div>
          </div>

          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Package size={18} className="text-accent" /> Transaction History
          </h3>

          {loading ? (
            <div className="text-center py-8 text-secondary">
              <div className="modal-spinner mx-auto mb-3" style={{ width: '24px', height: '24px' }} />
              Loading transactions...
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-8 text-secondary bg-[#18181b] rounded-lg border border-[#27272a]">
              No transactions found for this shopkeeper.
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Weight</th>
                    <th>Rate/Man</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(sale => (
                    <tr key={sale.id}>
                      <td className="text-secondary">{sale.date}</td>
                      <td>{sale.weight} Mans</td>
                      <td>₨ {parseFloat(sale.rate).toLocaleString()}</td>
                      <td className="font-bold text-accent">₨ {parseFloat(sale.total).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${sale.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                          {sale.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
