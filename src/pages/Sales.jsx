// src/pages/Sales.jsx
import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import GlobalHeader from '../components/GlobalHeader';
import { useApp }   from '../context/AppContext';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, increment, deleteDoc } from 'firebase/firestore';

export default function Sales() {
  const { openSaleModal, globalSearchQuery } = useApp();
  const [salesData, setSalesData] = useState([]);
  const [inventoryBatches, setInventoryBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qSales = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      const sales = [];
      snapshot.forEach((doc) => {
        sales.push({ id: doc.id, ...doc.data() });
      });
      setSalesData(sales);
      setLoading(false);
    });

    const qBatches = query(collection(db, 'inventoryBatches'), orderBy('createdAt', 'desc'));
    const unsubBatches = onSnapshot(qBatches, (snapshot) => {
      const batches = [];
      snapshot.forEach((doc) => {
        batches.push({ _id: doc.id, id: doc.id, ...doc.data() });
      });
      setInventoryBatches(batches);
    });

    return () => {
      unsubSales();
      unsubBatches();
    };
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

  const handleDeleteSale = async (sale) => {
    if (!window.confirm("Are you sure you want to delete this sale? This will automatically restore the shopkeeper's ledger balance and the inventory stock.")) {
      return;
    }
    
    try {
      // 1. Rollback shopkeeper balances
      if (sale.shopkeeperId) {
        try {
          const shopRef = doc(db, 'shopkeepers', sale.shopkeeperId);
          const updates = {
            totalSales: increment(-parseFloat(sale.total || 0))
          };
          if (sale.paymentStatus === 'Paid') {
            updates.totalPaid = increment(-parseFloat(sale.total || 0));
          }
          await updateDoc(shopRef, updates);
        } catch (err) {
          console.warn("Could not update shopkeeper balance (maybe deleted?):", err);
        }
      }

      // 2. Rollback inventory batch
      if (sale.batchId) {
        try {
          // Find the batch by its logical ID (B-xxxx)
          // In Sales.jsx we pushed { id: doc.id, ...doc.data() } which means doc.data().id overwrote it.
          // Let's use the actual array we have in state. Wait, we don't have the firestore doc ID if it was overwritten.
          // Let's update how we fetch inventoryBatches to store _id as well, then use it here.
          const batch = inventoryBatches.find(b => b.id === sale.batchId || b.batchId === sale.batchId);
          if (batch && batch._id) {
            const currentRemaining = parseFloat(batch.remaining || 0);
            const addedWeight = parseFloat(sale.weight || 0);
            const newRemaining = currentRemaining + addedWeight;
            
            let newStatus = 'In Stock';
            if (newRemaining <= 0) newStatus = 'Sold Out';
            else if (newRemaining <= 20) newStatus = 'Low';

            const batchRef = doc(db, 'inventoryBatches', batch._id);
            await updateDoc(batchRef, {
              remaining: newRemaining.toString(),
              status: newStatus
            });
          }
        } catch (err) {
          console.warn("Could not update inventory batch (maybe deleted?):", err);
        }
      }

      // 3. Delete sale record
      await deleteDoc(doc(db, 'sales', sale.id));
    } catch (e) {
      console.error("Error deleting sale:", e);
      alert("Failed to delete sale.");
    }
  };

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
                  <th>Profit</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => {
                  const batch = inventoryBatches.find(b => b.id === sale.batchId);
                  const costPerMan = batch ? parseFloat(batch.price || 0) : parseFloat(sale.rate || 0);
                  const cost = costPerMan * parseFloat(sale.weight || 0);
                  const profit = parseFloat(sale.total || 0) - cost;
                  
                  return (
                  <tr key={sale.id}>
                    <td className="text-secondary">{sale.date}</td>
                    <td className="font-bold text-primary">{sale.shopkeeperName}</td>
                    <td>{sale.weight} Mans</td>
                    <td>₨ {parseFloat(sale.rate).toLocaleString()}</td>
                    <td className="font-bold text-accent">₨ {parseFloat(sale.total).toLocaleString()}</td>
                    <td className="font-bold" style={{ color: '#22c55e' }}>₨ {parseFloat(profit).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${sale.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleDeleteSale(sale)}
                        className="text-secondary hover:text-danger transition-colors p-1"
                        title="Delete Sale"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile cards */}
        {!loading && filteredSales.length > 0 && (
          <div className="mobile-card-list pb-4 pt-4">
          {filteredSales.map((sale) => {
            const batch = inventoryBatches.find(b => b.id === sale.batchId);
            const costPerMan = batch ? parseFloat(batch.price || 0) : parseFloat(sale.rate || 0);
            const cost = costPerMan * parseFloat(sale.weight || 0);
            const profit = parseFloat(sale.total || 0) - cost;
            
            return (
            <div key={sale.id} className="floating-card" style={{ padding: '16px', boxShadow: 'none', background: '#18181b' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-secondary">{sale.date}</span>
                <div className="flex items-center gap-3">
                  <span className={`badge ${sale.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                    {sale.paymentStatus}
                  </span>
                  <button 
                    onClick={() => handleDeleteSale(sale)}
                    className="text-secondary hover:text-danger transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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
                <div>
                  <p className="text-xs text-secondary mt-2">Total</p>
                  <p className="font-bold text-accent text-lg">₨ {parseFloat(sale.total).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-secondary mt-2">Profit</p>
                  <p className="font-bold text-lg" style={{ color: '#22c55e' }}>₨ {parseFloat(profit).toLocaleString()}</p>
                </div>
              </div>
            </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}
