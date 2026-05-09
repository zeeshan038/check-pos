import { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  BookUser, 
  Banknote, 
  ShoppingCart,
  Plus,
  Bird,
  Search,
  Bell,
  TrendingUp,
  AlertCircle,
  Wallet,
  Scale,
  MoreVertical,
  Archive,
  AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import './index.css';

// --- MOCK DATA ---
const dashboardStats = {
  soldToday: '42.5 Mans',
  profitMonth: '₨ 245,000',
  salesMonth: '850 Mans',
  pendingPayments: '₨ 85,500'
};

const inventoryBatches = [
  { id: 'B-7829', supplier: 'Mian Farms', date: '29 Apr 2026', weight: '200', remaining: '42.5', status: 'In Stock' },
  { id: 'B-7828', supplier: 'Chaudhry Broilers', date: '26 Apr 2026', weight: '150', remaining: '12', status: 'Low' },
  { id: 'B-7827', supplier: 'Haji Farms', date: '22 Apr 2026', weight: '180', remaining: '0', status: 'Sold Out' },
  { id: 'B-7826', supplier: 'Mian Farms', date: '20 Apr 2026', weight: '220', remaining: '0', status: 'Sold Out' },
];

const ledgerAccounts = [
  { name: 'Ali Poultry', totalSales: '₨ 450,000', paid: '₨ 400,000', pending: '₨ 50,000' },
  { name: 'Rizwan Chicken Center', totalSales: '₨ 320,000', paid: '₨ 320,000', pending: '₨ 0' },
  { name: 'Haji & Sons Meat', totalSales: '₨ 890,000', paid: '₨ 865,000', pending: '₨ 25,000' },
  { name: 'Bismillah Foods', totalSales: '₨ 150,000', paid: '₨ 139,500', pending: '₨ 10,500' },
];

const salesData = [
  { date: 'Today, 10:30 AM', shop: 'Ali Poultry', weight: '5 Mans', rate: '₨ 12,000', total: '₨ 60,000', status: 'Paid' },
  { date: 'Today, 09:15 AM', shop: 'Bismillah Foods', weight: '2.5 Mans', rate: '₨ 12,000', total: '₨ 30,000', status: 'Pending' },
  { date: 'Yesterday', shop: 'Rizwan Chicken', weight: '10 Mans', rate: '₨ 11,800', total: '₨ 118,000', status: 'Paid' },
  { date: '27 Apr 2026', shop: 'Haji & Sons Meat', weight: '15 Mans', rate: '₨ 11,500', total: '₨ 172,500', status: 'Paid' },
];

const purchasesData = [
  { date: '29 Apr 2026', supplier: 'Mian Farms (Faisalabad)', weight: '200 Mans', rate: '₨ 10,500', total: '₨ 2,100,000' },
  { date: '26 Apr 2026', supplier: 'Chaudhry Broilers', weight: '150 Mans', rate: '₨ 10,800', total: '₨ 1,620,000' },
];

const salesChartData = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

const priceTrendData = [
  { name: 'W1', price: 10500 },
  { name: 'W2', price: 10800 },
  { name: 'W3', price: 11200 },
  { name: 'W4', price: 12000 },
  { name: 'W5', price: 11800 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#18181b', padding: '10px', border: '1px solid #27272a', borderRadius: '8px' }}>
        <p style={{ color: '#a1a1aa', fontSize: '12px', marginBottom: '4px' }}>{label}</p>
        <p style={{ color: '#fafafa', fontWeight: 'bold' }}>{`₨ ${payload[0].value.toLocaleString()}`}</p>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [chartPeriod, setChartPeriod] = useState('Week');
  const [inventoryFilter, setInventoryFilter] = useState('All');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} className="nav-icon" /> },
    { id: 'inventory', label: 'Inventory', icon: <Package size={20} className="nav-icon" /> },
    { id: 'ledger', label: 'Ledger', icon: <BookUser size={20} className="nav-icon" /> },
    { id: 'sales', label: 'Sales', icon: <Banknote size={20} className="nav-icon" /> },
    { id: 'purchases', label: 'Purchases', icon: <ShoppingCart size={20} className="nav-icon" /> },
  ];

  const GlobalHeader = ({ title, subtitle }) => (
    <div className="app-header">
      <div className="header-left">
        <h1 className="greeting">{title}</h1>
        <p className="date-text">{subtitle}</p>
      </div>
      <div className="header-right">
        <div className="search-bar">
          <Search size={18} className="text-secondary" />
          <input type="text" placeholder="Search batches, shops..." />
        </div>
        <div className="icon-btn">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </div>
        <div className="avatar">D</div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="animate-fade-in">
      <GlobalHeader 
        title="Assalamu Alaikum, Dawood 👋" 
        subtitle="Overview • Wednesday, 29 April 2026" 
      />

      <div className="grid-stats">
        <div className="floating-card">
          <div className="stat-card-header">
            <p className="text-sm text-secondary">Total Sold Today</p>
            <div className="stat-icon text-accent"><Scale size={16} /></div>
          </div>
          <h2 className="text-2xl text-accent">{dashboardStats.soldToday}</h2>
        </div>
        <div className="floating-card">
          <div className="stat-card-header">
            <p className="text-sm text-secondary">Profit This Month</p>
            <div className="stat-icon text-success"><TrendingUp size={16} /></div>
          </div>
          <h2 className="text-2xl text-success">{dashboardStats.profitMonth}</h2>
        </div>
        <div className="floating-card">
          <div className="stat-card-header">
            <p className="text-sm text-secondary">Sales This Month</p>
            <div className="stat-icon text-primary"><Package size={16} /></div>
          </div>
          <h2 className="text-2xl">{dashboardStats.salesMonth}</h2>
        </div>
        <div className="floating-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div className="stat-card-header">
            <p className="text-sm text-secondary">Pending Ledger</p>
            <div className="stat-icon text-danger"><Wallet size={16} /></div>
          </div>
          <h2 className="text-2xl text-danger">{dashboardStats.pendingPayments}</h2>
        </div>
      </div>

      <div className="grid-main">
        <div className="floating-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl">Sales Revenue</h3>
            <div className="tabs-container" style={{ margin: 0 }}>
              {['Week', 'Month', 'Year'].map(p => (
                <div 
                  key={p} 
                  className={`tab ${chartPeriod === p ? 'active' : ''}`}
                  onClick={() => setChartPeriod(p)}
                >
                  {p}
                </div>
              ))}
            </div>
          </div>
          
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₨${val/1000}k`} />
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="floating-card">
          <h3 className="font-bold text-xl mb-6">Price Trend (Per Man)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 1000', 'dataMax + 1000']} tickFormatter={(val) => `₨${val/1000}k`} />
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="price" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-bottom">
        <div className="floating-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl">Recent Sales</h3>
            <button className="action-btn" onClick={() => setActiveTab('sales')} style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#27272a', color: '#fafafa' }}>
              View All
            </button>
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shopkeeper</th>
                  <th>Weight</th>
                  <th>Rate / Man</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {salesData.slice(0, 3).map((sale, i) => (
                  <tr key={i}>
                    <td className="font-bold text-primary">{sale.shop}</td>
                    <td>{sale.weight}</td>
                    <td>{sale.rate}</td>
                    <td className="font-bold text-accent">{sale.total}</td>
                    <td>
                      <span className={`badge ${sale.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="floating-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <AlertCircle size={20} className="text-danger" /> Action Required
            </h3>
          </div>
          <div>
            {inventoryBatches.filter(b => b.status === 'Low' || b.status === 'Sold Out').slice(0, 2).map(batch => (
              <div key={batch.id} className="alert-item">
                <div>
                  <p className="font-bold text-primary">{batch.id}</p>
                  <p className="text-xs text-secondary mt-1">Remaining: {batch.remaining} Mans</p>
                </div>
                <span className={`badge ${batch.status === 'Sold Out' ? 'badge-danger' : 'badge-warning'}`}>
                  {batch.status}
                </span>
              </div>
            ))}
            <div className="alert-item" style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
              <div>
                <p className="font-bold text-primary">Pending Payment</p>
                <p className="text-xs text-secondary mt-1">Ali Poultry (₨ 50,000)</p>
              </div>
              <span className="badge badge-warning">Overdue</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => {
    const totalRemaining = inventoryBatches.reduce((acc, curr) => acc + parseFloat(curr.remaining), 0);
    const lowBatchesCount = inventoryBatches.filter(b => b.status === 'Low' || b.status === 'Sold Out').length;
    
    return (
      <div className="animate-fade-in">
        <GlobalHeader title="Inventory Management" subtitle="Track your poultry stock in real-time" />

        {/* Inventory Summary Cards */}
        <div className="grid-cols-3 mb-6">
          <div className="floating-card" style={{ padding: '20px' }}>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-secondary">Total Available Stock</p>
              <Archive size={18} className="text-primary" />
            </div>
            <h2 className="text-2xl text-primary">{totalRemaining} Mans</h2>
          </div>
          <div className="floating-card" style={{ padding: '20px', borderColor: lowBatchesCount > 0 ? 'rgba(245,158,11,0.3)' : 'var(--border-subtle)' }}>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-secondary">Batches Needing Attention</p>
              <AlertTriangle size={18} className="text-warning" style={{ color: '#f59e0b' }} />
            </div>
            <h2 className="text-2xl text-accent" style={{ color: '#f59e0b' }}>{lowBatchesCount} Batches</h2>
          </div>
          <div className="floating-card" style={{ padding: '20px' }}>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-secondary">Estimated Stock Value</p>
              <Banknote size={18} className="text-success" />
            </div>
            <h2 className="text-2xl text-success">₨ {(totalRemaining * 12000).toLocaleString()}</h2>
          </div>
        </div>

        <div className="floating-card p-0" style={{ padding: '0 24px' }}>
          <div className="flex justify-between items-center py-5 border-b border-[#27272a]">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-lg">Batch List</h3>
              <div className="tabs-container" style={{ margin: 0 }}>
                {['All', 'In Stock', 'Low', 'Sold Out'].map(f => (
                  <div 
                    key={f} 
                    className={`tab ${inventoryFilter === f ? 'active' : ''}`}
                    onClick={() => setInventoryFilter(f)}
                    style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                  >
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <button className="action-btn" style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}>
              <Plus size={18} />
              <span>Add New Batch</span>
            </button>
          </div>
          
          <div className="data-table-container desktop-only">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Batch ID & Supplier</th>
                  <th>Date Arrived</th>
                  <th>Stock Progress</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventoryBatches
                  .filter(b => inventoryFilter === 'All' || b.status === inventoryFilter)
                  .map(batch => {
                  const percentLeft = (parseFloat(batch.remaining) / parseFloat(batch.weight)) * 100;
                  
                  return (
                    <tr key={batch.id}>
                      <td>
                        <div className="font-bold text-primary">{batch.id}</div>
                        <div className="text-xs text-secondary mt-1">{batch.supplier}</div>
                      </td>
                      <td>{batch.date}</td>
                      <td style={{ width: '250px' }}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-secondary">{parseFloat(batch.weight) - parseFloat(batch.remaining)} Mans Sold</span>
                          <span className="text-primary">{batch.weight} Total</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: '#27272a', borderRadius: '4px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              width: `${percentLeft}%`, 
                              height: '100%', 
                              backgroundColor: batch.status === 'In Stock' ? 'var(--success)' : batch.status === 'Low' ? '#f59e0b' : 'var(--danger)',
                              transition: 'width 0.3s ease'
                            }} 
                          />
                        </div>
                      </td>
                      <td className={`font-bold ${batch.status === 'Sold Out' ? 'text-danger' : 'text-accent'}`}>
                        {batch.remaining} <span className="text-xs font-normal text-secondary">Mans</span>
                      </td>
                      <td>
                        <span className={`badge ${batch.status === 'In Stock' ? 'badge-success' : batch.status === 'Low' ? 'badge-warning' : 'badge-danger'}`}>
                          {batch.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="icon-btn" style={{ width: '32px', height: '32px', display: 'inline-flex', backgroundColor: 'transparent', border: 'none' }}>
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="mobile-card-list pb-4 pt-4">
            {inventoryBatches
              .filter(b => inventoryFilter === 'All' || b.status === inventoryFilter)
              .map(batch => {
              const percentLeft = (parseFloat(batch.remaining) / parseFloat(batch.weight)) * 100;
              
              return (
                <div key={batch.id} className="floating-card" style={{ padding: '16px', boxShadow: 'none', background: '#18181b' }}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-primary">{batch.id}</h3>
                      <span className="text-xs text-secondary">{batch.supplier} • {batch.date}</span>
                    </div>
                    <button className="icon-btn" style={{ width: '28px', height: '28px', backgroundColor: 'transparent', border: 'none' }}>
                      <MoreVertical size={18} />
                    </button>
                  </div>
                  
                  <div className="mt-4 mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-secondary">{batch.weight} Mans Total</span>
                      <span className={`font-bold ${batch.status === 'Sold Out' ? 'text-danger' : 'text-accent'}`}>{batch.remaining} Left</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#27272a', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${percentLeft}%`, 
                          height: '100%', 
                          backgroundColor: batch.status === 'In Stock' ? 'var(--success)' : batch.status === 'Low' ? '#f59e0b' : 'var(--danger)'
                        }} 
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-2">
                    <span className={`badge ${batch.status === 'In Stock' ? 'badge-success' : batch.status === 'Low' ? 'badge-warning' : 'badge-danger'}`}>
                      {batch.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderLedger = () => (
    <div className="animate-fade-in">
      <GlobalHeader title="Ledger" subtitle="Shopkeeper Balances" />

      <div className="floating-card p-0" style={{ padding: '0 24px' }}>
        <div className="data-table-container desktop-only">
          <table className="data-table">
            <thead>
              <tr>
                <th>Shopkeeper Name</th>
                <th>Total Sales</th>
                <th>Amount Paid</th>
                <th>Pending Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledgerAccounts.map((acc, i) => (
                <tr key={i}>
                  <td className="font-bold text-primary">{acc.name}</td>
                  <td>{acc.totalSales}</td>
                  <td className="text-success">{acc.paid}</td>
                  <td className={`font-bold ${acc.pending !== '₨ 0' ? 'text-danger' : 'text-success'}`}>
                    {acc.pending}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="mobile-card-list pb-4 pt-4">
          {ledgerAccounts.map((acc, i) => (
            <div key={i} className="floating-card" style={{ padding: '16px', boxShadow: 'none', background: '#18181b' }}>
              <h3 className="font-bold mb-2 text-primary">{acc.name}</h3>
              <div className="flex justify-between text-xs mt-3 pt-3" style={{ borderTop: 'var(--border-subtle)' }}>
                <div>
                  <span className="text-secondary block">Sales:</span>
                  <span className="text-primary">{acc.totalSales}</span>
                </div>
                <div>
                  <span className="text-secondary block">Paid:</span>
                  <span className="text-success">{acc.paid}</span>
                </div>
                <div className="text-right">
                  <span className="text-secondary block">Pending:</span>
                  <span className={acc.pending !== '₨ 0' ? 'text-danger font-bold' : 'text-success'}>
                    {acc.pending}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSales = () => (
    <div className="animate-fade-in">
      <GlobalHeader title="Sales" subtitle="Recent Transactions" />

      <div className="floating-card p-0" style={{ padding: '0 24px' }}>
        <div className="flex justify-between items-center py-4 border-b border-[#27272a]">
          <h3 className="font-bold text-lg">Sales Records</h3>
          <button className="action-btn" style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}>
            <Plus size={18} />
            <span>New Sale</span>
          </button>
        </div>
        <div className="data-table-container desktop-only">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Shopkeeper</th>
                <th>Weight</th>
                <th>Rate / Man</th>
                <th>Total Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((sale, i) => (
                <tr key={i}>
                  <td className="text-secondary">{sale.date}</td>
                  <td className="font-bold text-primary">{sale.shop}</td>
                  <td>{sale.weight}</td>
                  <td>{sale.rate}</td>
                  <td className="font-bold text-accent">{sale.total}</td>
                  <td>
                    <span className={`badge ${sale.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="mobile-card-list pb-4 pt-4">
          {salesData.map((sale, i) => (
            <div key={i} className="floating-card" style={{ padding: '16px', boxShadow: 'none', background: '#18181b' }}>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-secondary">{sale.date}</span>
                <span className={`badge ${sale.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                  {sale.status}
                </span>
              </div>
              <h3 className="font-bold mb-3 text-primary">{sale.shop}</h3>
              <div className="grid-cols-2 text-sm mt-3 pt-3" style={{ borderTop: 'var(--border-subtle)' }}>
                <div>
                  <p className="text-xs text-secondary">Weight</p>
                  <p className="text-primary">{sale.weight}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-secondary">Rate/Man</p>
                  <p className="text-primary">{sale.rate}</p>
                </div>
                <div className="mt-2" style={{ gridColumn: 'span 2' }}>
                  <p className="text-xs text-secondary">Total</p>
                  <p className="font-bold text-accent text-xl">{sale.total}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPurchases = () => (
    <div className="animate-fade-in">
      <GlobalHeader title="Purchases" subtitle="Stock Inward History" />

      <div className="floating-card p-0" style={{ padding: '0 24px' }}>
        <div className="flex justify-between items-center py-4 border-b border-[#27272a]">
          <h3 className="font-bold text-lg">Purchase Orders</h3>
          <button className="action-btn" style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}>
            <Plus size={18} />
            <span>New Purchase</span>
          </button>
        </div>
        <div className="data-table-container desktop-only">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Supplier Name</th>
                <th>Weight Bought</th>
                <th>Rate / Man</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {purchasesData.map((purchase, i) => (
                <tr key={i}>
                  <td className="text-secondary">{purchase.date}</td>
                  <td className="font-bold text-accent">{purchase.supplier}</td>
                  <td>{purchase.weight}</td>
                  <td>{purchase.rate}</td>
                  <td className="font-bold text-xl text-primary">{purchase.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="mobile-card-list pb-4 pt-4">
          {purchasesData.map((purchase, i) => (
            <div key={i} className="floating-card" style={{ padding: '16px', boxShadow: 'none', background: '#18181b' }}>
              <span className="text-xs text-secondary mb-1 block">{purchase.date}</span>
              <h3 className="font-bold text-accent mb-3">{purchase.supplier}</h3>
              <div className="grid-cols-2 text-sm mt-3 pt-3" style={{ borderTop: 'var(--border-subtle)' }}>
                <div>
                  <p className="text-xs text-secondary">Weight Bought</p>
                  <p className="text-primary">{purchase.weight}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-secondary">Rate/Man</p>
                  <p className="text-primary">{purchase.rate}</p>
                </div>
                <div className="mt-2" style={{ gridColumn: 'span 2' }}>
                  <p className="text-xs text-secondary">Total Cost</p>
                  <p className="font-bold text-xl text-primary">{purchase.total}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="sidebar">
        <div className="brand">
          <Bird size={24} className="text-accent" />
          <span>ChickenPOS</span>
        </div>
        
        <div className="sidebar-action" onClick={() => setActiveTab('sales')}>
          <Plus size={18} />
          New Quick Sale
        </div>

        <div className="nav-links">
          {navItems.map(item => (
            <div 
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </aside>

      <main className="main-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'inventory' && renderInventory()}
        {activeTab === 'ledger' && renderLedger()}
        {activeTab === 'sales' && renderSales()}
        {activeTab === 'purchases' && renderPurchases()}
      </main>

      <nav className="bottom-nav">
        {navItems.map(item => (
          <div 
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    </>
  );
}
