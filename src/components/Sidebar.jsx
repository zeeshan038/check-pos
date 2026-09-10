// src/components/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  BookUser,
  Banknote,
  ShoppingCart,
  Plus,
  Bird,
  LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const navItems = [
  { path: '/dashboard',  label: 'Dashboard',  icon: <LayoutDashboard size={20} /> },
  { path: '/inventory',  label: 'Inventory',  icon: <Package         size={20} /> },
  { path: '/ledger',     label: 'Ledger',     icon: <BookUser        size={20} /> },
  { path: '/sales',      label: 'Sales',      icon: <Banknote        size={20} /> },
  { path: '/purchases',  label: 'Purchases',  icon: <ShoppingCart    size={20} /> },
];

export default function Sidebar() {
  const { openSaleModal } = useApp();

  return (
    <aside className="sidebar">
      <div className="brand">
        <Bird size={24} className="text-accent" />
        <span>ChickenPOS</span>
      </div>

      <div className="sidebar-action" onClick={openSaleModal}>
        <Plus size={18} />
        New Quick Sale
      </div>

      <nav className="nav-links">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
        
        <div style={{ flexGrow: 1 }}></div>
        
        <button 
          className="nav-item"
          style={{ 
            marginTop: 'auto', 
            background: 'transparent', 
            border: 'none', 
            width: '100%', 
            textAlign: 'left', 
            color: '#ef4444' 
          }}
          onClick={() => signOut(auth)}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
}
