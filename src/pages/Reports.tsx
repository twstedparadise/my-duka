import { useState } from 'react';
import { TrendingUp, DollarSign, Package, BarChart3 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { AnalyticsService } from '../services/analytics';
import { format, subDays, subWeeks } from 'date-fns';

export default function Reports() {
  const { data } = useStore();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  const today = new Date().toISOString().split('T')[0];
  const yesterday = subDays(new Date(), 1).toISOString().split('T')[0];
  const lastWeek = subWeeks(new Date(), 1).toISOString().split('T')[0];

  const todayMetrics = AnalyticsService.calculateTodayMetrics(data.transactions, data.products, today);
  const yesterdayMetrics = AnalyticsService.calculateTodayMetrics(data.transactions, data.products, yesterday);
  const weekMetrics = AnalyticsService.calculateTodayMetrics(data.transactions, data.products, lastWeek);

  const topProducts = AnalyticsService.getTopProductsToday(data.transactions, data.products, today, 10);
  const stockValue = AnalyticsService.calculateStockValue(data.products);

  const currency = data.shopProfile?.currency || 'KES';

  const getMetrics = () => {
    switch (timeRange) {
      case 'today':
        return todayMetrics;
      case 'week':
        return weekMetrics;
      case 'month':
        return todayMetrics;
      default:
        return todayMetrics;
    }
  };

  const currentMetrics = getMetrics();

  const categoryPerformance = data.products.reduce((acc: any, product) => {
    if (!acc[product.category]) {
      acc[product.category] = { count: 0, stockValue: 0 };
    }
    acc[product.category].count += 1;
    acc[product.category].stockValue += product.buyPrice * product.stock;
    return acc;
  }, {});

  return (
    <div className="p-4 pb-24 md:pb-6 md:ml-64">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Reports & Analytics</h1>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTimeRange('today')}
            className={`px-4 py-2 rounded-lg ${timeRange === 'today' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-lg ${timeRange === 'week' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-lg ${timeRange === 'month' ? 'bg-primary text-white' : 'bg-gray-200'}`}
          >
            This Month
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Revenue Comparison */}
          <div className="bg-surface rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="text-primary" size={20} />
              Revenue Comparison
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold">{currency} {todayMetrics.revenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Yesterday</p>
                <p className="text-2xl font-bold">{currency} {yesterdayMetrics.revenue.toLocaleString()}</p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm">
                  {todayMetrics.revenue >= yesterdayMetrics.revenue ? (
                    <span className="text-green-600">↑ {((todayMetrics.revenue - yesterdayMetrics.revenue) / (yesterdayMetrics.revenue || 1) * 100).toFixed(1)}%</span>
                  ) : (
                    <span className="text-red-600">↓ {((yesterdayMetrics.revenue - todayMetrics.revenue) / (yesterdayMetrics.revenue || 1) * 100).toFixed(1)}%</span>
                  )} vs yesterday
                </p>
              </div>
            </div>
          </div>

          {/* Profit Analysis */}
          <div className="bg-surface rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="text-secondary" size={20} />
              Profit Analysis
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Gross Profit</p>
                <p className="text-2xl font-bold text-green-600">{currency} {currentMetrics.grossProfit.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold">
                  {currentMetrics.revenue > 0 ? ((currentMetrics.grossProfit / currentMetrics.revenue) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold">{currentMetrics.transactions}</p>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-surface rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="text-accent" size={20} />
              Top Products by Revenue
            </h2>
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((product: any, index: number) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <span className="font-semibold">{currency} {product.revenue.toLocaleString()}</span>
                </div>
              ))}
              {topProducts.length === 0 && (
                <p className="text-gray-500 text-center py-4">No sales data</p>
              )}
            </div>
          </div>

          {/* Category Performance */}
          <div className="bg-surface rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="text-blue-500" size={20} />
              Category Performance
            </h2>
            <div className="space-y-3">
              {Object.entries(categoryPerformance).map(([category, data]: [string, any]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">{category}</span>
                    <p className="text-sm text-gray-600">{data.count} products</p>
                  </div>
                  <span className="font-semibold">{currency} {data.stockValue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Value */}
          <div className="bg-surface rounded-lg shadow-sm p-6 md:col-span-2">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="text-purple-500" size={20} />
              Total Stock Value
            </h2>
            <p className="text-4xl font-bold text-primary">{currency} {stockValue.toLocaleString()}</p>
            <p className="text-gray-600 mt-2">Based on buy price across all {data.products.length} products</p>
          </div>
        </div>
      </div>
    </div>
  );
}
