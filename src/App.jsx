// src/App.jsx
// Layout wrapper — handles sidebar, outlet, modal, and bottom nav
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import { AppProvider, useApp } from './context/AppContext';
import Sidebar      from './components/Sidebar';
import BottomNav    from './components/BottomNav';
import NewSaleModal from './components/NewSaleModal';

import Dashboard  from './pages/Dashboard';
import Inventory  from './pages/Inventory';
import Ledger     from './pages/Ledger';
import Sales      from './pages/Sales';
import Purchases  from './pages/Purchases';

import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDoc, query, orderBy, onSnapshot } from 'firebase/firestore';

// ── Inner Layout (needs access to context) ──────────────────────────────────
function Layout() {
  const { showNewSaleModal, closeSaleModal, shopkeepers } = useApp();
  const [inventoryBatches, setInventoryBatches] = useState([]);

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
        rate: data.rate,
        total: data.total,
        paymentStatus: data.paymentStatus,
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
      if (shopSnap.exists()) {
        const shopData = shopSnap.data();
        let updatedSales = (shopData.totalSales || 0) + data.total;
        let updatedPaid = (shopData.totalPaid || 0);
        
        if (data.paymentStatus === 'Paid') {
          updatedPaid += data.total;
        }

        await updateDoc(shopRef, {
          totalSales: updatedSales,
          totalPaid: updatedPaid
        });
      }

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
          batches={inventoryBatches}
          shopkeepers={shopkeepers}
        />
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
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />}  />
          <Route path="inventory"  element={<Inventory />}  />
          <Route path="ledger"     element={<Ledger />}     />
          <Route path="sales"      element={<Sales />}      />
          <Route path="purchases"  element={<Purchases />}  />
        </Route>
      </Routes>
    </AppProvider>
  );
}

