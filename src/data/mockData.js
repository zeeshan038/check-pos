// src/data/mockData.js
// All mock data — replace each export with a Firestore call later

export const dashboardStats = {
  soldToday: '42.5 Mans',
  profitMonth: '₨ 245,000',
  salesMonth: '850 Mans',
  pendingPayments: '₨ 85,500',
};

export const inventoryBatches = [
  { id: 'B-7829', supplier: 'Mian Farms',        date: '29 Apr 2026', weight: '200', remaining: '42.5', status: 'In Stock'  },
  { id: 'B-7828', supplier: 'Chaudhry Broilers',  date: '26 Apr 2026', weight: '150', remaining: '12',   status: 'Low'       },
  { id: 'B-7827', supplier: 'Haji Farms',          date: '22 Apr 2026', weight: '180', remaining: '0',    status: 'Sold Out'  },
  { id: 'B-7826', supplier: 'Mian Farms',          date: '20 Apr 2026', weight: '220', remaining: '0',    status: 'Sold Out'  },
];

export const ledgerAccounts = [
  { name: 'Ali Poultry',          totalSales: '₨ 450,000', paid: '₨ 400,000', pending: '₨ 50,000'  },
  { name: 'Rizwan Chicken Center', totalSales: '₨ 320,000', paid: '₨ 320,000', pending: '₨ 0'       },
  { name: 'Haji & Sons Meat',      totalSales: '₨ 890,000', paid: '₨ 865,000', pending: '₨ 25,000'  },
  { name: 'Bismillah Foods',       totalSales: '₨ 150,000', paid: '₨ 139,500', pending: '₨ 10,500'  },
];

export const salesData = [
  { date: 'Today, 10:30 AM', shop: 'Ali Poultry',      weight: '5 Mans',   rate: '₨ 12,000', total: '₨ 60,000',   status: 'Paid'    },
  { date: 'Today, 09:15 AM', shop: 'Bismillah Foods',   weight: '2.5 Mans', rate: '₨ 12,000', total: '₨ 30,000',   status: 'Pending' },
  { date: 'Yesterday',        shop: 'Rizwan Chicken',   weight: '10 Mans',  rate: '₨ 11,800', total: '₨ 118,000',  status: 'Paid'    },
  { date: '27 Apr 2026',      shop: 'Haji & Sons Meat', weight: '15 Mans',  rate: '₨ 11,500', total: '₨ 172,500',  status: 'Paid'    },
];

export const purchasesData = [
  { date: '29 Apr 2026', supplier: 'Mian Farms (Faisalabad)', weight: '200 Mans', rate: '₨ 10,500', total: '₨ 2,100,000' },
  { date: '26 Apr 2026', supplier: 'Chaudhry Broilers',        weight: '150 Mans', rate: '₨ 10,800', total: '₨ 1,620,000' },
];

export const salesChartData = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

export const priceTrendData = [
  { name: 'W1', price: 10500 },
  { name: 'W2', price: 10800 },
  { name: 'W3', price: 11200 },
  { name: 'W4', price: 12000 },
  { name: 'W5', price: 11800 },
];
