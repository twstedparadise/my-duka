import { useState } from 'react';
import { Plus, Trash2, Edit, UserCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { User } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Workers() {
  const { data, addUser, updateUser, deleteUser } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    pin: '',
    phone: '',
    email: '',
    address: '',
    startDate: '',
    salary: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.pin.length !== 4 || !/^\d+$/.test(formData.pin)) {
      alert('PIN must be exactly 4 digits');
      return;
    }

    const worker: User = {
      id: editingWorker?.id || crypto.randomUUID(),
      name: formData.name,
      pin: formData.pin,
      role: 'worker',
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      address: formData.address || undefined,
      startDate: formData.startDate || undefined,
      salary: formData.salary || undefined,
      isActive: true,
      createdAt: editingWorker?.createdAt || new Date().toISOString(),
      lastLogin: editingWorker?.lastLogin,
    };

    if (editingWorker) {
      updateUser(editingWorker.id, worker);
    } else {
      addUser(worker);
    }

    setShowModal(false);
    setEditingWorker(null);
    setFormData({ name: '', pin: '', phone: '', email: '', address: '', startDate: '', salary: 0 });
  };

  const handleEdit = (worker: User) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      pin: worker.pin,
      phone: worker.phone || '',
      email: worker.email || '',
      address: worker.address || '',
      startDate: worker.startDate || '',
      salary: worker.salary || 0,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setWorkerToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (workerToDelete) {
      deleteUser(workerToDelete);
    }
    setShowDeleteDialog(false);
    setWorkerToDelete(null);
  };

  if (!data.shopProfile?.enableWorkers) {
    return (
      <div className="p-4 pb-24 md:pb-6 md:ml-64">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Workers</h1>
          <div className="bg-surface rounded-lg shadow-sm p-6 text-center">
            <UserCheck size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 mb-4">Workers feature is not enabled</p>
            <p className="text-sm text-gray-500">Enable this feature in Settings to add workers who can log sales and view the dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 md:pb-6 md:ml-64">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Workers</h1>
          <button
            onClick={() => {
              setEditingWorker(null);
              setFormData({ name: '', pin: '', phone: '', email: '', address: '', startDate: '', salary: 0 });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus size={20} />
            Add Worker
          </button>
        </div>

        <div className="space-y-4">
          {data.users
            .filter(u => u.role === 'worker')
            .map((worker) => (
              <div key={worker.id} className="bg-surface rounded-lg shadow-sm p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{worker.name}</h3>
                  <p className="text-sm text-gray-600">Worker • PIN: ****</p>
                  <p className="text-xs text-gray-500">
                    Added: {new Date(worker.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(worker)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(worker.id)}
                    className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}

          {data.users.filter(u => u.role === 'worker').length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <UserCheck size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No workers added yet</p>
              <button
                onClick={() => {
                  setEditingWorker(null);
                  setFormData({ name: '', pin: '', phone: '', email: '', address: '', startDate: '', salary: 0 });
                  setShowModal(true);
                }}
                className="mt-2 text-primary font-medium hover:underline"
              >
                Add your first worker
              </button>
            </div>
          )}
        </div>

        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingWorker(null);
          }}
          title={editingWorker ? 'Edit Worker' : 'Add Worker'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">4-Digit PIN *</label>
              <input
                type="password"
                required
                maxLength={4}
                pattern="\d{4}"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0000"
              />
              <p className="text-xs text-gray-500 mt-1">Worker will use this PIN to log in</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="07XXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary ({data.shopProfile?.currency || 'KES'})</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingWorker(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700"
              >
                {editingWorker ? 'Update' : 'Add'} Worker
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setWorkerToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Worker"
          message="Are you sure you want to delete this worker? They will no longer be able to access the system."
          confirmText="Delete"
          cancelText="Cancel"
        />
      </div>
    </div>
  );
}
