import { useState } from 'react';
import { Search, Plus, AlertTriangle, TrendingDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Transaction } from '../types';
import Modal from '../components/Modal';

export default function Inventory() {
  const { data, addTransaction, updateProduct } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [restockCost, setRestockCost] = useState('');
  const [supplier, setSupplier] = useState('');

  const filteredProducts = data.products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockThreshold = data.shopProfile?.lowStockThreshold || 5;
  const lowStockProducts = filteredProducts.filter(p => p.stock <= lowStockThreshold);
  const slowMovers = filteredProducts.filter(p => {
    if (!p.lastSoldAt) return true;
    const lastSold = new Date(p.lastSoldAt);
    const daysSinceSold = Math.floor((new Date().getTime() - lastSold.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceSold >= 7;
  });

  const handleRestock = () => {
    if (!selectedProduct || !restockQuantity || !restockCost) return;

    const quantity = parseInt(restockQuantity);
    const costPerUnit = parseFloat(restockCost);
    const totalCost = quantity * costPerUnit;

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type: 'restock',
      timestamp: new Date().toISOString(),
      dateKey: new Date().toISOString().split('T')[0],
      userId: data.currentUser?.id || 'admin',
      note: supplier || undefined,
      restock: {
        productId: selectedProduct.id,
        quantity,
        costPerUnit,
        totalCost,
        supplier: supplier || undefined,
      },
    };

    addTransaction(transaction);
    updateProduct(selectedProduct.id, {
      stock: (prev: number) => prev + quantity,
    });

    setShowRestockModal(false);
    setSelectedProduct(null);
    setRestockQuantity('');
    setRestockCost('');
    setSupplier('');
  };

  const currency = data.shopProfile?.currency || 'KES';

  return (
    <div className="p-4 pb-24 md:pb-6 md:ml-64">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Inventory</h1>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-red-600" size={20} />
              <h2 className="font-semibold text-red-900">Low Stock Alert</h2>
            </div>
            <div className="grid gap-2">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between bg-white p-3 rounded-lg"
                >
                  <div>
                    <span className="font-medium">{product.name}</span>
                    <p className="text-sm text-red-600">{product.stock} units left</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowRestockModal(true);
                    }}
                    className="text-primary font-medium text-sm hover:underline"
                  >
                    Restock
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slow Movers */}
        {slowMovers.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="text-yellow-600" size={20} />
              <h2 className="font-semibold text-yellow-900">Slow Moving Items (7+ days)</h2>
            </div>
            <div className="grid gap-2">
              {slowMovers.slice(0, 5).map((product) => (
                <div key={product.id} className="bg-white p-3 rounded-lg">
                  <span className="font-medium">{product.name}</span>
                  <p className="text-sm text-gray-600">
                    {product.stock} in stock • Last sold: {product.lastSoldAt ? new Date(product.lastSoldAt).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Products */}
        <div className="bg-surface rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold">All Products</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredProducts.map((product) => {
              const isLowStock = product.stock <= lowStockThreshold;
              return (
                <div
                  key={product.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      {isLowStock && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                          Low Stock
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {product.category} • {product.unit}
                    </p>
                    <p className="text-sm text-gray-600">
                      Buy: {currency} {product.buyPrice} • Sell: {currency} {product.sellPrice}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                      {product.stock}
                    </p>
                    <p className="text-sm text-gray-600">units</p>
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowRestockModal(true);
                      }}
                      className="mt-2 text-primary font-medium text-sm hover:underline"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Modal
          isOpen={showRestockModal}
          onClose={() => {
            setShowRestockModal(false);
            setSelectedProduct(null);
            setRestockQuantity('');
            setRestockCost('');
            setSupplier('');
          }}
          title="Restock Product"
        >
          {selectedProduct && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold">{selectedProduct.name}</p>
                <p className="text-sm text-gray-600">Current stock: {selectedProduct.stock} {selectedProduct.unit}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity to Add *
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Per Unit ({currency}) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={restockCost}
                  onChange={(e) => setRestockCost(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {restockQuantity && restockCost && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Cost:</p>
                  <p className="text-xl font-bold text-primary">
                    {currency} {(parseInt(restockQuantity) * parseFloat(restockCost)).toLocaleString()}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier (optional)
                </label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowRestockModal(false);
                    setSelectedProduct(null);
                    setRestockQuantity('');
                    setRestockCost('');
                    setSupplier('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestock}
                  className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700"
                >
                  Confirm Restock
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
