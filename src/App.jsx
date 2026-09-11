// src/App.jsx
// Layout wrapper — handles sidebar, outlet, modal, and bottom nav
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import { AppProvider, useApp } from './context/AppContext';
import Sidebar      from './components/Sidebar';
import BottomNav    from './components/BottomNav';
import NewSaleModal from './components/NewSaleModal';
import { MessageCircle, CheckCircle, X } from 'lucide-react';

import Dashboard    from './pages/Dashboard';
import Inventory    from './pages/Inventory';
import BatchDetails from './pages/BatchDetails';
import Ledger       from './pages/Ledger';
import Sales        from './pages/Sales';
import Purchases    from './pages/Purchases';
import Login        from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDoc, query, orderBy, onSnapshot } from 'firebase/firestore';

// ── Inner Layout (needs access to context) ──────────────────────────────────
function Layout() {
  const { showNewSaleModal, closeSaleModal, shopkeepers } = useApp();
  const [inventoryBatches, setInventoryBatches] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [saleSuccessData, setSaleSuccessData] = useState(null);

  useEffect(() => {
    const qBatches = query(collection(db, 'inventoryBatches'), orderBy('createdAt', 'desc'));
    const unsubBatches = onSnapshot(qBatches, (snapshot) => {
      const batches = [];
      snapshot.forEach((doc) => {
        batches.push({ _id: doc.id, ...doc.data() });
      });
      setInventoryBatches(batches);
    });

    const qSales = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      const sales = [];
      snapshot.forEach((doc) => {
        sales.push({ _id: doc.id, ...doc.data() });
      });
      setSalesData(sales);
    });

    return () => {
      unsubBatches();
      unsubSales();
    };
  }, []);

  const computedBatches = inventoryBatches.map(batch => {
    const originalWeight = parseFloat(batch.weight) || 0;
    const soldWeight = salesData
      .filter(s => s.batchId === batch.id)
      .reduce((sum, s) => sum + (parseFloat(s.weight) || 0), 0);
    const computedRemaining = Number((originalWeight - soldWeight).toFixed(2));
    return { ...batch, remaining: computedRemaining };
  });

  const handleSaveSale = async (data) => {
    try {
      const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
      const formattedDate = new Date().toLocaleDateString('en-GB', dateOptions);

      // Find shopkeeper details by name
      let shopkeeper = shopkeepers.find(
        s => s.name.trim().toLowerCase() === data.shopkeeper.trim().toLowerCase()
      );

      if (!shopkeeper) {
        // Create new shopkeeper
        const newShopRef = await addDoc(collection(db, 'shopkeepers'), {
          name: data.shopkeeper.trim(),
          phone: '',
          balance: 0,
          totalSales: 0,
          totalPaid: 0,
          createdAt: serverTimestamp()
        });
        shopkeeper = {
          id: newShopRef.id,
          name: data.shopkeeper.trim()
        };
      }

      // 1. Add Sale Document
      await addDoc(collection(db, 'sales'), {
        shopkeeperId: shopkeeper.id,
        shopkeeperName: shopkeeper.name,
        batchId: data.batchId,
        weight: data.weight,
        rate: parseFloat(data.rate),
        total: data.total,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentStatus === 'Paid' ? data.paymentMethod : null,
        notes: data.notes,
        date: formattedDate,
        createdAt: serverTimestamp()
      });

      // 2. Deduct Weight from Inventory Batch
      const batch = inventoryBatches.find(b => b.id === data.batchId);
      if (batch) {
        const currentRemaining = parseFloat(batch.remaining || 0);
        const deducted = parseFloat(data.weight);
        let newRemaining = currentRemaining - deducted;
        if (newRemaining < 0) newRemaining = 0;
        
        let newStatus = 'In Stock';
        if (newRemaining <= 0) newStatus = 'Sold Out';
        else if (newRemaining <= 20) newStatus = 'Low';

        await updateDoc(doc(db, 'inventoryBatches', batch._id), {
          remaining: newRemaining.toString(),
          status: newStatus
        });
      }

      // 3. Update Shopkeeper Ledger
      const shopRef = doc(db, 'shopkeepers', shopkeeper.id);
      const shopSnap = await getDoc(shopRef);
      let oldPending = 0;
      let totalPending = 0;
      let receivedAmount = 0;

      if (shopSnap.exists()) {
        const shopData = shopSnap.data();
        oldPending = (shopData.totalSales || 0) - (shopData.totalPaid || 0);
        
        let updatedSales = (shopData.totalSales || 0) + data.total;
        let updatedPaid = (shopData.totalPaid || 0);
        
        if (data.paymentStatus === 'Paid') {
          updatedPaid += data.total;
          receivedAmount = data.total;
        }

        totalPending = updatedSales - updatedPaid;

        await updateDoc(shopRef, {
          totalSales: updatedSales,
          totalPaid: updatedPaid
        });
      }

      // 4. Trigger Success Modal
      setSaleSuccessData({
        shopkeeperName: shopkeeper.name,
        shopkeeperPhone: shopkeeper.phone || '',
        weight: data.weight,
        rate: data.rate,
        total: data.total,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentStatus === 'Paid' ? data.paymentMethod : null,
        date: formattedDate,
        oldPending,
        totalPending,
        receivedAmount
      });

      closeSaleModal();
    } catch (error) {
      console.error("Error saving sale:", error);
    }
  };

  return (
    <>
      <Sidebar />

      <main className="main-content">
        <Outlet />
      </main>

      {/* New Sale Modal — shopkeepers come live from Firestore via context */}
      {showNewSaleModal && (
        <NewSaleModal
          onClose={closeSaleModal}
          onSave={handleSaveSale}
          batches={computedBatches}
          shopkeepers={shopkeepers}
        />
      )}

      {/* Sale Success Modal */}
      {saleSuccessData && (
        <div className="modal-overlay" onClick={() => setSaleSuccessData(null)} style={{ backdropFilter: 'blur(4px)' }}>
          <div className="modal-box relative animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '40px 32px' }}>
            <button className="modal-close" onClick={() => setSaleSuccessData(null)} style={{ position: 'absolute', top: '16px', right: '16px' }}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: '10px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <CheckCircle size={40} className="text-success" />
              </div>
              <h2 className="text-2xl font-bold text-white" style={{ marginBottom: '12px' }}>Sale Recorded!</h2>
              <p className="text-secondary text-sm" style={{ marginBottom: '32px', lineHeight: '1.6', maxWidth: '90%' }}>
                The sale has been successfully added to the ledger and stock updated.
              </p>
              
              <div style={{ display: 'flex', width: '100%', gap: '12px' }}>
                <button 
                  className="action-btn"
                  style={{ flex: 1, backgroundColor: '#27272a', color: '#e4e4e7', border: '1px solid #3f3f46', padding: '12px', fontSize: '15px' }}
                  onClick={() => setSaleSuccessData(null)}
                >
                  Done
                </button>
                <button 
                  className="action-btn flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  style={{ flex: 1.5, backgroundColor: '#25D366', color: '#fff', border: 'none', padding: '12px', fontSize: '15px', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)' }}
                  onClick={() => {
                    const currentSalePending = saleSuccessData.total - saleSuccessData.receivedAmount;
                    let message = `*تاریخ:* ${saleSuccessData.date}\n*دکاندار کا نام:* *_${saleSuccessData.shopkeeperName}_*\n\n*تفصیل*\t\t*رقم*\n*نیا مال*\t\t${saleSuccessData.total.toLocaleString()} روپے\n*پرانا بقایا*\t${saleSuccessData.oldPending.toLocaleString()} روپے\n*وصول رقم*\t*${saleSuccessData.receivedAmount.toLocaleString()} روپے*\n*بقایا رقم*\t\t${currentSalePending.toLocaleString()} روپے\n*ٹوٹل بقایا*\t${saleSuccessData.totalPending.toLocaleString()} روپے`;
                    
                    if (saleSuccessData.paymentMethod) {
                      message += `\n\n*طریقہ ادائیگی:* ${saleSuccessData.paymentMethod}`;
                    }
                    
                    let phone = (saleSuccessData.shopkeeperPhone || '').replace(/\D/g, '');
                    // Handle Pakistani local number formats (0300... -> 92300...)
                    if (phone.startsWith('0')) {
                      phone = '92' + phone.substring(1);
                    } else if (phone.length === 10 && phone.startsWith('3')) {
                      phone = '92' + phone;
                    }

                    let waUrl = '';
                    if (phone) {
                      waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                    } else {
                      // Fallback if no phone is saved
                      waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
                    }
                    window.open(waUrl, '_blank');
                    setSaleSuccessData(null);
                  }}
                >
                  <MessageCircle size={18} /> Send WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}

// ── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />}  />
          <Route path="inventory"  element={<Inventory />}  />
          <Route path="inventory/:batchId" element={<BatchDetails />} />
          <Route path="ledger"     element={<Ledger />}     />
          <Route path="sales"      element={<Sales />}      />
          <Route path="purchases"  element={<Purchases />}  />
        </Route>
      </Routes>
    </AppProvider>
  );
}

