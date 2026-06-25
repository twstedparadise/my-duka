import { AppData, Product, Transaction, ShopProfile, User, AggregatedMetrics } from '../types';

const STORAGE_KEY = 'duka_manager_data';
const DB_NAME = 'DukaManagerDB';
const DB_VERSION = 1;
const TRANSACTION_STORE = 'transactions';

class StorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(TRANSACTION_STORE)) {
          const store = db.createObjectStore(TRANSACTION_STORE, { keyPath: 'id' });
          store.createIndex('dateKey', 'dateKey', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  getLocalStorageData(): AppData {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return this.getEmptyData();
    }
    try {
      const parsed = JSON.parse(data);
      // Ensure new fields exist for backward compatibility
      if (!parsed.sideBusinesses) parsed.sideBusinesses = [];
      if (!parsed.mpesaAccounts) parsed.mpesaAccounts = [];
      return parsed;
    } catch {
      return this.getEmptyData();
    }
  }

  saveLocalStorageData(data: AppData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  private getEmptyData(): AppData {
    return {
      version: '1.0.0',
      shopProfile: null,
      products: [],
      transactions: [],
      users: [],
      sideBusinesses: [],
      mpesaAccounts: [],
      metrics: {
        today: { revenue: 0, grossProfit: 0, transactions: 0, debtCollected: 0, eodDiscrepancy: 0 },
        fourteenDay: { revenue: 0, grossProfit: 0, itemsSold: {}, topProducts: [], slowProducts: [] },
        thirtyDay: { revenue: 0, grossProfit: 0, debtRecoveryRate: 0, eodAccuracy: 0 },
        itemScores: {}
      }
    };
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TRANSACTION_STORE], 'readwrite');
      const store = transaction.objectStore(TRANSACTION_STORE);
      const request = store.put(transaction);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getTransactions(): Promise<Transaction[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TRANSACTION_STORE], 'readonly');
      const store = transaction.objectStore(TRANSACTION_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async getTransactionsByDate(dateKey: string): Promise<Transaction[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TRANSACTION_STORE], 'readonly');
      const store = transaction.objectStore(TRANSACTION_STORE);
      const index = store.index('dateKey');
      const request = index.getAll(dateKey);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async deleteTransaction(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TRANSACTION_STORE], 'readwrite');
      const store = transaction.objectStore(TRANSACTION_STORE);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  exportAllData(): string {
    const data = this.getLocalStorageData();
    return JSON.stringify(data, null, 2);
  }

  importAllData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData) as AppData;
      this.saveLocalStorageData(data);
    } catch (error) {
      throw new Error('Invalid data format');
    }
  }

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEY);
    if (this.db) {
      const transaction = this.db.transaction([TRANSACTION_STORE], 'readwrite');
      transaction.objectStore(TRANSACTION_STORE).clear();
    }
  }
}

export const storageService = new StorageService();
