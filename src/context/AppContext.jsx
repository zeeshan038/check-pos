// src/context/AppContext.jsx
// Global app state — modal visibility + live Firestore shopkeepers
import { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

const AppContext = createContext(null);

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  // ── Modal state ──────────────────────────────────────────────────────────
  const [showNewSaleModal, setShowNewSaleModal]           = useState(false);
  const [showAddShopkeeperModal, setShowAddShopkeeperModal] = useState(false);

  const openSaleModal           = () => setShowNewSaleModal(true);
  const closeSaleModal          = () => setShowNewSaleModal(false);
  const openAddShopkeeperModal  = () => setShowAddShopkeeperModal(true);
  const closeAddShopkeeperModal = () => setShowAddShopkeeperModal(false);

  // ── Live shopkeepers from Firestore ──────────────────────────────────────
  const [shopkeepers, setShopkeepers]     = useState([]);
  const [shopkeepersLoading, setShopkeepersLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'shopkeepers'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id:         doc.id,
        ...doc.data(),
      }));
      setShopkeepers(data);
      setShopkeepersLoading(false);
    }, (error) => {
      console.error('Firestore shopkeepers error:', error);
      setShopkeepersLoading(false);
    });

    return () => unsubscribe(); // cleanup on unmount
  }, []);

  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  return (
    <AppContext.Provider
      value={{
        // Global Search
        globalSearchQuery,
        setGlobalSearchQuery,

        // Modals
        showNewSaleModal,
        openSaleModal,
        closeSaleModal,

        showAddShopkeeperModal,
        openAddShopkeeperModal,
        closeAddShopkeeperModal,

        // Shopkeepers (live from Firestore)
        shopkeepers,
        shopkeepersLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
