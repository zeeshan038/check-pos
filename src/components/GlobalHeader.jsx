// src/components/GlobalHeader.jsx
import { Search, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function GlobalHeader({ title, subtitle }) {
  const { globalSearchQuery, setGlobalSearchQuery } = useApp();

  return (
    <div className="app-header">
      <div className="header-left">
        <h1 className="greeting">{title}</h1>
        <p className="date-text">{subtitle}</p>
      </div>
      <div className="header-right">
        <div className="search-bar">
          <Search size={18} className="text-secondary" />
          <input 
            type="text" 
            placeholder="Search batches, shops..." 
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
          />
        </div>
        <div className="icon-btn">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </div>
        <div className="avatar">D</div>
      </div>
    </div>
  );
}
