import { useState } from 'react';
import { Search, Plus, Minus, X, ArrowLeft } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Transaction, Pocket } from '../types';

export default function NewSale() {
  const { data, addTransaction, setCurrentPage } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [pocket, setPocket] = useState<Pocket>('Cash');
  const [note, setNote] = useState('');

  const filteredProducts = data.products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setQuantity(1);
    setPocket('Cash');
    setNote('');
  };

  const handleSale = () => {
    if (!selectedProduct || quantity <= 0) return;

    const totalAmount = selectedProduct.sellPrice * quantity;
    const costOfGoodsSold = selectedProduct.buyPrice * quantity;
    const grossProfit = totalAmount - costOfGoodsSold;

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type: 'sale',
      timestamp: new Date().toISOString(),
      dateKey: new Date().toISOString().split('T')[0],
      userId: data.currentUser?.id || 'admin',
      note: note || undefined,
      sale: {
        productId: selectedProduct.id,
        quantity,
        unitPrice: selectedProduct.sellPrice,
        totalAmount,
        costOfGoodsSold,
        grossProfit,
        pocket,
      },
    };

    addTransaction(transaction);
    setSelectedProduct(null);
    setSearchQuery('');
    setQuantity(1);
    setNote('');
  };

  const currency = data.shopProfile?.currency || 'KES';

  return (
    <div className="p-4 pb-24 md:pb-6 md:ml-64">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="flex items-center gap-2 text-gray-600 mb-4 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold mb-6">New Sale</h1>

        {!selectedProduct ? (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="grid gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  disabled={product.stock === 0}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    product.stock === 0
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 bg-surface hover:border-primary hover:bg-green-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {currency} {product.sellPrice}
                      </p>
                      <p className={`text-sm ${product.stock <= (data.shopProfile?.lowStockThreshold || 5) ? 'text-red-600' : 'text-gray-600'}`}>
                        {product.stock} in stock
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No products found</p>
                <button
                  onClick={() => setCurrentPage('products')}
                  className="mt-2 text-primary font-medium hover:underline"
                >
                  Add your first product
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-surface rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{selectedProduct.name}</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Price per unit</span>
                <span className="font-semibold">
                  {currency} {selectedProduct.sellPrice}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                  >
                    <Minus size={20} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(selectedProduct.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-20 text-center text-xl font-bold border border-gray-300 rounded-lg py-2"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                    className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedProduct.stock} available
                </p>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-600 font-medium">Total</span>
                <span className="text-2xl font-bold text-primary">
                  {currency} {(selectedProduct.sellPrice * quantity).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Pocket
                </label>
                <select
                  value={pocket}
                  onChange={(e) => setPocket(e.target.value as Pocket)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="Cash">Cash</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank">Bank</option>
                  <option value="Mobile Money">Mobile Money</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Customer name or order details"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSale}
                  className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700"
                >
                  Confirm Sale
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
