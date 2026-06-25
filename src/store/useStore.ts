import { create } from 'zustand';
import { ShopProfile, Product, Transaction, User, AppData, SideBusiness, MpesaAccount } from '../types';
import { storageService } from '../services/storage';

interface StoreState {
  data: AppData;
  currentPage: string;
  isLoading: boolean;
  currentUser: User | null;
  
  // Actions
  loadData: () => void;
  saveData: () => void;
  setShopProfile: (profile: ShopProfile) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addTransaction: (transaction: Transaction) => void;
  setCurrentPage: (page: string) => void;
  setCurrentUser: (user: User | null) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addSideBusiness: (business: SideBusiness) => void;
  updateSideBusiness: (id: string, updates: Partial<SideBusiness>) => void;
  deleteSideBusiness: (id: string) => void;
  addMpesaAccount: (account: MpesaAccount) => void;
  updateMpesaAccount: (id: string, updates: Partial<MpesaAccount>) => void;
  deleteMpesaAccount: (id: string) => void;
  exportData: () => string;
  importData: (jsonData: string) => void;
  clearAllData: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  data: storageService.getLocalStorageData(),
  currentPage: 'dashboard',
  isLoading: false,
  currentUser: null,

  loadData: () => {
    const data = storageService.getLocalStorageData();
    set({ data });
  },

  saveData: () => {
    try {
      storageService.saveLocalStorageData(get().data);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  },

  setShopProfile: (profile) => {
    set((state) => ({
      data: { ...state.data, shopProfile: profile }
    }));
    get().saveData();
  },

  addProduct: (product) => {
    set((state) => ({
      data: { ...state.data, products: [...state.data.products, product] }
    }));
    get().saveData();
  },

  updateProduct: (id, updates) => {
    set((state) => ({
      data: {
        ...state.data,
        products: state.data.products.map(p => 
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        )
      }
    }));
    get().saveData();
  },

  deleteProduct: (id) => {
    set((state) => ({
      data: {
        ...state.data,
        products: state.data.products.filter(p => p.id !== id)
      }
    }));
    get().saveData();
  },

  addTransaction: (transaction) => {
    set((state) => {
      const updatedProducts = [...state.data.products];
      
      // Update product stock if sale
      if (transaction.type === 'sale' && transaction.sale) {
        const productIndex = updatedProducts.findIndex(p => p.id === transaction.sale!.productId);
        if (productIndex !== -1) {
          const oldStock = updatedProducts[productIndex].stock;
          const newStock = oldStock - transaction.sale!.quantity;
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            stock: newStock,
            lastSoldAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
      }
      
      // Update product stock if restock
      if (transaction.type === 'restock' && transaction.restock) {
        const productIndex = updatedProducts.findIndex(p => p.id === transaction.restock!.productId);
        if (productIndex !== -1) {
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            stock: updatedProducts[productIndex].stock + transaction.restock!.quantity,
            updatedAt: new Date().toISOString()
          };
        }
      }
      
      return {
        data: {
          ...state.data,
          products: updatedProducts,
          transactions: [...state.data.transactions, transaction]
        }
      };
    });
    
    get().saveData();
  },

  setCurrentPage: (page) => {
    set({ currentPage: page });
  },

  setCurrentUser: (user) => {
    set({ currentUser: user });
  },

  addUser: (user) => {
    set((state) => ({
      data: { ...state.data, users: [...state.data.users, user] }
    }));
    get().saveData();
  },

  updateUser: (id, updates) => {
    set((state) => ({
      data: {
        ...state.data,
        users: state.data.users.map(u => 
          u.id === id ? { ...u, ...updates } : u
        )
      }
    }));
    get().saveData();
  },

  deleteUser: (id) => {
    set((state) => ({
      data: {
        ...state.data,
        users: state.data.users.filter(u => u.id !== id)
      }
    }));
    get().saveData();
  },

  addSideBusiness: (business) => {
    set((state) => ({
      data: { ...state.data, sideBusinesses: [...state.data.sideBusinesses, business] }
    }));
    get().saveData();
  },

  updateSideBusiness: (id, updates) => {
    set((state) => ({
      data: {
        ...state.data,
        sideBusinesses: state.data.sideBusinesses.map(b => 
          b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
        )
      }
    }));
    get().saveData();
  },

  deleteSideBusiness: (id) => {
    set((state) => ({
      data: {
        ...state.data,
        sideBusinesses: state.data.sideBusinesses.filter(b => b.id !== id),
        mpesaAccounts: state.data.mpesaAccounts.filter(m => m.sideBusinessId !== id)
      }
    }));
    get().saveData();
  },

  addMpesaAccount: (account) => {
    set((state) => ({
      data: { ...state.data, mpesaAccounts: [...state.data.mpesaAccounts, account] }
    }));
    get().saveData();
  },

  updateMpesaAccount: (id, updates) => {
    set((state) => ({
      data: {
        ...state.data,
        mpesaAccounts: state.data.mpesaAccounts.map(m => 
          m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
        )
      }
    }));
    get().saveData();
  },

  deleteMpesaAccount: (id) => {
    set((state) => ({
      data: {
        ...state.data,
        mpesaAccounts: state.data.mpesaAccounts.filter(m => m.id !== id)
      }
    }));
    get().saveData();
  },

  exportData: () => {
    return storageService.exportAllData();
  },

  importData: (jsonData) => {
    storageService.importAllData(jsonData);
    get().loadData();
  },

  clearAllData: () => {
    storageService.clearAllData();
    set({
      data: storageService.getLocalStorageData(),
      currentUser: null,
      currentPage: 'dashboard'
    });
  }
}));
