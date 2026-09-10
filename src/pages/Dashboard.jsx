// src/pages/Dashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, AlertCircle, Wallet, Scale, Package, Plus, Calendar, DollarSign
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

import GlobalHeader   from '../components/GlobalHeader';
import CustomTooltip  from '../components/CustomTooltip';
import { useApp }     from '../context/AppContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { openSaleModal, shopkeepers, globalSearchQuery } = useApp();
  const [chartPeriod, setChartPeriod] = useState('Week');
  
  const [salesData, setSalesData] = useState([]);
  const [inventoryBatches, setInventoryBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    // Listen to sales
    const qSales = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      const sales = [];
      snapshot.forEach((doc) => sales.push({ id: doc.id, ...doc.data() }));
      setSalesData(sales);
      setLoading(false);
    });

    // Listen to inventory batches for low stock alerts
    const qBatches = query(collection(db, 'inventoryBatches'), orderBy('createdAt', 'desc'));
    const unsubBatches = onSnapshot(qBatches, (snapshot) => {
      const batches = [];
      snapshot.forEach((doc) => batches.push({ id: doc.id, ...doc.data() }));
      setInventoryBatches(batches);
    });

    return () => {
      unsubSales();
      unsubBatches();
    };
  }, []);

  const stats = useMemo(() => {
    let targetDayStr;
    let targetMonthStr;
    let isFiltering = false;

    if (selectedDate) {
      const d = new Date(selectedDate);
      targetDayStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      targetMonthStr = targetDayStr.split(' ').slice(1).join(' '); // e.g. "Sep 2026"
      isFiltering = true;
    } else {
      targetDayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      targetMonthStr = targetDayStr.split(' ').slice(1).join(' '); // e.g. "Sep 2026"
    }

    let soldTargetDay = 0;
    let revenueTargetMonth = 0;
    let salesTargetMonthMans = 0;
    let profitTargetMonth = 0;

    const batchPrices = {};
    inventoryBatches.forEach(b => {
      batchPrices[b.id] = parseFloat(b.price || 0);
    });

    salesData.forEach(sale => {
      const weight = parseFloat(sale.weight || 0);
      const total = parseFloat(sale.total || 0);
      const costPerMan = batchPrices[sale.batchId] || parseFloat(sale.rate || 0); // fallback if batch not found
      const cost = costPerMan * weight;
      const profit = total - cost;
      
      if (isFiltering) {
        // If a specific date is selected, ALL stats reflect that exact date
        if (sale.date === targetDayStr) {
          soldTargetDay += weight;
          revenueTargetMonth += total;
          salesTargetMonthMans += weight;
          profitTargetMonth += profit;
        }
      } else {
        // Default behavior: Target Day for "Sold Today", Target Month for others
        if (sale.date === targetDayStr) {
          soldTargetDay += weight;
        }
        if (sale.date && sale.date.includes(targetMonthStr)) {
          revenueTargetMonth += total;
          salesTargetMonthMans += weight;
          profitTargetMonth += profit;
        }
      }
    });

    // Pending Ledger
    let pendingPayments = 0;
    shopkeepers.forEach(s => {
      const pending = (s.totalSales || 0) - (s.totalPaid || 0);
      if (pending > 0) pendingPayments += pending;
    });

    return {
      soldToday: `${soldTargetDay.toFixed(1)} Mans`,
      revenueMonth: `₨ ${revenueTargetMonth.toLocaleString()}`,
      salesMonth: `${salesTargetMonthMans.toFixed(1)} Mans`,
      profitMonth: `₨ ${profitTargetMonth.toLocaleString()}`,
      pendingPayments: `₨ ${pendingPayments.toLocaleString()}`,
      isFiltering,
      targetDayStr,
      targetMonthStr
    };
  }, [salesData, shopkeepers, selectedDate, inventoryBatches]);

  const chartData = useMemo(() => {
    // Group sales by date
    const grouped = {};
    salesData.forEach(sale => {
      const d = sale.date;
      if (!grouped[d]) {
        grouped[d] = { name: d.split(' ')[0], fullDate: d, sales: 0, totalPrice: 0, count: 0, dateObj: new Date(d) };
      }
      grouped[d].sales += parseFloat(sale.total || 0);
      grouped[d].totalPrice += parseFloat(sale.rate || 0);
      grouped[d].count += 1;
    });

    let data = Object.values(grouped).sort((a, b) => a.dateObj - b.dateObj);
    data = data.map(d => ({
      ...d,
      price: Math.round(d.totalPrice / d.count) // average price trend
    }));

    // Simple slice for "Week" (last 7 days of data)
    if (chartPeriod === 'Week') data = data.slice(-7);
    if (chartPeriod === 'Month') data = data.slice(-30);
    
    // If no data, provide an empty array so chart doesn't break
    return data;
  }, [salesData, chartPeriod]);

  // Determine overdue shopkeepers
  const overdueShopkeepers = shopkeepers.filter(s => (s.totalSales || 0) - (s.totalPaid || 0) > 0);

  const currentDate = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="animate-fade-in">
      <GlobalHeader
        title="Assalamu Alaikum👋"
        subtitle={`Overview • ${currentDate}`}
      />

      {/* Date Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#18181b', padding: '8px 16px', borderRadius: '8px', border: '1px solid #27272a' }}>
          <Calendar size={18} className="text-secondary" />
          <input 
            type="date" 
            style={{ background: 'transparent', border: 'none', color: '#fafafa', outline: 'none' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        {selectedDate && (
          <button 
            style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
            onClick={() => setSelectedDate('')}
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid-stats">
        <div className="floating-card">
          <div className="stat-card-header">
            <p className="text-sm text-secondary">{stats.isFiltering ? `Sold on ${stats.targetDayStr}` : 'Total Sold Today'}</p>
            <div className="stat-icon text-accent"><Scale size={16} /></div>
          </div>
          <h2 className="text-2xl text-accent">
            {loading ? <span className="modal-spinner" style={{ width: 20, height: 20, borderColor: '#3b82f6' }}/> : stats.soldToday}
          </h2>
        </div>
        <div className="floating-card">
          <div className="stat-card-header">
            <p className="text-sm text-secondary">{stats.isFiltering ? `Revenue on ${stats.targetDayStr}` : 'Revenue This Month'}</p>
            <div className="stat-icon text-success"><TrendingUp size={16} /></div>
          </div>
          <h2 className="text-2xl text-success">
            {loading ? <span className="modal-spinner" style={{ width: 20, height: 20, borderColor: '#10b981' }}/> : stats.revenueMonth}
          </h2>
        </div>
        <div className="floating-card">
          <div className="stat-card-header">
            <p className="text-sm text-secondary">{stats.isFiltering ? `Sales on ${stats.targetDayStr}` : 'Sales This Month'}</p>
            <div className="stat-icon text-primary"><Package size={16} /></div>
          </div>
          <h2 className="text-2xl">
            {loading ? <span className="modal-spinner" style={{ width: 20, height: 20 }}/> : stats.salesMonth}
          </h2>
        </div>
        <div className="floating-card">
          <div className="stat-card-header">
            <p className="text-sm text-secondary">{stats.isFiltering ? `Profit on ${stats.targetDayStr}` : 'Profit This Month'}</p>
            <div className="stat-icon text-success" style={{ color: '#22c55e' }}><DollarSign size={16} /></div>
          </div>
          <h2 className="text-2xl" style={{ color: '#22c55e' }}>
            {loading ? <span className="modal-spinner" style={{ width: 20, height: 20 }}/> : stats.profitMonth}
          </h2>
        </div>
        <div className="floating-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div className="stat-card-header">
            <p className="text-sm text-secondary">Pending Ledger</p>
            <div className="stat-icon text-danger"><Wallet size={16} /></div>
          </div>
          <h2 className="text-2xl text-danger">
            {stats.pendingPayments}
          </h2>
        </div>
      </div>

      {/* ── Charts ── */}
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
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₨${(v / 1000).toFixed(1)}k`} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full text-secondary">No sales data available.</div>
            )}
          </div>
        </div>

        <div className="floating-card">
          <h3 className="font-bold text-xl mb-6">Price Trend (Per Man)</h3>
          <div className="chart-container">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 500', 'dataMax + 500']} tickFormatter={v => `₨${(v / 1000).toFixed(1)}k`} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="price" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full text-secondary">No price data available.</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom: Recent Sales + Alerts ── */}
      <div className="grid-bottom">
        <div className="floating-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl">Recent Sales</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="action-btn"
                onClick={openSaleModal}
                style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: 'var(--accent-primary)', color: '#fff' }}
              >
                <Plus size={14} /> New Sale
              </button>
              <button
                className="action-btn"
                onClick={() => navigate('/sales')}
                style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#27272a', color: '#fafafa' }}
              >
                View All
              </button>
            </div>
          </div>
          <div className="data-table-container">
            {salesData.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Shopkeeper</th>
                    <th>Weight</th>
                    <th>Rate / Man</th>
                    <th>Total Amount</th>
                    <th>Profit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData
                    .filter(sale => {
                      if (!globalSearchQuery) return true;
                      const q = globalSearchQuery.toLowerCase();
                      return (
                        (sale.shopkeeperName && sale.shopkeeperName.toLowerCase().includes(q)) ||
                        (sale.paymentStatus && sale.paymentStatus.toLowerCase().includes(q))
                      );
                    })
                    .slice(0, 4)
                    .map((sale) => {
                      const batch = inventoryBatches.find(b => b.id === sale.batchId);
                      const costPerMan = batch ? parseFloat(batch.price || 0) : parseFloat(sale.rate || 0);
                      const cost = costPerMan * parseFloat(sale.weight || 0);
                      const profit = parseFloat(sale.total || 0) - cost;
                      
                      return (
                      <tr key={sale.id}>
                        <td className="font-bold text-primary">{sale.shopkeeperName}</td>
                        <td>{sale.weight} Mans</td>
                        <td>₨ {parseFloat(sale.rate).toLocaleString()}</td>
                        <td className="font-bold text-accent">₨ {parseFloat(sale.total).toLocaleString()}</td>
                        <td className="font-bold" style={{ color: '#22c55e' }}>₨ {parseFloat(profit).toLocaleString()}</td>
                        <td>
                          <span className={`badge ${sale.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                            {sale.paymentStatus}
                          </span>
                        </td>
                      </tr>
                      );
                    })}
                </tbody>
              </table>
            ) : (
              <div className="text-secondary text-center py-4">No recent sales.</div>
            )}
          </div>
        </div>

        <div className="floating-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <AlertCircle size={20} className="text-danger" /> Action Required
            </h3>
          </div>
          <div>
            {inventoryBatches
              .filter(b => b.status === 'Low' || b.status === 'Sold Out')
              .slice(0, 3)
              .map(batch => (
                <div key={batch.id} className="alert-item">
                  <div>
                    <p className="font-bold text-primary">Batch {batch._id ? batch._id.slice(-4) : batch.id}</p>
                    <p className="text-xs text-secondary mt-1">Remaining: {batch.remaining} Mans</p>
                  </div>
                  <span className={`badge ${batch.status === 'Sold Out' ? 'badge-danger' : 'badge-warning'}`}>
                    {batch.status}
                  </span>
                </div>
              ))}
            
            {overdueShopkeepers.slice(0, 3).map(s => {
              const pending = (s.totalSales || 0) - (s.totalPaid || 0);
              return (
                <div key={s.id} className="alert-item" style={{ backgroundColor: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' }}>
                  <div>
                    <p className="font-bold text-primary">Pending Payment</p>
                    <p className="text-xs text-secondary mt-1">{s.name} (₨ {pending.toLocaleString()})</p>
                  </div>
                  <span className="badge badge-warning">Overdue</span>
                </div>
              );
            })}

            {inventoryBatches.filter(b => b.status === 'Low' || b.status === 'Sold Out').length === 0 && overdueShopkeepers.length === 0 && (
              <div className="text-secondary text-center py-4">All caught up! No urgent actions.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
