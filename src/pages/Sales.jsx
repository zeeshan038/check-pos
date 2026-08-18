// src/pages/Sales.jsx
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import GlobalHeader from '../components/GlobalHeader';
import { useApp }   from '../context/AppContext';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function Sales() {
  const { openSaleModal, globalSearchQuery } = useApp();
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sales = [];
      snapshot.forEach((doc) => {
        sales.push({ id: doc.id, ...doc.data() });
      });
      setSalesData(sales);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredSales = salesData.filter(sale => {
    if (!globalSearchQuery) return true;
    const q = globalSearchQuery.toLowerCase();
    return (
      (sale.shopkeeperName && sale.shopkeeperName.toLowerCase().includes(q)) ||
      (sale.date && sale.date.toLowerCase().includes(q)) ||
      (sale.paymentStatus && sale.paymentStatus.toLowerCase().includes(q))
    );
  });

  return (
    <div className="animate-fade-in">
      <GlobalHeader title="Sales" subtitle="Recent Transactions" />

      <div className="floating-card p-0" style={{ padding: '0 24px' }}>
        <div className="flex justify-between items-center py-4 border-b border-[#27272a]">
          <h3 className="font-bold text-lg">Sales Records</h3>
          <button
            className="action-btn"
            style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
            onClick={openSaleModal}
          >
            <Plus size={18} />
            <span>New Sale</span>
          </button>
        </div>

        {loading && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#52525b' }}>
            <div className="modal-spinner" style={{ margin: '0 auto 12px', width: '28px', height: '28px' }} />
            <p>Loading sales...</p>
          </div>
        )}

        {!loading && filteredSales.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#71717a' }}>
            <p>No sales found.</p>
          </div>
        )}

        {/* Desktop table */}
        {!loading && filteredSales.length > 0 && (
          <div className="data-table-container desktop-only">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Shopkeeper</th>
                  <th>Weight</th>
                  <th>Rate / Man</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="text-secondary">{sale.date}</td>
                    <td className="font-bold text-primary">{sale.shopkeeperName}</td>
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

        {/* Mobile cards */}
        {!loading && filteredSales.length > 0 && (
          <div className="mobile-card-list pb-4 pt-4">
          {filteredSales.map((sale) => (
            <div key={sale.id} className="floating-card" style={{ padding: '16px', boxShadow: 'none', background: '#18181b' }}>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-secondary">{sale.date}</span>
                <span className={`badge ${sale.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                  {sale.paymentStatus}
                </span>
              </div>
              <h3 className="font-bold mb-3 text-primary">{sale.shopkeeperName}</h3>
              <div className="grid-cols-2 text-sm mt-3 pt-3" style={{ borderTop: 'var(--border-subtle)' }}>
                <div>
                  <p className="text-xs text-secondary">Weight</p>
                  <p className="text-primary">{sale.weight} Mans</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-secondary">Rate/Man</p>
                  <p className="text-primary">₨ {parseFloat(sale.rate).toLocaleString()}</p>
                </div>
                <div className="mt-2" style={{ gridColumn: 'span 2' }}>
                  <p className="text-xs text-secondary">Total</p>
                  <p className="font-bold text-accent text-xl">₨ {parseFloat(sale.total).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
