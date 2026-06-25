import { useState } from 'react';
import { Download, Upload, Trash2, Save, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ShopProfile } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Settings() {
  const { data, setShopProfile, exportData, importData, clearAllData, setCurrentPage } = useStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importDataText, setImportDataText] = useState('');
  const [formData, setFormData] = useState({
    name: data.shopProfile?.name || '',
    ownerName: data.shopProfile?.ownerName || '',
    phone: data.shopProfile?.phone || '',
    location: data.shopProfile?.location || '',
    currency: data.shopProfile?.currency || 'KES' as const,
    language: data.shopProfile?.language || 'English' as const,
    lowStockThreshold: data.shopProfile?.lowStockThreshold || 5,
    dateFormat: data.shopProfile?.dateFormat || 'DD/MM/YYYY' as const,
    enableDebtTracking: data.shopProfile?.enableDebtTracking ?? true,
    enableWorkers: data.shopProfile?.enableWorkers ?? false,
  });

  const handleSave = () => {
    const updatedProfile: ShopProfile = {
      ...data.shopProfile!,
      ...formData,
      updatedAt: new Date().toISOString(),
    };
    setShopProfile(updatedProfile);
  };

  const handleExport = () => {
    const dataStr = exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duka_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = () => {
    try {
      importData(importDataText);
      setShowImportDialog(false);
      setImportDataText('');
      alert('Data imported successfully!');
    } catch (error) {
      alert('Invalid data format. Please check your backup file.');
    }
  };

  const handleClearData = () => {
    clearAllData();
    setShowDeleteDialog(false);
    setCurrentPage('dashboard');
  };

  return (
    <div className="p-4 pb-24 md:pb-6 md:ml-64">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <div className="space-y-6">
          {/* Shop Profile */}
          <div className="bg-surface rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Shop Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-surface rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Preferences</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'KES' | 'USD' | 'EUR' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="KES">KES</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value as 'English' | 'Swahili' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="English">English</option>
                    <option value="Swahili">Swahili</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert Threshold</label>
                <input
                  type="number"
                  min="1"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 5 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                <select
                  value={formData.dateFormat}
                  onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-surface rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Features</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableDebtTracking}
                  onChange={(e) => setFormData({ ...formData, enableDebtTracking: e.target.checked })}
                  className="w-5 h-5 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Enable Debt Tracking</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableWorkers}
                  onChange={(e) => setFormData({ ...formData, enableWorkers: e.target.checked })}
                  className="w-5 h-5 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Enable Workers Feature</span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Save Settings
          </button>

          {/* Data Management */}
          <div className="bg-surface rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Data Management</h2>
            <div className="space-y-3">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download size={20} />
                Export All Data (JSON)
              </button>
              <button
                onClick={() => setShowImportDialog(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Upload size={20} />
                Import Data from Backup
              </button>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={20} />
                Delete All Data
              </button>
            </div>
          </div>

          {/* App Info */}
          <div className="text-center text-sm text-gray-500">
            <p>DUKA MANAGER v1.0.0</p>
            <p>Business Management for Shopkeepers</p>
          </div>
        </div>

        <Modal
          isOpen={showImportDialog}
          onClose={() => {
            setShowImportDialog(false);
            setImportDataText('');
          }}
          title="Import Data"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paste your backup JSON data
              </label>
              <textarea
                value={importDataText}
                onChange={(e) => setImportDataText(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                placeholder='{"version":"1.0.0","shopProfile":{...},...}'
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setImportDataText('');
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700"
              >
                Import
              </button>
            </div>
          </div>
        </Modal>

        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleClearData}
          title="Delete All Data"
          message="Are you sure you want to delete all data? This action cannot be undone and will permanently remove all your products, transactions, and settings."
          confirmText="Delete All Data"
          cancelText="Cancel"
        />
      </div>
    </div>
  );
}
