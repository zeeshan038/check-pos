import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Plus, Archive, Banknote, AlertTriangle, MoreVertical, X, Eye, Edit2, Trash2 } from 'lucide-react';
import GlobalHeader from '../components/GlobalHeader';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { useApp } from '../context/AppContext';

export default function Inventory() {
  const navigate = useNavigate();
  const { globalSearchQuery } = useApp();
  const [inventoryFilter, setInventoryFilter] = useState('All');
  const [inventoryBatches, setInventoryBatches] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBatch, setNewBatch] = useState({ supplier: '', weight: '', price: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [saleWeight, setSaleWeight] = useState('');
  const [saleShopkeeper, setSaleShopkeeper] = useState('');

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [editBatch, setEditBatch] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  const handleDeleteBatch = async (batchId) => {
    if (window.confirm('Are you sure you want to delete this batch? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'inventoryBatches', batchId));
      } catch (error) {
        console.error("Error deleting batch: ", error);
      }
    }
  };

  const handleUpdateBatch = async (e) => {
    e.preventDefault();
    if (!editBatch.supplier || !editBatch.weight || !editBatch.price) return;
    setIsSubmitting(true);
    try {
      const weightDiff = parseFloat(editBatch.weight) - parseFloat(editBatch.originalWeight);
      const newRemaining = parseFloat(editBatch.remaining) + weightDiff;
      
      let newStatus = 'In Stock';
      if (newRemaining <= 0) newStatus = 'Sold Out';
      else if (newRemaining <= 20) newStatus = 'Low';

      const batchRef = doc(db, 'inventoryBatches', editBatch._id);
      await updateDoc(batchRef, {
        supplier: editBatch.supplier,
        weight: editBatch.weight,
        remaining: newRemaining.toString(),
        price: editBatch.price,
        status: newStatus
      });
      setEditBatch(null);
    } catch (error) {
      console.error("Error updating batch: ", error);
    }
    setIsSubmitting(false);
  };

  const handleSaleClick = (batch) => {
    setSelectedBatch(batch);
    setSaleWeight('');
    setSaleShopkeeper('');
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

      const totalSaleValue = deducted * parseFloat(selectedBatch.price || 0);
      const formattedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      
      await addDoc(collection(db, 'sales'), {
        shopkeeperName: saleShopkeeper || 'Walk-in Customer',
        batchId: selectedBatch.id,
        weight: deducted.toString(),
        rate: selectedBatch.price || 0,
        total: totalSaleValue,
        paymentStatus: 'Paid',
        date: formattedDate,
        createdAt: serverTimestamp()
      });

      setIsSaleModalOpen(false);
      setSelectedBatch(null);
      setSaleWeight('');
      setSaleShopkeeper('');
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
                      <div className="flex justify-end gap-2">
                     
                        <button type="button" className="row-action-btn" onClick={() => navigate('/inventory/' + batch.id)}>
                          <Eye size={14} /> View Details
                        </button>
                        <button type="button" className="row-action-btn" onClick={() => setEditBatch({...batch, originalWeight: batch.weight})}>
                          <Edit2 size={14} /> Edit Batch
                        </button>
                        <button type="button" className="row-action-btn danger" onClick={() => handleDeleteBatch(batch._id || batch.id)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
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
                  <div className="action-dropdown-container flex gap-2">
                    <button 
                      className="icon-btn hover:text-success transition-colors" 
                      style={{ width: '28px', height: '28px', backgroundColor: 'transparent', border: 'none' }}
                      onClick={() => handleSaleClick(batch)}
                      title="Quick Sale"
                    >
                      <Banknote size={16} />
                    </button>
                    <button 
                      className="icon-btn hover:text-accent transition-colors" 
                      style={{ width: '28px', height: '28px', backgroundColor: 'transparent', border: 'none' }}
                      onClick={() => navigate('/inventory/' + batch.id)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="icon-btn hover:text-accent transition-colors" 
                      style={{ width: '28px', height: '28px', backgroundColor: 'transparent', border: 'none' }}
                      onClick={() => setEditBatch({...batch, originalWeight: batch.weight})}
                      title="Edit Batch"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="icon-btn hover:text-danger transition-colors" 
                      style={{ width: '28px', height: '28px', backgroundColor: 'transparent', border: 'none' }}
                      onClick={() => handleDeleteBatch(batch._id || batch.id)}
                      title="Delete Batch"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
      {isModalOpen && createPortal(
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon"><Plus size={20} /></div>
                <div>
                  <h2 className="modal-title">Add New Batch</h2>
                  <p className="modal-subtitle">Record a new poultry stock arrival</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddBatch}>
              <div className="modal-body" style={{ gap: '16px' }}>
                <div className="modal-field">
                  <label className="modal-label">Supplier Name <span className="req">*</span></label>
                  <div className="modal-input-wrap">
                    <input 
                      type="text" 
                      className="modal-input"
                      placeholder="e.g. Mian Farms"
                      value={newBatch.supplier}
                      onChange={(e) => setNewBatch({ ...newBatch, supplier: e.target.value })}
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
                      value={newBatch.weight}
                      onChange={(e) => setNewBatch({ ...newBatch, weight: e.target.value })}
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
                      value={newBatch.price}
                      onChange={(e) => setNewBatch({ ...newBatch, price: e.target.value })}
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
                  <Plus size={18} /> {isSubmitting ? 'Adding...' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Quick Sale Modal ── */}
      {isSaleModalOpen && selectedBatch && createPortal(
        <div className="modal-overlay" onClick={() => setIsSaleModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon"><Banknote size={20} /></div>
                <div>
                  <h2 className="modal-title">Quick Sale</h2>
                  <p className="modal-subtitle">Fast stock deduction for {selectedBatch.id}</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setIsSaleModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleMakeSale}>
              <div className="modal-body" style={{ gap: '16px' }}>
                <div style={{ background: 'rgba(59,130,246,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <p className="text-sm text-secondary mb-1">
                    Batch: <span className="text-accent">{selectedBatch.id}</span> ({selectedBatch.supplier})
                  </p>
                  <p className="text-sm mb-0">
                    Current Stock: <span className="font-bold text-primary">{selectedBatch.remaining} Mans</span>
                  </p>
                </div>

                <div className="modal-field">
                  <label className="modal-label">Shopkeeper Name <span className="req">*</span></label>
                  <div className="modal-input-wrap">
                    <input 
                      type="text" 
                      className="modal-input"
                      placeholder="e.g. Ali Traders"
                      value={saleShopkeeper}
                      onChange={(e) => setSaleShopkeeper(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-field">
                  <label className="modal-label">Mans Sold <span className="req">*</span></label>
                  <div className="modal-input-wrap">
                    <input 
                      type="number" 
                      step="0.1"
                      max={selectedBatch.remaining}
                      className="modal-input"
                      placeholder="e.g. 15"
                      value={saleWeight}
                      onChange={(e) => setSaleWeight(e.target.value)}
                      required
                    />
                    <span className="input-suffix">Man</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="modal-cancel"
                  onClick={() => setIsSaleModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="modal-submit"
                >
                  <Banknote size={18} /> {isSubmitting ? 'Saving...' : 'Confirm Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      {/* ── Edit Batch Modal ── */}
      {editBatch && createPortal(
        <div className="modal-overlay" onClick={() => setEditBatch(null)}>
          <div className="modal-box" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon"><Edit2 size={20} /></div>
                <div>
                  <h2 className="modal-title">Edit Batch</h2>
                  <p className="modal-subtitle">Modify details for batch {editBatch.id}</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setEditBatch(null)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleUpdateBatch}>
              <div className="modal-body" style={{ gap: '16px' }}>
                <div className="modal-field">
                  <label className="modal-label">Supplier Name <span className="req">*</span></label>
                  <div className="modal-input-wrap">
                    <input 
                      type="text" 
                      className="modal-input"
                      value={editBatch.supplier}
                      onChange={(e) => setEditBatch({ ...editBatch, supplier: e.target.value })}
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
                      value={editBatch.weight}
                      onChange={(e) => setEditBatch({ ...editBatch, weight: e.target.value })}
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
                      value={editBatch.price}
                      onChange={(e) => setEditBatch({ ...editBatch, price: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="modal-cancel"
                  onClick={() => setEditBatch(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="modal-submit"
                >
                  <Edit2 size={18} /> {isSubmitting ? 'Saving...' : 'Update Batch'}
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
