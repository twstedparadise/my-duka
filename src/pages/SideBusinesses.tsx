import { useState } from 'react';
import { Plus, Trash2, Edit, Store, Smartphone, Bike, Scissors, Monitor } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SideBusiness, SideBusinessType } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const businessIcons: Record<SideBusinessType, any> = {
  mpesa: Smartphone,
  boda_boda: Bike,
  salon: Scissors,
  cyber_cafe: Monitor,
  other: Store,
};

const businessNames: Record<SideBusinessType, string> = {
  mpesa: 'M-Pesa Agent',
  boda_boda: 'Boda Boda',
  salon: 'Salon',
  cyber_cafe: 'Cyber Cafe',
  other: 'Other',
};

export default function SideBusinesses() {
  const { data, addSideBusiness, updateSideBusiness, deleteSideBusiness } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<SideBusiness | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'mpesa' as SideBusinessType,
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const business: SideBusiness = {
      id: editingBusiness?.id || crypto.randomUUID(),
      name: formData.name,
      type: formData.type,
      description: formData.description || undefined,
      isActive: true,
      createdAt: editingBusiness?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingBusiness) {
      updateSideBusiness(editingBusiness.id, business);
    } else {
      addSideBusiness(business);
    }

    setShowModal(false);
    setEditingBusiness(null);
    setFormData({ name: '', type: 'mpesa', description: '' });
  };

  const handleEdit = (business: SideBusiness) => {
    setEditingBusiness(business);
    setFormData({
      name: business.name,
      type: business.type,
      description: business.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setBusinessToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (businessToDelete) {
      deleteSideBusiness(businessToDelete);
    }
    setShowDeleteDialog(false);
    setBusinessToDelete(null);
  };

  const currency = data.shopProfile?.currency || 'KES';

  return (
    <div className="p-4 pb-24 md:pb-6 md:ml-64">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Side Businesses</h1>
          <button
            onClick={() => {
              setEditingBusiness(null);
              setFormData({ name: '', type: 'mpesa', description: '' });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus size={20} />
            Add Business
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {data.sideBusinesses.map((business) => {
            const Icon = businessIcons[business.type];
            const mpesaAccounts = data.mpesaAccounts.filter(m => m.sideBusinessId === business.id);
            const totalFloat = mpesaAccounts.reduce((sum, m) => sum + m.currentFloat, 0);
            const totalCash = mpesaAccounts.reduce((sum, m) => sum + m.cashOnHand, 0);

            return (
              <div key={business.id} className="bg-surface rounded-lg shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="text-primary" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{business.name}</h3>
                      <p className="text-sm text-gray-600">{businessNames[business.type]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(business)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(business.id)}
                      className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {business.description && (
                  <p className="text-sm text-gray-600 mb-3">{business.description}</p>
                )}

                {business.type === 'mpesa' && mpesaAccounts.length > 0 && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Float:</span>
                      <span className="font-semibold">{currency} {totalFloat.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cash on Hand:</span>
                      <span className="font-semibold">{currency} {totalCash.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Accounts:</span>
                      <span className="font-semibold">{mpesaAccounts.length}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${business.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {business.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            );
          })}

          {data.sideBusinesses.length === 0 && (
            <div className="col-span-2 text-center py-12 text-gray-500">
              <Store size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No side businesses added yet</p>
              <button
                onClick={() => {
                  setEditingBusiness(null);
                  setFormData({ name: '', type: 'mpesa', description: '' });
                  setShowModal(true);
                }}
                className="mt-2 text-primary font-medium hover:underline"
              >
                Add your first side business
              </button>
            </div>
          )}
        </div>

        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingBusiness(null);
          }}
          title={editingBusiness ? 'Edit Business' : 'Add Business'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as SideBusinessType })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="mpesa">M-Pesa Agent</option>
                <option value="boda_boda">Boda Boda</option>
                <option value="salon">Salon</option>
                <option value="cyber_cafe">Cyber Cafe</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Optional description of the business"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingBusiness(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700"
              >
                {editingBusiness ? 'Update' : 'Add'} Business
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setBusinessToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Business"
          message="Are you sure you want to delete this business? All associated accounts and data will also be deleted."
          confirmText="Delete"
          cancelText="Cancel"
        />
      </div>
    </div>
  );
}
