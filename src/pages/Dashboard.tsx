import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Package, AlertTriangle, Calendar, Smartphone, Wallet, ArrowDown, ArrowUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { AnalyticsService } from '../services/analytics';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data, setCurrentPage } = useStore();
  const [todayMetrics, setTodayMetrics] = useState({ revenue: 0, grossProfit: 0, transactions: 0 });
  const [stockValue, setStockValue] = useState(0);
  const [outstandingDebt, setOutstandingDebt] = useState(0);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [mpesaMetrics, setMpesaMetrics] = useState({
    totalFloat: 0,
    totalCash: 0,
    todayDeposits: 0,
    todayWithdrawals: 0,
  });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const metrics = AnalyticsService.calculateTodayMetrics(data.transactions, data.products, today);
    setTodayMetrics(metrics);

    const stockVal = AnalyticsService.calculateStockValue(data.products);
    setStockValue(stockVal);

    const debt = AnalyticsService.getOutstandingDebt(data.transactions);
    setOutstandingDebt(debt);

    const top = AnalyticsService.getTopProductsToday(data.transactions, data.products, today, 3);
    setTopProducts(top);

    const lowStock = AnalyticsService.getLowStockProducts(
      data.products,
      data.shopProfile?.lowStockThreshold || 5
    );
    setLowStockItems(lowStock);

    // Calculate M-Pesa metrics
    const totalFloat = data.mpesaAccounts.reduce((sum, acc) => sum + acc.currentFloat, 0);
    const totalCash = data.mpesaAccounts.reduce((sum, acc) => sum + acc.cashOnHand, 0);
    
    const todayMpesaTransactions = data.transactions.filter(t => 
      t.dateKey === today && 
      ['mpesa_deposit', 'mpesa_withdrawal', 'mpesa_float_topup'].includes(t.type)
    );
    
    const todayDeposits = todayMpesaTransactions
      .filter(t => t.type === 'mpesa_deposit')
      .reduce((sum, t) => sum + (t.mpesa?.amount || 0), 0);
    
    const todayWithdrawals = todayMpesaTransactions
      .filter(t => t.type === 'mpesa_withdrawal')
      .reduce((sum, t) => sum + (t.mpesa?.amount || 0), 0);

    setMpesaMetrics({
      totalFloat,
      totalCash,
      todayDeposits,
      todayWithdrawals,
    });
  }, [data, today]);

  const currency = data.shopProfile?.currency || 'KES';
  const hasMpesa = data.mpesaAccounts.length > 0;

  const quickActions = [
    { id: 'sale', label: 'New Sale', icon: DollarSign, color: 'bg-primary' },
    { id: 'inventory', label: 'Restock', icon: Package, color: 'bg-secondary' },
    { id: 'debt', label: 'Record Debt', icon: TrendingUp, color: 'bg-accent' },
    { id: 'eod', label: 'End of Day', icon: Calendar, color: 'bg-blue-500' },
  ];

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 md:ml-64">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{data.shopProfile?.name}</h1>
          <p className="text-gray-600">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <MetricCard
            label="Today's Revenue"
            value={`${currency} ${todayMetrics.revenue.toLocaleString()}`}
            icon={DollarSign}
            color="text-green-600"
          />
          <MetricCard
            label="Gross Profit"
            value={`${currency} ${todayMetrics.grossProfit.toLocaleString()}`}
            icon={TrendingUp}
            color="text-blue-600"
          />
          <MetricCard
            label="Transactions"
            value={todayMetrics.transactions.toString()}
            icon={Package}
            color="text-purple-600"
          />
          <MetricCard
            label="Stock Value"
            value={`${currency} ${stockValue.toLocaleString()}`}
            icon={Package}
            color="text-orange-600"
          />
          {data.shopProfile?.enableDebtTracking && (
            <MetricCard
              label="Outstanding Debt"
              value={`${currency} ${outstandingDebt.toLocaleString()}`}
              icon={AlertTriangle}
              color="text-red-600"
            />
          )}
        </div>

        {/* M-Pesa Metrics Section */}
        {hasMpesa && (
          <div className="bg-surface rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Smartphone className="text-primary" size={20} />
                M-Pesa Overview
              </h2>
              <button
                onClick={() => setCurrentPage('mpesa')}
                className="text-primary text-sm font-medium hover:underline"
              >
                View Details
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet size={16} className="text-blue-600" />
                  <span className="text-sm text-gray-600">Total Float</span>
                </div>
                <p className="text-lg font-bold text-blue-600">{currency} {mpesaMetrics.totalFloat.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet size={16} className="text-green-600" />
                  <span className="text-sm text-gray-600">Cash on Hand</span>
                </div>
                <p className="text-lg font-bold text-green-600">{currency} {mpesaMetrics.totalCash.toLocaleString()}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDown size={16} className="text-purple-600" />
                  <span className="text-sm text-gray-600">Today's Deposits</span>
                </div>
                <p className="text-lg font-bold text-purple-600">{currency} {mpesaMetrics.todayDeposits.toLocaleString()}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUp size={16} className="text-orange-600" />
                  <span className="text-sm text-gray-600">Today's Withdrawals</span>
                </div>
                <p className="text-lg font-bold text-orange-600">{currency} {mpesaMetrics.todayWithdrawals.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-surface rounded-lg shadow-sm p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => setCurrentPage(action.id)}
                  className={`${action.color} text-white p-4 rounded-lg flex flex-col items-center gap-2 hover:opacity-90 transition-opacity`}
                >
                  <Icon size={24} />
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-surface rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4">Best Performers Today</h2>
            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </span>
                      <span className="font-medium">{product.name}</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      {currency} {product.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No sales today yet</p>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-surface rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="text-accent" size={20} />
              Low Stock Alert
            </h2>
            {lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <span className="font-medium">{product.name}</span>
                      <p className="text-sm text-gray-600">{product.stock} units left</p>
                    </div>
                    <button
                      onClick={() => setCurrentPage('inventory')}
                      className="text-primary text-sm font-medium hover:underline"
                    >
                      Restock
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">All items well stocked</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-surface rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className={color} size={20} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
