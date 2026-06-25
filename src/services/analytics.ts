import { Transaction, Product, AggregatedMetrics } from '../types';

export class AnalyticsService {
  static calculateTodayMetrics(transactions: Transaction[], products: Product[], dateKey: string) {
    const todayTransactions = transactions.filter(t => t.dateKey === dateKey);
    
    const revenue = todayTransactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + (t.sale?.totalAmount || 0), 0);

    const grossProfit = todayTransactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + (t.sale?.grossProfit || 0), 0);

    const transactionCount = todayTransactions.filter(t => t.type === 'sale').length;

    const debtCollected = todayTransactions
      .filter(t => t.type === 'debt_payment')
      .reduce((sum, t) => sum + (t.debtPayment?.amount || 0), 0);

    const eodDiscrepancy = todayTransactions
      .filter(t => t.type === 'eod_count')
      .reduce((sum, t) => sum + (t.eodCount?.discrepancy || 0), 0);

    return {
      revenue,
      grossProfit,
      transactions: transactionCount,
      debtCollected,
      eodDiscrepancy
    };
  }

  static calculateStockValue(products: Product[]): number {
    return products.reduce((sum, p) => sum + (p.buyPrice * p.stock), 0);
  }

  static getTopProductsToday(transactions: Transaction[], products: Product[], dateKey: string, limit: number = 3) {
    const salesByProduct: Record<string, { revenue: number; name: string }> = {};

    transactions
      .filter(t => t.type === 'sale' && t.dateKey === dateKey)
      .forEach(t => {
        const productId = t.sale?.productId;
        if (productId) {
          if (!salesByProduct[productId]) {
            const product = products.find(p => p.id === productId);
            salesByProduct[productId] = { revenue: 0, name: product?.name || 'Unknown' };
          }
          salesByProduct[productId].revenue += t.sale?.totalAmount || 0;
        }
      });

    return Object.entries(salesByProduct)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, limit)
      .map(([id, data]) => ({ id, ...data }));
  }

  static getLowStockProducts(products: Product[], threshold: number): Product[] {
    return products.filter(p => p.stock <= threshold).sort((a, b) => a.stock - b.stock);
  }

  static getSlowMovers(products: Product[], daysThreshold: number = 7): Product[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    return products.filter(p => {
      if (!p.lastSoldAt) return true;
      return new Date(p.lastSoldAt) < cutoffDate;
    });
  }

  static calculateItemPerformance(productId: string, transactions: Transaction[], product: Product) {
    const sales = transactions.filter(t => t.type === 'sale' && t.sale?.productId === productId);
    const totalSold = sales.reduce((sum, t) => sum + (t.sale?.quantity || 0), 0);
    const totalRevenue = sales.reduce((sum, t) => sum + (t.sale?.totalAmount || 0), 0);
    const totalProfit = sales.reduce((sum, t) => sum + (t.sale?.grossProfit || 0), 0);

    const daysWithData = new Set(sales.map(t => t.dateKey)).size || 1;
    const velocity = totalSold / daysWithData;
    const margin = product.sellPrice > 0 ? ((product.sellPrice - product.buyPrice) / product.sellPrice) * 100 : 0;
    const stockRisk = product.stock > 0 ? 1 - (product.stock / (velocity * 7 || 1)) : 1;
    const revenueContribution = totalRevenue;

    const ips = (velocity * 0.4) + (margin * 0.3) + ((1 - stockRisk) * 0.3);

    let classification: 'RESTOCK' | 'WATCH' | 'SLOW' | 'DEAD_STOCK' | 'INSUFFICIENT_DATA' = 'INSUFFICIENT_DATA';
    if (sales.length >= 5) {
      if (stockRisk > 0.7) classification = 'RESTOCK';
      else if (velocity < 1) classification = 'SLOW';
      else if (stockRisk > 0.4) classification = 'WATCH';
      else classification = 'SLOW';
    }

    const daysOfStock = velocity > 0 ? Math.floor(product.stock / velocity) : 999;
    const projectedStockoutDate = new Date();
    projectedStockoutDate.setDate(projectedStockoutDate.getDate() + daysOfStock);

    return {
      velocity,
      margin,
      stockRisk,
      revenueContribution,
      ips,
      classification,
      daysOfStock,
      projectedStockoutDate: projectedStockoutDate.toISOString()
    };
  }

  static getOutstandingDebt(transactions: Transaction[]): number {
    const debts = transactions.filter(t => t.type === 'debt');
    const payments = transactions.filter(t => t.type === 'debt_payment');

    const totalDebt = debts.reduce((sum, t) => sum + (t.debt?.amount || 0), 0);
    const totalPaid = payments.reduce((sum, t) => sum + (t.debtPayment?.amount || 0), 0);

    return totalDebt - totalPaid;
  }

  static getDebtRecoveryRate(transactions: Transaction[]): number {
    const debts = transactions.filter(t => t.type === 'debt');
    const payments = transactions.filter(t => t.type === 'debt_payment');

    const totalDebt = debts.reduce((sum, t) => sum + (t.debt?.amount || 0), 0);
    const totalPaid = payments.reduce((sum, t) => sum + (t.debtPayment?.amount || 0), 0);

    return totalDebt > 0 ? (totalPaid / totalDebt) * 100 : 0;
  }
}
