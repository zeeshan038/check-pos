// src/pages/Inventory.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Archive, Banknote, AlertTriangle, MoreVertical, X } from 'lucide-react';
import GlobalHeader from '../components/GlobalHeader';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useApp } from '../context/AppContext';

export default function Inventory() {
  const { globalSearchQuery } = useApp();
  const [inventoryFilter, setInventoryFilter] = useState('All');
  const [inventoryBatches, setInventoryBatches] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBatch, setNewBatch] = useState({ supplier: '', weight: '', price: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [saleWeight, setSaleWeight] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'inventoryBatches'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const batches = [];
      snapshot.forEach((doc) => {
        batches.push({ _id: doc.id, ...doc.data() });
      });
      setInventoryBatches(batches);
    });
    return () => unsubscribe();
  }, []);

  const handleAddBatch = async (e) => {
    e.preventDefault();
    if (!newBatch.supplier || !newBatch.weight || !newBatch.price) return;
    setIsSubmitting(true);
    try {
      const batchId = `B-${Math.floor(1000 + Math.random() * 9000)}`;
      const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
      const formattedDate = new Date().toLocaleDateString('en-GB', dateOptions);

      await addDoc(collection(db, 'inventoryBatches'), {
        id: batchId,
        supplier: newBatch.supplier,
        weight: newBatch.weight,
        remaining: newBatch.weight,
        price: newBatch.price,
        status: 'In Stock',
        date: formattedDate,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewBatch({ supplier: '', weight: '', price: '' });
    } catch (error) {
      console.error("Error adding batch: ", error);
    }
    setIsSubmitting(false);
  };

  const handleSaleClick = (batch) => {
    setSelectedBatch(batch);
    setSaleWeight('');
    setIsSaleModalOpen(true);
  };

  const handleMakeSale = async (e) => {
    e.preventDefault();
    if (!selectedBatch || !saleWeight) return;
    setIsSubmitting(true);
    try {
      const currentRemaining = parseFloat(selectedBatch.remaining || 0);
      const deducted = parseFloat(saleWeight);
      let newRemaining = currentRemaining - deducted;
      if (newRemaining < 0) newRemaining = 0;
      
      let newStatus = 'In Stock';
      if (newRemaining <= 0) {
        newStatus = 'Sold Out';
      } else if (newRemaining <= 20) {
        newStatus = 'Low';
      }

      const batchRef = doc(db, 'inventoryBatches', selectedBatch._id);
      await updateDoc(batchRef, {
        remaining: newRemaining.toString(),
        status: newStatus
      });

      setIsSaleModalOpen(false);
      setSelectedBatch(null);
      setSaleWeight('');
    } catch (error) {
      console.error("Error updating batch: ", error);
    }
    setIsSubmitting(false);
  };

  const totalRemaining   = inventoryBatches.reduce((acc, b) => acc + parseFloat(b.remaining || 0), 0);
  const estimatedValue   = inventoryBatches.reduce((acc, b) => acc + (parseFloat(b.remaining || 0) * (parseFloat(b.price) || 12000)), 0);
  const lowBatchesCount  = inventoryBatches.filter(b => b.status === 'Low' || b.status === 'Sold Out').length;
  
  const filtered = inventoryBatches.filter(b => {
    // 1. Tab filter
    if (inventoryFilter !== 'All' && b.status !== inventoryFilter) return false;
    
    // 2. Global search
    if (globalSearchQuery) {
      const q = globalSearchQuery.toLowerCase();
      const matchId = b.id && b.id.toLowerCase().includes(q);
      const matchSupplier = b.supplier && b.supplier.toLowerCase().includes(q);
      if (!matchId && !matchSupplier) return false;
    }
    
    return true;
  });

  return (
    <div className="animate-fade-in">
      <GlobalHeader title="Inventory Management" subtitle="Track your poultry stock in real-time" />

      {/* ── Summary Cards ── */}
      <div className="grid-cols-3 mb-6">
        <div className="floating-card" style={{ padding: '20px' }}>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-secondary">Total Available Stock</p>
            <Archive size={18} className="text-primary" />
          </div>
          <h2 className="text-2xl text-primary">{totalRemaining} Mans</h2>
        </div>

        <div
          className="floating-card"
          style={{ padding: '20px', borderColor: lowBatchesCount > 0 ? 'rgba(245,158,11,0.3)' : 'var(--border-subtle)' }}
        >
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-secondary">Batches Needing Attention</p>
            <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
          </div>
          <h2 className="text-2xl" style={{ color: '#f59e0b' }}>{lowBatchesCount} Batches</h2>
        </div>

        <div className="floating-card" style={{ padding: '20px' }}>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-secondary">Estimated Stock Value</p>
            <Banknote size={18} className="text-success" />
          </div>
          <h2 className="text-2xl text-success">₨ {estimatedValue.toLocaleString()}</h2>
        </div>
      </div>

      {/* ── Batch Table ── */}
      <div className="floating-card p-0" style={{ padding: '0 24px' }}>
        <div className="flex justify-between items-center py-5 border-b border-[#27272a]">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-lg">Batch List <span className="text-sm text-secondary font-normal ml-1">({filtered.length})</span></h3>
            <div className="tabs-container" style={{ margin: 0 }}>
              {['All', 'In Stock', 'Low', 'Sold Out'].map(f => (
                <div
                  key={f}
                  className={`tab ${inventoryFilter === f ? 'active' : ''}`}
                  onClick={() => setInventoryFilter(f)}
                  style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                >
                  {f}
                </div>
              ))}
            </div>
          </div>
          <button 
            className="action-btn" 
            style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} />
            <span>Add New Batch</span>
          </button>
        </div>

        {/* Desktop table */}
        <div className="data-table-container desktop-only">
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch ID &amp; Supplier</th>
                <th>Date Arrived</th>
                <th>Stock Progress</th>
                <th>Remaining</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(batch => {
                const pct = (parseFloat(batch.remaining) / parseFloat(batch.weight)) * 100;
                const barColor = batch.status === 'In Stock' ? 'var(--success)' : batch.status === 'Low' ? '#f59e0b' : 'var(--danger)';
                return (
                  <tr key={batch._id || batch.id}>
                    <td>
                      <div className="font-bold text-primary">{batch.id}</div>
                      <div className="text-xs text-secondary mt-1">{batch.supplier}</div>
                    </td>
                    <td>{batch.date}</td>
                    <td style={{ width: '250px' }}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-secondary">{parseFloat(batch.weight) - parseFloat(batch.remaining)} Mans Sold</span>
                        <span className="text-primary">{batch.weight} Total</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#27272a', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, transition: 'width 0.3s ease' }} />
                      </div>
                    </td>
                    <td className={`font-bold ${batch.status === 'Sold Out' ? 'text-danger' : 'text-accent'}`}>
                      {batch.remaining} <span className="text-xs font-normal text-secondary">Mans</span>
                    </td>
                    <td>
                      <span className={`badge ${batch.status === 'In Stock' ? 'badge-success' : batch.status === 'Low' ? 'badge-warning' : 'badge-danger'}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="icon-btn hover:text-accent transition-colors" 
                        style={{ width: '32px', height: '32px', display: 'inline-flex', backgroundColor: 'transparent', border: 'none' }}
                        onClick={() => handleSaleClick(batch)}
                        title="Quick Sale"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="mobile-card-list pb-4 pt-4">
          {filtered.map(batch => {
            const pct = (parseFloat(batch.remaining) / parseFloat(batch.weight)) * 100;
            const barColor = batch.status === 'In Stock' ? 'var(--success)' : batch.status === 'Low' ? '#f59e0b' : 'var(--danger)';
            return (
              <div key={batch._id || batch.id} className="floating-card" style={{ padding: '16px', boxShadow: 'none', background: '#18181b' }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-primary">{batch.id}</h3>
                    <span className="text-xs text-secondary">{batch.supplier} • {batch.date}</span>
                  </div>
                  <button 
                    className="icon-btn hover:text-accent transition-colors" 
                    style={{ width: '28px', height: '28px', backgroundColor: 'transparent', border: 'none' }}
                    onClick={() => handleSaleClick(batch)}
                    title="Quick Sale"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
                <div className="mt-4 mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-secondary">{batch.weight} Mans Total</span>
                    <span className={`font-bold ${batch.status === 'Sold Out' ? 'text-danger' : 'text-accent'}`}>{batch.remaining} Left</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#27272a', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor }} />
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <span className={`badge ${batch.status === 'In Stock' ? 'badge-success' : batch.status === 'Low' ? 'badge-warning' : 'badge-danger'}`}>
                    {batch.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Add Batch Modal ── */}
      {/* ── Add Batch Modal ── */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
          <div className="floating-card w-full max-w-md p-6 relative">
            <button 
              className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
              onClick={() => setIsModalOpen(false)}
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-6 text-primary">Add New Batch</h2>
            <form onSubmit={handleAddBatch}>
              <div className="mb-4">
                <label className="block text-sm text-secondary mb-2">Supplier Name</label>
                <input 
                  type="text" 
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-accent transition-colors"
                  style={{ backgroundColor: '#18181b', color: '#fff', borderColor: '#27272a' }}
                  placeholder="e.g. Mian Farms"
                  value={newBatch.supplier}
                  onChange={(e) => setNewBatch({ ...newBatch, supplier: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-secondary mb-2">Total Weight (Mans)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-accent transition-colors"
                  style={{ backgroundColor: '#18181b', color: '#fff', borderColor: '#27272a' }}
                  placeholder="e.g. 200"
                  value={newBatch.weight}
                  onChange={(e) => setNewBatch({ ...newBatch, weight: e.target.value })}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm text-secondary mb-2">Price per Man (₨)</label>
                <input 
                  type="number" 
                  step="1"
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-accent transition-colors"
                  style={{ backgroundColor: '#18181b', color: '#fff', borderColor: '#27272a' }}
                  placeholder="e.g. 12000"
                  value={newBatch.price}
                  onChange={(e) => setNewBatch({ ...newBatch, price: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="action-btn"
                  style={{ backgroundColor: 'var(--accent-primary)', color: '#fff', border: 'none' }}
                >
                  {isSubmitting ? 'Adding...' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Quick Sale Modal ── */}
      {isSaleModalOpen && selectedBatch && createPortal(
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
          <div className="floating-card w-full max-w-md p-6 relative">
            <button 
              className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
              onClick={() => setIsSaleModalOpen(false)}
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-2 text-primary">Quick Sale</h2>
            <p className="text-sm text-secondary mb-6">
              Batch: <span className="text-accent">{selectedBatch.id}</span> ({selectedBatch.supplier}) <br/>
              Current Stock: <span className="font-bold text-primary">{selectedBatch.remaining} Mans</span>
            </p>
            <form onSubmit={handleMakeSale}>
              <div className="mb-6">
                <label className="block text-sm text-secondary mb-2">Mans Sold</label>
                <input 
                  type="number" 
                  step="0.1"
                  max={selectedBatch.remaining}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-accent transition-colors"
                  style={{ backgroundColor: '#18181b', color: '#fff', borderColor: '#27272a' }}
                  placeholder="e.g. 15"
                  value={saleWeight}
                  onChange={(e) => setSaleWeight(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                  onClick={() => setIsSaleModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="action-btn"
                  style={{ backgroundColor: 'var(--accent-primary)', color: '#fff', border: 'none' }}
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Sale'}
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
