// src/components/ShopkeeperDetailsModal.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Phone, Wallet, Package, Search, ChevronLeft, ChevronRight, CheckCircle, MessageCircle } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function ShopkeeperDetailsModal({ shopkeeper, onClose }) {
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  
  // Pagination and Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Payment form states
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isPaying, setIsPaying] = useState(false);
  
  // Advance form states
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceNote, setAdvanceNote] = useState('');
  const [advanceMethod, setAdvanceMethod] = useState('Cash');
  const [isAdvancing, setIsAdvancing] = useState(false);
  
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);

  async function handleReceivePayment() {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;
    setIsPaying(true);
    try {
      const shopRef = doc(db, 'shopkeepers', shopkeeper.id);
      await updateDoc(shopRef, {
        totalPaid: increment(amount)
      });
      
      const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      
      await addDoc(collection(db, 'payments'), {
        shopkeeperId: shopkeeper.id,
        amount: amount,
        note: paymentNote.trim(),
        paymentMethod: paymentMethod,
        date: date,
        createdAt: serverTimestamp()
      });
      
      const oldPending = (shopkeeper.totalSales || 0) - (shopkeeper.totalPaid || 0);
      const totalPending = oldPending - amount;
      
      setPaymentSuccessData({
        type: 'receive',
        shopkeeperName: shopkeeper.name,
        shopkeeperPhone: shopkeeper.phone || '',
        amount: amount,
        oldPending: oldPending,
        totalPending: totalPending,
        date: date,
        note: paymentNote.trim(),
        paymentMethod: paymentMethod
      });
      
      setShowPaymentForm(false);
      setPaymentAmount('');
      setPaymentNote('');
    } catch (e) {
      console.error("Failed to receive payment:", e);
    } finally {
      setIsPaying(false);
    }
  }

  async function handleGiveAdvance() {
    const amount = parseFloat(advanceAmount);
    if (isNaN(amount) || amount <= 0) return;
    setIsAdvancing(true);
    try {
      const shopRef = doc(db, 'shopkeepers', shopkeeper.id);
      // Giving advance increases the debt, so we subtract from totalPaid
      await updateDoc(shopRef, {
        totalPaid: increment(-amount)
      });
      
      const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      
      await addDoc(collection(db, 'payments'), {
        shopkeeperId: shopkeeper.id,
        amount: -amount,
        note: advanceNote.trim(),
        paymentMethod: advanceMethod,
        date: date,
        createdAt: serverTimestamp()
      });
      
      const oldPending = (shopkeeper.totalSales || 0) - (shopkeeper.totalPaid || 0);
      const totalPending = oldPending + amount;
      
      setPaymentSuccessData({
        type: 'advance',
        shopkeeperName: shopkeeper.name,
        shopkeeperPhone: shopkeeper.phone || '',
        amount: amount,
        oldPending: oldPending,
        totalPending: totalPending,
        date: date,
        note: advanceNote.trim(),
        paymentMethod: advanceMethod
      });
      
      setShowAdvanceForm(false);
      setAdvanceAmount('');
      setAdvanceNote('');
    } catch (e) {
      console.error("Failed to give advance:", e);
    } finally {
      setIsAdvancing(false);
    }
  }

  useEffect(() => {
    if (!shopkeeper?.id) return;

    const qSales = query(
      collection(db, 'sales'),
      where('shopkeeperId', '==', shopkeeper.id)
      // Removed orderBy to avoid requiring a composite index. Sorted in JS.
    );

    const unsubSales = onSnapshot(qSales, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setSales(data);
      setLoadingSales(false);
    }, (error) => {
      console.error("Error fetching sales:", error);
      setLoadingSales(false);
    });

    const qPayments = query(
      collection(db, 'payments'),
      where('shopkeeperId', '==', shopkeeper.id)
      // Removed orderBy('createdAt', 'desc') to avoid requiring a new composite index.
      // We sort the combined array in memory anyway!
    );

    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setPayments(data);
      setLoadingPayments(false);
    }, (error) => {
      console.error("Error fetching payments:", error);
      setLoadingPayments(false);
    });

    return () => {
      unsubSales();
      unsubPayments();
    };
  }, [shopkeeper]);

  if (!shopkeeper) return null;

  const pending = (shopkeeper.totalSales || 0) - (shopkeeper.totalPaid || 0);

  const transactions = [...sales.map(s => ({ ...s, _type: 'sale' })), ...payments.map(p => ({ ...p, _type: 'payment' }))]
    .sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
      return timeB - timeA;
    });

  const filteredTransactions = transactions.filter(txn => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (txn.date && txn.date.toLowerCase().includes(q)) ||
      (txn.note && txn.note.toLowerCase().includes(q)) ||
      (txn.notes && txn.notes.toLowerCase().includes(q)) ||
      (txn.paymentStatus && txn.paymentStatus.toLowerCase().includes(q)) ||
      (txn._type === 'payment' && 'payment received'.includes(q))
    );
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
            <div className="floating-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderColor: pending > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)', position: 'relative' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-secondary mb-1">Pending Balance</p>
                  <h3 className={`text-xl font-bold ${pending > 0 ? 'text-danger' : 'text-success'}`}>
                    ₨ {pending.toLocaleString()}
                  </h3>
                </div>
                {!showPaymentForm && !showAdvanceForm && (
                  <div className="flex flex-col gap-2">
                    {pending > 0 && (
                      <button 
                        onClick={() => setShowPaymentForm(true)}
                        className="badge badge-warning cursor-pointer hover:opacity-80 border-none"
                        style={{ fontSize: '0.75rem', padding: '4px 8px', width: '100%' }}
                      >
                        Receive Payment
                      </button>
                    )}
                    <button 
                      onClick={() => setShowAdvanceForm(true)}
                      className="badge cursor-pointer hover:opacity-80 border-none"
                      style={{ fontSize: '0.75rem', padding: '4px 8px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', width: '100%' }}
                    >
                      Give Advance
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Modals */}
          {(showPaymentForm || showAdvanceForm) && (
            <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => { setShowPaymentForm(false); setShowAdvanceForm(false); }}>
              <div className="modal-box animate-scale-in relative" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                
                <div className="modal-header pb-4 border-b border-[#27272a] mb-4">
                  <div className="modal-title-group">
                    <div className="modal-icon">
                      <Wallet size={20} className={showAdvanceForm ? "text-danger" : "text-success"} />
                    </div>
                    <div>
                      <h2 className="modal-title">{showPaymentForm ? 'Receive Payment' : 'Give Advance / Loan'}</h2>
                      <p className="modal-subtitle">For {shopkeeper.name}</p>
                    </div>
                  </div>
                  <button 
                    className="modal-close" 
                    onClick={() => { setShowPaymentForm(false); setShowAdvanceForm(false); setPaymentAmount(''); setAdvanceAmount(''); setPaymentNote(''); setAdvanceNote(''); }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="modal-body flex flex-col gap-4">
                  
                  <div className="modal-field">
                    <label className="modal-label">Payment Method</label>
                    <div className="payment-toggle">
                      <button
                        className={`pay-btn ${((showPaymentForm && paymentMethod === 'Cash') || (showAdvanceForm && advanceMethod === 'Cash')) ? 'pay-active-paid' : ''}`}
                        onClick={() => showPaymentForm ? setPaymentMethod('Cash') : setAdvanceMethod('Cash')}
                        style={{ opacity: ((showPaymentForm && paymentMethod === 'Cash') || (showAdvanceForm && advanceMethod === 'Cash')) ? 1 : 0.6 }}
                      >
                        Cash
                      </button>
                      <button
                        className={`pay-btn ${((showPaymentForm && paymentMethod === 'Bank Transfer') || (showAdvanceForm && advanceMethod === 'Bank Transfer')) ? 'pay-active-paid' : ''}`}
                        onClick={() => showPaymentForm ? setPaymentMethod('Bank Transfer') : setAdvanceMethod('Bank Transfer')}
                        style={{ opacity: ((showPaymentForm && paymentMethod === 'Bank Transfer') || (showAdvanceForm && advanceMethod === 'Bank Transfer')) ? 1 : 0.6 }}
                      >
                        Bank Transfer
                      </button>
                    </div>
                  </div>

                  <div className="modal-field">
                    <label className="modal-label">Amount (₨) <span className="req">*</span></label>
                    <div className="modal-input-wrap">
                      <span className="input-prefix">₨</span>
                      <input 
                        type="number"
                        className="modal-input text-lg"
                        placeholder="Enter amount..."
                        value={showPaymentForm ? paymentAmount : advanceAmount}
                        onChange={(e) => showPaymentForm ? setPaymentAmount(e.target.value) : setAdvanceAmount(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="modal-field">
                    <label className="modal-label">Note <span className="optional">(optional)</span></label>
                    <textarea 
                      className="modal-textarea"
                      placeholder="Add a remark..."
                      rows={2}
                      value={showPaymentForm ? paymentNote : advanceNote}
                      onChange={(e) => showPaymentForm ? setPaymentNote(e.target.value) : setAdvanceNote(e.target.value)}
                    />
                  </div>

                  <button 
                    className="action-btn w-full mt-2 py-3 text-base font-bold flex justify-center items-center gap-2"
                    style={{ 
                      backgroundColor: showPaymentForm ? 'var(--accent-primary)' : 'rgba(239, 68, 68, 0.9)', 
                      color: '#fff', 
                      boxShadow: `0 4px 12px ${showPaymentForm ? 'rgba(37, 99, 235, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                    }}
                    onClick={showPaymentForm ? handleReceivePayment : handleGiveAdvance}
                    disabled={showPaymentForm ? isPaying : isAdvancing}
                  >
                    <Wallet size={18} />
                    {showPaymentForm 
                      ? (isPaying ? 'Saving...' : 'Save Payment') 
                      : (isAdvancing ? 'Saving...' : 'Give Advance')}
                  </button>

                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Package size={18} className="text-accent" /> Transaction History
            </h3>
            <div className="modal-input-wrap" style={{ width: '250px' }}>
              <Search size={16} className="input-icon" />
              <input 
                type="text"
                className="modal-input text-sm"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loadingSales || loadingPayments ? (
            <div className="text-center py-8 text-secondary">
              <div className="modal-spinner mx-auto mb-3" style={{ width: '24px', height: '24px' }} />
              Loading transactions...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-secondary bg-[#18181b] rounded-lg border border-[#27272a]">
              No transactions found matching your search.
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
                  {paginatedTransactions.map(txn => {
                    return (
                      <tr key={txn.id}>
                        <td className="text-secondary">{txn.date}</td>
                        {txn._type === 'sale' ? (
                          <>
                            <td>
                              <div className="font-medium text-white">{txn.weight} Mans</div>
                              {txn.notes && <div className="text-xs text-secondary mt-1">Note: {txn.notes}</div>}
                              {txn.paymentMethod && <div className="text-xs text-secondary">Method: {txn.paymentMethod}</div>}
                            </td>
                            <td className="text-secondary">₨ {txn.rate?.toLocaleString()}</td>
                            <td className="font-bold text-accent">₨ {txn.total?.toLocaleString()}</td>
                            <td>
                              <span className={`badge ${txn.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                                {txn.paymentStatus}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td colSpan="2">
                              {txn.amount < 0 ? (
                                <div className="flex items-center gap-1 font-medium text-danger">
                                  <Wallet size={14} /> Advance Given
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 font-medium text-success">
                                  <Wallet size={14} /> Payment Received
                                </div>
                              )}
                              {txn.note && <div className="text-xs text-secondary mt-1">Note: {txn.note}</div>}
                              {txn.paymentMethod && <div className="text-xs text-secondary">Method: {txn.paymentMethod}</div>}
                            </td>
                            <td className={`font-bold ${txn.amount < 0 ? 'text-danger' : 'text-success'}`}>
                              ₨ {Math.abs(txn.amount).toLocaleString()}
                            </td>
                            <td>
                              <span className={`badge ${txn.amount < 0 ? 'badge-danger' : 'badge-success'}`}>
                                {txn.amount < 0 ? 'Advanced' : 'Paid'}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {!loadingSales && !loadingPayments && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 py-3 border-t border-[#27272a]">
              <div className="text-xs text-secondary">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="action-btn"
                  style={{ padding: '6px', backgroundColor: 'rgba(255,255,255,0.05)', color: currentPage === 1 ? '#52525b' : '#fafafa' }}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium" style={{ minWidth: '40px', textAlign: 'center' }}>
                  {currentPage} / {totalPages}
                </span>
                <button
                  className="action-btn"
                  style={{ padding: '6px', backgroundColor: 'rgba(255,255,255,0.05)', color: currentPage === totalPages ? '#52525b' : '#fafafa' }}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Payment Success Modal */}
      {paymentSuccessData && (
        <div className="modal-overlay" onClick={() => setPaymentSuccessData(null)} style={{ backdropFilter: 'blur(4px)', zIndex: 10000 }}>
          <div className="modal-box relative animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '40px 32px' }}>
            <button className="modal-close" onClick={() => setPaymentSuccessData(null)} style={{ position: 'absolute', top: '16px', right: '16px' }}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: '10px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <CheckCircle size={40} className="text-success" />
              </div>
              <h2 className="text-2xl font-bold text-white" style={{ marginBottom: '12px' }}>
                {paymentSuccessData.type === 'receive' ? 'Payment Received!' : 'Advance Recorded!'}
              </h2>
              <p className="text-secondary text-sm" style={{ marginBottom: '32px', lineHeight: '1.6', maxWidth: '90%' }}>
                {paymentSuccessData.type === 'receive' 
                  ? 'The payment has been successfully recorded in the ledger.'
                  : 'The advance/loan has been successfully recorded in the ledger.'}
              </p>
              
              <div style={{ display: 'flex', width: '100%', gap: '12px' }}>
                <button 
                  className="action-btn"
                  style={{ flex: 1, backgroundColor: '#27272a', color: '#e4e4e7', border: '1px solid #3f3f46', padding: '12px', fontSize: '15px' }}
                  onClick={() => setPaymentSuccessData(null)}
                >
                  Done
                </button>
                <button 
                  className="action-btn flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  style={{ flex: 1.5, backgroundColor: '#25D366', color: '#fff', border: 'none', padding: '12px', fontSize: '15px', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)' }}
                  onClick={() => {
                    let message = '';
                    if (paymentSuccessData.type === 'receive') {
                      message = `*تاریخ:* ${paymentSuccessData.date}\n*دکاندار کا نام:* *_${paymentSuccessData.shopkeeperName}_*\n\n*تفصیل*\t\t*رقم*\n*پرانا بقایا*\t${paymentSuccessData.oldPending.toLocaleString()} روپے\n*وصول رقم*\t*${paymentSuccessData.amount.toLocaleString()} روپے*\n*ٹوٹل بقایا*\t${paymentSuccessData.totalPending.toLocaleString()} روپے`;
                    } else {
                      message = `*تاریخ:* ${paymentSuccessData.date}\n*دکاندار کا نام:* *_${paymentSuccessData.shopkeeperName}_*\n\n*تفصیل*\t\t*رقم*\n*پرانا بقایا*\t${paymentSuccessData.oldPending.toLocaleString()} روپے\n*ایڈوانس دی گئی رقم*\t*${paymentSuccessData.amount.toLocaleString()} روپے*\n*ٹوٹل بقایا*\t${paymentSuccessData.totalPending.toLocaleString()} روپے`;
                    }
                    
                    if (paymentSuccessData.paymentMethod) {
                      message += `\n\n*طریقہ ادائیگی:* ${paymentSuccessData.paymentMethod}`;
                    }
                    if (paymentSuccessData.note) {
                      message += `\n*نوٹ:* ${paymentSuccessData.note}`;
                    }
                    message += `\n\nشکریہ!`;

                    let phone = (paymentSuccessData.shopkeeperPhone || '').replace(/\D/g, '');
                    if (phone.startsWith('0')) {
                      phone = '92' + phone.substring(1);
                    } else if (phone.length === 10 && phone.startsWith('3')) {
                      phone = '92' + phone;
                    }
                    let waUrl = '';
                    if (phone) {
                      waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                    } else {
                      waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
                    }
                    window.open(waUrl, '_blank');
                    setPaymentSuccessData(null);
                  }}
                >
                  <MessageCircle size={18} /> Send WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
