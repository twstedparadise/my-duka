import { useEffect } from 'react';
import { useStore } from './store/useStore';
import Navigation from './components/Navigation';
import ShopSetup from './pages/ShopSetup';
import Dashboard from './pages/Dashboard';
import NewSale from './pages/NewSale';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import History from './pages/History';
import Reports from './pages/Reports';
import Debt from './pages/Debt';
import Workers from './pages/Workers';
import Settings from './pages/Settings';
import EndOfDay from './pages/EndOfDay';
import SideBusinesses from './pages/SideBusinesses';
import MpesaTracking from './pages/MpesaTracking';

function App() {
  const { currentPage, data, loadData, setCurrentPage } = useStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!data.shopProfile) {
    return <ShopSetup />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'sale':
        return <NewSale />;
      case 'products':
        return <Products />;
      case 'inventory':
        return <Inventory />;
      case 'sideBusinesses':
        return <SideBusinesses />;
      case 'mpesa':
        return <MpesaTracking />;
      case 'history':
        return <History />;
      case 'reports':
        return <Reports />;
      case 'debt':
        return <Debt />;
      case 'workers':
        return <Workers />;
      case 'settings':
        return <Settings />;
      case 'eod':
        return <EndOfDay />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>{renderPage()}</main>
    </div>
  );
}

export default App;
