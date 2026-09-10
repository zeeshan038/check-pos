import { useState, useRef, useEffect } from 'react';
import { Search, Bell, LogOut, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function GlobalHeader({ title, subtitle }) {
  const { globalSearchQuery, setGlobalSearchQuery } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

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
        
        <div className="relative" ref={dropdownRef}>
          <div 
            className="avatar cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            D
          </div>
          
          {showDropdown && (
            <div 
              className="absolute right-0 mt-2 w-48 bg-[#18181b] border border-[#27272a] rounded-lg shadow-xl overflow-hidden z-50 animate-fade-in"
              style={{ padding: '8px' }}
            >
              <div className="px-3 py-2 border-b border-[#27272a] mb-2">
                <p className="text-sm font-bold text-white">Dawood</p>
                <p className="text-xs text-secondary truncate">Bachagtraders@gmail.com</p>
              </div>
              
              <button 
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-[rgba(239,68,68,0.1)] rounded-md transition-colors flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
