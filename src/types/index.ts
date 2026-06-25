export interface ShopProfile {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  location?: string;
  currency: 'KES' | 'USD' | 'EUR';
  language: 'English' | 'Swahili';
  lowStockThreshold: number;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  enableDebtTracking: boolean;
  enableWorkers: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Category = 'Groceries' | 'Beverages' | 'Snacks' | 'Household' | 'Personal Care' | 'Stationery' | 'Other';
export type Unit = 'pcs' | 'kg' | 'litres' | 'packet' | 'bottle' | 'box';
export type Pocket = 'Cash' | 'M-Pesa' | 'Bank' | 'Mobile Money';
export type TransactionType = 'sale' | 'restock' | 'debt' | 'debt_payment' | 'payment_out' | 'payment_in' | 'eod_count' | 'adjustment' | 'mpesa_deposit' | 'mpesa_withdrawal' | 'mpesa_float_topup';
export type UserRole = 'admin' | 'worker';

export interface Product {
  id: string;
  name: string;
  category: Category;
  unit: Unit;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  reorderPoint: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastSoldAt?: string;
}

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  receivedBy: string;
  pocket: Pocket;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  timestamp: string;
  dateKey: string;
  userId: string;
  note?: string;
  sale?: {
    productId: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    costOfGoodsSold: number;
    grossProfit: number;
    pocket: Pocket;
  };
  restock?: {
    productId: string;
    quantity: number;
    costPerUnit: number;
    totalCost: number;
    supplier?: string;
  };
  debt?: {
    customerName: string;
    amount: number;
    items?: string;
    status: 'unpaid' | 'partial' | 'paid';
    amountPaid: number;
    payments: DebtPayment[];
  };
  debtPayment?: {
    debtId: string;
    amount: number;
    receivedBy: string;
    pocket: Pocket;
  };
  eodCount?: {
    pocketCounts: Record<string, number>;
    totalCounted: number;
    expectedTotal: number;
    discrepancy: number;
    discrepancyPercent: number;
    shiftDate: string;
  };
  mpesa?: {
    amount: number;
    accountId: string;
    transactionType: 'deposit' | 'withdrawal' | 'float_topup';
  };
}

export interface User {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  phone?: string;
  email?: string;
  address?: string;
  startDate?: string;
  salary?: number;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export type SideBusinessType = 'mpesa' | 'boda_boda' | 'salon' | 'cyber_cafe' | 'other';

export interface SideBusiness {
  id: string;
  name: string;
  type: SideBusinessType;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MpesaAccount {
  id: string;
  sideBusinessId: string;
  accountName: string;
  phoneNumber: string;
  currentFloat: number;
  cashOnHand: number;
  totalDeposits: number;
  totalWithdrawals: number;
  createdAt: string;
  updatedAt: string;
}

export interface AggregatedMetrics {
  today: {
    revenue: number;
    grossProfit: number;
    transactions: number;
    debtCollected: number;
    eodDiscrepancy: number;
  };
  fourteenDay: {
    revenue: number;
    grossProfit: number;
    itemsSold: Record<string, { quantity: number; revenue: number; profit: number }>;
    topProducts: string[];
    slowProducts: string[];
  };
  thirtyDay: {
    revenue: number;
    grossProfit: number;
    debtRecoveryRate: number;
    eodAccuracy: number;
  };
  itemScores: Record<string, {
    velocity: number;
    margin: number;
    stockRisk: number;
    revenueContribution: number;
    ips: number;
    classification: 'RESTOCK' | 'WATCH' | 'SLOW' | 'DEAD_STOCK' | 'INSUFFICIENT_DATA';
    daysOfStock: number;
    projectedStockoutDate: string;
  }>;
}

export interface AppData {
  version: string;
  shopProfile: ShopProfile | null;
  products: Product[];
  transactions: Transaction[];
  users: User[];
  sideBusinesses: SideBusiness[];
  mpesaAccounts: MpesaAccount[];
  metrics: AggregatedMetrics;
}
