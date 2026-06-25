import { Home, ShoppingCart, Package, History, Settings, FileText, Users, Store, Smartphone, AlertTriangle, CreditCard } from 'lucide-react';
import { useStore } from '../store/useStore';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'sale', label: 'New Sale', icon: ShoppingCart },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'inventory', label: 'Inventory', icon: AlertTriangle },
  { id: 'sideBusinesses', label: 'Side Business', icon: Store },
  { id: 'mpesa', label: 'M-Pesa', icon: Smartphone },
  { id: 'history', label: 'History', icon: History },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'debt', label: 'Debt', icon: CreditCard },
  { id: 'workers', label: 'Workers', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Navigation() {
  const { currentPage, setCurrentPage, data } = useStore();

  const mainNavItems = navItems.filter(item => 
    ['dashboard', 'sale', 'products', 'inventory', 'sideBusinesses'].includes(item.id)
  );

  const moreNavItems = navItems.filter(item => 
    ['mpesa', 'history', 'reports', 'debt', 'workers', 'settings'].includes(item.id)
  );

  if (!data.shopProfile) {
    return null;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-gray-200 h-screen fixed left-0 top-0">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary">{data.shopProfile.name}</h1>
          <p className="text-sm text-gray-500">{data.shopProfile.ownerName}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-200 z-50">
        <div className="flex justify-around">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex flex-col items-center py-3 px-4 transition-colors ${
                  isActive ? 'text-primary' : 'text-gray-500'
                }`}
              >
                <Icon size={24} />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage('reports')}
            className={`flex flex-col items-center py-3 px-4 transition-colors ${
              currentPage === 'reports' || currentPage === 'debt' || currentPage === 'workers' || currentPage === 'settings'
                ? 'text-primary' 
                : 'text-gray-500'
            }`}
          >
            <FileText size={24} />
            <span className="text-xs mt-1">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
