// src/context/AppContext.jsx
// Global app state — modal visibility + live Firestore shopkeepers
import { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';

const AppContext = createContext(null);

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  // ── Auth state ───────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
        // Auth
        user,
        authLoading,

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
