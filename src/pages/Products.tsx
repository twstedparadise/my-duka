import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Filter } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Product, Category } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const categories: Category[] = ['Groceries', 'Beverages', 'Snacks', 'Household', 'Personal Care', 'Stationery', 'Other'];
const units = ['pcs', 'kg', 'litres', 'packet', 'bottle', 'box'];

export default function Products() {
  const { data, addProduct, updateProduct, deleteProduct } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Groceries' as Category,
    unit: 'pcs' as const,
    buyPrice: '',
    sellPrice: '',
    stock: '',
    notes: '',
  });

  const filteredProducts = data.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const product: Product = {
      id: editingProduct?.id || crypto.randomUUID(),
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      buyPrice: parseFloat(formData.buyPrice),
      sellPrice: parseFloat(formData.sellPrice),
      stock: parseInt(formData.stock) || 0,
      reorderPoint: data.shopProfile?.lowStockThreshold || 5,
      notes: formData.notes || undefined,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSoldAt: editingProduct?.lastSoldAt,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, product);
    } else {
      addProduct(product);
    }

    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Groceries',
      unit: 'pcs',
      buyPrice: '',
      sellPrice: '',
      stock: '',
      notes: '',
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      unit: product.unit,
      buyPrice: product.buyPrice.toString(),
      sellPrice: product.sellPrice.toString(),
      stock: product.stock.toString(),
      notes: product.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setProductToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete);
    }
    setShowDeleteDialog(false);
    setProductToDelete(null);
  };

  const currency = data.shopProfile?.currency || 'KES';

  return (
    <div className="p-4 pb-24 md:pb-6 md:ml-64">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Products</h1>
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData({
                name: '',
                category: 'Groceries',
                unit: 'pcs',
                buyPrice: '',
                sellPrice: '',
                stock: '',
                notes: '',
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as Category | 'All')}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-surface rounded-lg shadow-sm p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{product.category}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {product.stock} {product.unit} • Buy: {currency} {product.buyPrice} • Sell: {currency} {product.sellPrice}
                </p>
                {product.notes && (
                  <p className="text-xs text-gray-500 mt-1">{product.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No products found</p>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setFormData({
                    name: '',
                    category: 'Groceries',
                    unit: 'pcs',
                    buyPrice: '',
                    sellPrice: '',
                    stock: '',
                    notes: '',
                  });
                  setShowModal(true);
                }}
                className="mt-2 text-primary font-medium hover:underline"
              >
                Add your first product
              </button>
            </div>
          )}
        </div>

        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
          title={editingProduct ? 'Edit Product' : 'Add Product'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buy Price *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.buyPrice}
                  onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.sellPrice}
                  onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingProduct(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700"
              >
                {editingProduct ? 'Update' : 'Add'} Product
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setProductToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Product"
          message="Are you sure you want to delete this product? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
        />
      </div>
    </div>
  );
}
