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
} from 'lucide-react';
import { useApp } from '../context/AppContext';

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
      </nav>
    </aside>
  );
}
