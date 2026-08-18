// src/components/BottomNav.jsx
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  BookUser,
  Banknote,
  ShoppingCart,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard',  label: 'Dashboard',  icon: <LayoutDashboard size={20} /> },
  { path: '/inventory',  label: 'Inventory',  icon: <Package         size={20} /> },
  { path: '/ledger',     label: 'Ledger',     icon: <BookUser        size={20} /> },
  { path: '/sales',      label: 'Sales',      icon: <Banknote        size={20} /> },
  { path: '/purchases',  label: 'Purchases',  icon: <ShoppingCart    size={20} /> },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
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
  );
}
