// src/pages/Purchases.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import GlobalHeader from '../components/GlobalHeader';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { useApp } from '../context/AppContext';

export default function Purchases() {
  const { globalSearchQuery } = useApp();
  const [purchases, setPurchases] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPurchase, setNewPurchase] = useState({ supplier: '', weight: '', price: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'inventoryBatches'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ _id: doc.id, ...doc.data() });
      });
      setPurchases(data);
    });
    return () => unsubscribe();
  }, []);

  const filteredPurchases = purchases.filter(p => {
    if (!globalSearchQuery) return true;
    const q = globalSearchQuery.toLowerCase();
    return (
      (p.supplier && p.supplier.toLowerCase().includes(q)) ||
      (p.date && p.date.toLowerCase().includes(q))
    );
  });

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    if (!newPurchase.supplier || !newPurchase.weight || !newPurchase.price) return;
    setIsSubmitting(true);
    try {
      const batchId = `B-${Math.floor(1000 + Math.random() * 9000)}`;
      const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
      const formattedDate = new Date().toLocaleDateString('en-GB', dateOptions);

      await addDoc(collection(db, 'inventoryBatches'), {
        id: batchId,
        supplier: newPurchase.supplier,
        weight: newPurchase.weight,
        remaining: newPurchase.weight,
        price: newPurchase.price,
        status: 'In Stock',
        date: formattedDate,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewPurchase({ supplier: '', weight: '', price: '' });
    } catch (error) {
      console.error("Error adding purchase: ", error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="animate-fade-in">
      <GlobalHeader title="Purchases" subtitle="Stock Inward History" />

      <div className="floating-card p-0" style={{ padding: '0 24px' }}>
        <div className="flex justify-between items-center py-4 border-b border-[#27272a]">
          <h3 className="font-bold text-lg">Purchase Orders</h3>
          <button 
            className="action-btn" 
            style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} />
            <span>New Purchase</span>
          </button>
        </div>

        {/* Desktop table */}
        <div className="data-table-container desktop-only">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Supplier Name</th>
                <th>Weight Bought</th>
                <th>Rate / Man</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.map((p) => {
                const weight = parseFloat(p.weight) || 0;
                const rate = parseFloat(p.price) || 0;
                const total = weight * rate;
                return (
                  <tr key={p._id}>
                    <td className="text-secondary">{p.date}</td>
                    <td className="font-bold text-accent">{p.supplier}</td>
                    <td>{weight} Mans</td>
                    <td>₨ {rate.toLocaleString()}</td>
                    <td className="font-bold text-xl text-primary">₨ {total.toLocaleString()}</td>
                  </tr>
                );
              })}
              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-secondary py-8">
                    No purchases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="mobile-card-list pb-4 pt-4">
          {filteredPurchases.map((p) => {
            const weight = parseFloat(p.weight) || 0;
            const rate = parseFloat(p.price) || 0;
            const total = weight * rate;
            return (
              <div key={p._id} className="floating-card" style={{ padding: '16px', boxShadow: 'none', background: '#18181b' }}>
                <span className="text-xs text-secondary mb-1 block">{p.date}</span>
                <h3 className="font-bold text-accent mb-3">{p.supplier}</h3>
                <div className="grid-cols-2 text-sm mt-3 pt-3" style={{ borderTop: 'var(--border-subtle)' }}>
                  <div>
                    <p className="text-xs text-secondary">Weight Bought</p>
                    <p className="text-primary">{weight} Mans</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-secondary">Rate/Man</p>
                    <p className="text-primary">₨ {rate.toLocaleString()}</p>
                  </div>
                  <div className="mt-2" style={{ gridColumn: 'span 2' }}>
                    <p className="text-xs text-secondary">Total Cost</p>
                    <p className="font-bold text-xl text-primary">₨ {total.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredPurchases.length === 0 && (
            <div className="text-center text-secondary py-8">
              No purchases found.
            </div>
          )}
        </div>
      </div>

      {/* ── Add Purchase Modal ── */}
      {isModalOpen && createPortal(
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon"><Plus size={20} /></div>
                <div>
                  <h2 className="modal-title">Add New Purchase</h2>
                  <p className="modal-subtitle">Record a new inward stock purchase</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddPurchase}>
              <div className="modal-body" style={{ gap: '16px' }}>
                <div className="modal-field">
                  <label className="modal-label">Supplier Name <span className="req">*</span></label>
                  <div className="modal-input-wrap">
                    <input 
                      type="text" 
                      className="modal-input"
                      placeholder="e.g. Mian Farms"
                      value={newPurchase.supplier}
                      onChange={(e) => setNewPurchase({ ...newPurchase, supplier: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="modal-field">
                  <label className="modal-label">Total Weight (Mans) <span className="req">*</span></label>
                  <div className="modal-input-wrap">
                    <input 
                      type="number" 
                      step="0.1"
                      className="modal-input"
                      placeholder="e.g. 200"
                      value={newPurchase.weight}
                      onChange={(e) => setNewPurchase({ ...newPurchase, weight: e.target.value })}
                      required
                    />
                    <span className="input-suffix">Man</span>
                  </div>
                </div>
                
                <div className="modal-field">
                  <label className="modal-label">Price per Man (₨) <span className="req">*</span></label>
                  <div className="modal-input-wrap">
                    <span className="input-prefix">₨</span>
                    <input 
                      type="number" 
                      step="1"
                      className="modal-input"
                      placeholder="e.g. 12000"
                      value={newPurchase.price}
                      onChange={(e) => setNewPurchase({ ...newPurchase, price: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="modal-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="modal-submit"
                >
                  <Plus size={18} /> {isSubmitting ? 'Adding...' : 'Save Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
