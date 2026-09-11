import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Package, User, Calendar, Tag, CheckCircle, Search, FileText } from 'lucide-react';
import GlobalHeader from '../components/GlobalHeader';

export default function BatchDetails() {
  const { batchId } = useParams();
  const navigate = useNavigate();

  const [batch, setBatch] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    if (!batchId) return;

    // Fetch batch details by string id field
    const fetchBatch = async () => {
      try {
        const qBatch = query(collection(db, 'inventoryBatches'), where('id', '==', batchId));
        const batchSnap = await getDocs(qBatch);
        if (!batchSnap.empty) {
          const docData = batchSnap.docs[0];
          setBatch({ _id: docData.id, ...docData.data() });
        } else {
          setBatch(null);
        }
      } catch (error) {
        console.error("Error fetching batch:", error);
      }
    };

    fetchBatch();

    // Listen to sales for this batch
    const qSales = query(
      collection(db, 'sales'),
      where('batchId', '==', batchId)
    );

    const unsubSales = onSnapshot(qSales, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ _id: doc.id, ...doc.data() });
      });
      // Sort by createdAt descending
      data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });
      setSales(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching sales:", error);
      setLoading(false);
    });

    return () => unsubSales();
  }, [batchId]);

  if (loading) {
    return (
      <div className="page-layout">
        <GlobalHeader title="Batch Details" />
        <div className="page-content flex items-center justify-center">
          <div className="modal-spinner mx-auto" style={{ width: '40px', height: '40px' }} />
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="page-layout">
        <GlobalHeader title="Batch Details" />
        <div className="page-content text-center py-20 text-secondary">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-white mb-2">Batch Not Found</h2>
          <p>The batch you are looking for does not exist or has been deleted.</p>
          <button 
            className="action-btn mt-6 mx-auto" 
            style={{ backgroundColor: '#27272a', color: '#fff', padding: '8px 16px' }}
            onClick={() => navigate('/inventory')}
          >
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  // Derived calculations
  const originalWeight = parseFloat(batch.weight) || 0;
  const totalSoldWeight = sales.reduce((acc, sale) => acc + (parseFloat(sale.weight) || 0), 0);
  const remainingWeight = Number((originalWeight - totalSoldWeight).toFixed(2));
  const ratePerMan = parseFloat(batch.price) || 0;
  
  const totalRevenue = sales.reduce((acc, sale) => acc + (parseFloat(sale.total) || 0), 0);

  // Filter sales
  const filteredSales = sales.filter(sale => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (sale.shopkeeperName && sale.shopkeeperName.toLowerCase().includes(q)) ||
      (sale.date && sale.date.toLowerCase().includes(q)) ||
      (sale.paymentStatus && sale.paymentStatus.toLowerCase().includes(q)) ||
      (sale.notes && sale.notes.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSales = filteredSales.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="page-layout">
      <GlobalHeader title="Batch Details" />
      
      <div className="page-content">
        {/* Top Header Row with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate('/inventory')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#18181b] border border-[#27272a] text-secondary hover:text-white hover:bg-[#27272a] transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Package size={24} className="text-accent" /> Batch {batch.id}
            </h1>
            <p className="text-secondary text-sm">Detailed overview and sales history</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid-stats mb-8">
          {/* Batch Info */}
          <div className="floating-card" style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', padding: '20px 24px' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#18181b] flex items-center justify-center border border-[#27272a]">
                <User size={18} className="text-secondary" />
              </div>
              <div>
                <p className="text-xs text-secondary mb-0.5">Supplier</p>
                <p className="font-bold text-white">{batch.supplier}</p>
              </div>
            </div>
            
            <div className="w-px h-10 bg-[#27272a] hidden md:block"></div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#18181b] flex items-center justify-center border border-[#27272a]">
                <Calendar size={18} className="text-secondary" />
              </div>
              <div>
                <p className="text-xs text-secondary mb-0.5">Date Arrived</p>
                <p className="font-bold text-white">{batch.date}</p>
              </div>
            </div>

            <div className="w-px h-10 bg-[#27272a] hidden md:block"></div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#18181b] flex items-center justify-center border border-[#27272a]">
                <Tag size={18} className="text-secondary" />
              </div>
              <div>
                <p className="text-xs text-secondary mb-0.5">Status</p>
                <span className={`badge ${batch.status === 'In Stock' ? 'badge-success' : batch.status === 'Low' ? 'badge-warning' : 'badge-danger'}`}>
                  {batch.status}
                </span>
              </div>
            </div>

            <div className="w-px h-10 bg-[#27272a] hidden md:block"></div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#18181b] flex items-center justify-center border border-[#27272a]">
                <CheckCircle size={18} className="text-secondary" />
              </div>
              <div>
                <p className="text-xs text-secondary mb-0.5">Rate / Man</p>
                <p className="font-bold text-white">₨ {ratePerMan.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="floating-card">
            <div className="stat-card-header">
              <p className="text-sm text-secondary">Total Received</p>
              <div className="stat-icon text-white"><Package size={16} /></div>
            </div>
            <h2 className="text-2xl font-bold">{originalWeight} <span className="text-sm text-secondary">Mans</span></h2>
            <p className="text-xs text-secondary mt-2">Initial batch weight</p>
          </div>
          
          <div className="floating-card">
            <div className="stat-card-header">
              <p className="text-sm text-secondary">Total Sold</p>
              <div className="stat-icon text-accent" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}><CheckCircle size={16} /></div>
            </div>
            <h2 className="text-2xl font-bold text-accent">{totalSoldWeight.toFixed(1)} <span className="text-sm text-accent opacity-80">Mans</span></h2>
            <p className="text-xs text-secondary mt-2">Across {sales.length} sales</p>
          </div>

          <div className="floating-card">
            <div className="stat-card-header">
              <p className="text-sm text-secondary">Remaining Stock</p>
              <div className="stat-icon text-danger" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}><Tag size={16} /></div>
            </div>
            <h2 className={`text-2xl font-bold ${remainingWeight > 0 ? 'text-success' : 'text-danger'}`}>
              {remainingWeight} <span className={`text-sm opacity-80 ${remainingWeight > 0 ? 'text-success' : 'text-danger'}`}>Mans</span>
            </h2>
            <p className="text-xs text-secondary mt-2">Currently available</p>
          </div>

          <div className="floating-card">
            <div className="stat-card-header">
              <p className="text-sm text-secondary">Total Revenue</p>
              <div className="stat-icon text-success" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}><FileText size={16} /></div>
            </div>
            <h2 className="text-2xl font-bold text-success">₨ {totalRevenue.toLocaleString()}</h2>
            <p className="text-xs text-secondary mt-2">From all recorded sales</p>
          </div>
        </div>

        {/* Sales Table */}
        <div className="floating-card" style={{ padding: 0 }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-[#27272a] gap-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FileText size={18} className="text-accent" /> Sales Records
            </h3>
            <div className="modal-input-wrap" style={{ width: '300px', maxWidth: '100%' }}>
              <Search size={16} className="input-icon" />
              <input 
                type="text"
                className="modal-input text-sm"
                placeholder="Search shopkeeper or date..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Shopkeeper Name</th>
                  <th>Weight Sold</th>
                  <th>Rate / Man</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSales.length > 0 ? (
                  paginatedSales.map(sale => (
                    <tr key={sale._id}>
                      <td className="text-secondary">{sale.date}</td>
                      <td>
                        <span className="font-bold text-white">{sale.shopkeeperName}</span>
                        {sale.notes && <div className="text-xs text-secondary mt-1">Note: {sale.notes}</div>}
                      </td>
                      <td className="font-medium text-accent">{parseFloat(Number(sale.weight).toFixed(2))} Mans</td>
                      <td className="text-secondary">₨ {parseFloat(sale.rate).toLocaleString()}</td>
                      <td className="font-bold text-success">₨ {parseFloat(sale.total).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${sale.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                          {sale.paymentStatus}
                        </span>
                        {sale.paymentMethod && <div className="text-xs text-secondary mt-1">{sale.paymentMethod}</div>}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-secondary">
                      No sales records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container p-4 border-t border-[#27272a] flex justify-between items-center bg-[#09090b]">
              <div className="text-sm text-secondary">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredSales.length)} of {filteredSales.length} entries
              </div>
              <div className="flex gap-2">
                <button 
                  className="action-btn text-xs px-3 py-1"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ backgroundColor: '#18181b', color: currentPage === 1 ? '#52525b' : '#fff', border: '1px solid #27272a' }}
                >
                  Previous
                </button>
                <div className="flex items-center px-2 text-sm text-white">
                  Page {currentPage} of {totalPages}
                </div>
                <button 
                  className="action-btn text-xs px-3 py-1"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ backgroundColor: '#18181b', color: currentPage === totalPages ? '#52525b' : '#fff', border: '1px solid #27272a' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
