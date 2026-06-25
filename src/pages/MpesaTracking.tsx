import { useState } from 'react';
import { Plus, Trash2, Edit, ArrowUp, ArrowDown, Wallet, Smartphone } from 'lucide-react';
import { useStore } from '../store/useStore';
import { MpesaAccount, Transaction } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function MpesaTracking() {
  const { data, addMpesaAccount, updateMpesaAccount, deleteMpesaAccount, addTransaction, currentUser, setCurrentPage } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<MpesaAccount | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sideBusinessId: '',
    accountName: '',
    phoneNumber: '',
    initialFloat: 0,
    initialCash: 0,
  });
  const [transactionForm, setTransactionForm] = useState({
    type: 'deposit' as 'deposit' | 'withdrawal' | 'float_topup',
    amount: 0,
    note: '',
  });

  const mpesaBusinesses = data.sideBusinesses.filter(b => b.type === 'mpesa');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const account: MpesaAccount = {
      id: editingAccount?.id || crypto.randomUUID(),
      sideBusinessId: formData.sideBusinessId,
      accountName: formData.accountName,
      phoneNumber: formData.phoneNumber,
      currentFloat: editingAccount?.currentFloat || formData.initialFloat,
      cashOnHand: editingAccount?.cashOnHand || formData.initialCash,
      totalDeposits: editingAccount?.totalDeposits || 0,
      totalWithdrawals: editingAccount?.totalWithdrawals || 0,
      createdAt: editingAccount?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingAccount) {
      updateMpesaAccount(editingAccount.id, account);
    } else {
      addMpesaAccount(account);
    }

    setShowModal(false);
    setEditingAccount(null);
    setFormData({ sideBusinessId: '', accountName: '', phoneNumber: '', initialFloat: 0, initialCash: 0 });
  };

  const handleEdit = (account: MpesaAccount) => {
    setEditingAccount(account);
    setFormData({
      sideBusinessId: account.sideBusinessId,
      accountName: account.accountName,
      phoneNumber: account.phoneNumber,
      initialFloat: account.currentFloat,
      initialCash: account.cashOnHand,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setAccountToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      deleteMpesaAccount(accountToDelete);
    }
    setShowDeleteDialog(false);
    setAccountToDelete(null);
  };

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) return;

    const account = data.mpesaAccounts.find(a => a.id === selectedAccountId);
    if (!account) return;

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type: transactionForm.type === 'deposit' ? 'mpesa_deposit' : 
            transactionForm.type === 'withdrawal' ? 'mpesa_withdrawal' : 'mpesa_float_topup',
      timestamp: new Date().toISOString(),
      dateKey: new Date().toISOString().split('T')[0],
      userId: currentUser?.id || 'admin',
      note: transactionForm.note || undefined,
      mpesa: {
        amount: transactionForm.amount,
        accountId: selectedAccountId,
        transactionType: transactionForm.type,
      },
    };

    let updatedFloat = account.currentFloat;
    let updatedCash = account.cashOnHand;
    let updatedDeposits = account.totalDeposits;
    let updatedWithdrawals = account.totalWithdrawals;

    if (transactionForm.type === 'deposit') {
      updatedFloat += transactionForm.amount;
      updatedDeposits += transactionForm.amount;
    } else if (transactionForm.type === 'withdrawal') {
      updatedFloat -= transactionForm.amount;
      updatedCash += transactionForm.amount;
      updatedWithdrawals += transactionForm.amount;
    } else if (transactionForm.type === 'float_topup') {
      updatedCash -= transactionForm.amount;
      updatedFloat += transactionForm.amount;
    }

    updateMpesaAccount(selectedAccountId, {
      currentFloat: updatedFloat,
      cashOnHand: updatedCash,
      totalDeposits: updatedDeposits,
      totalWithdrawals: updatedWithdrawals,
    });

    addTransaction(transaction);

    setShowTransactionModal(false);
    setTransactionForm({ type: 'deposit', amount: 0, note: '' });
    setSelectedAccountId(null);
  };

  const currency = data.shopProfile?.currency || 'KES';

  return (
    <div className="p-4 pb-24 md:pb-6 md:ml-64">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">M-Pesa Tracking</h1>
          {mpesaBusinesses.length > 0 && (
            <button
              onClick={() => {
                setEditingAccount(null);
                setFormData({ sideBusinessId: mpesaBusinesses[0].id, accountName: '', phoneNumber: '', initialFloat: 0, initialCash: 0 });
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus size={20} />
              Add Account
            </button>
          )}
        </div>

        {mpesaBusinesses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Smartphone size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No M-Pesa business added yet</p>
            <button
              onClick={() => setCurrentPage('sideBusinesses')}
              className="mt-2 text-primary font-medium hover:underline"
            >
              Add an M-Pesa side business first
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {data.mpesaAccounts.map((account) => {
              const business = data.sideBusinesses.find(b => b.id === account.sideBusinessId);
              const total = account.currentFloat + account.cashOnHand;

              return (
                <div key={account.id} className="bg-surface rounded-lg shadow-sm p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{account.accountName}</h3>
                      <p className="text-sm text-gray-600">{business?.name}</p>
                      <p className="text-sm text-gray-500">{account.phoneNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedAccountId(account.id);
                          setTransactionForm({ type: 'deposit', amount: 0, note: '' });
                          setShowTransactionModal(true);
                        }}
                        className="p-2 hover:bg-green-100 rounded-lg text-green-600"
                        title="Add Transaction"
                      >
                        <Plus size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(account)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet size={16} className="text-blue-600" />
                        <span className="text-sm text-gray-600">Float</span>
                      </div>
                      <p className="text-lg font-bold text-blue-600">{currency} {account.currentFloat.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet size={16} className="text-green-600" />
                        <span className="text-sm text-gray-600">Cash</span>
                      </div>
                      <p className="text-lg font-bold text-green-600">{currency} {account.cashOnHand.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <ArrowDown size={16} className="text-purple-600" />
                        <span className="text-sm text-gray-600">Deposits</span>
                      </div>
                      <p className="text-lg font-bold text-purple-600">{currency} {account.totalDeposits.toLocaleString()}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <ArrowUp size={16} className="text-orange-600" />
                        <span className="text-sm text-gray-600">Withdrawals</span>
                      </div>
                      <p className="text-lg font-bold text-orange-600">{currency} {account.totalWithdrawals.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Total Value:</span>
                      <span className="text-xl font-bold text-primary">{currency} {total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {data.mpesaAccounts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No M-Pesa accounts added yet</p>
                <button
                  onClick={() => {
                    setEditingAccount(null);
                    setFormData({ sideBusinessId: mpesaBusinesses[0].id, accountName: '', phoneNumber: '', initialFloat: 0, initialCash: 0 });
                    setShowModal(true);
                  }}
                  className="mt-2 text-primary font-medium hover:underline"
                >
                  Add your first M-Pesa account
                </button>
              </div>
            )}
          </div>
        )}

        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingAccount(null);
          }}
          title={editingAccount ? 'Edit Account' : 'Add Account'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business *</label>
              <select
                required
                value={formData.sideBusinessId}
                onChange={(e) => setFormData({ ...formData, sideBusinessId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {mpesaBusinesses.map((business) => (
                  <option key={business.id} value={business.id}>{business.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
              <input
                type="text"
                required
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="07XXXXXXXX"
              />
            </div>
            {!editingAccount && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Float</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.initialFloat}
                    onChange={(e) => setFormData({ ...formData, initialFloat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Cash on Hand</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.initialCash}
                    onChange={(e) => setFormData({ ...formData, initialCash: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </>
            )}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingAccount(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700"
              >
                {editingAccount ? 'Update' : 'Add'} Account
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={showTransactionModal}
          onClose={() => {
            setShowTransactionModal(false);
            setSelectedAccountId(null);
          }}
          title="Add Transaction"
        >
          <form onSubmit={handleTransaction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type *</label>
              <select
                required
                value={transactionForm.type}
                onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="deposit">Deposit (Customer deposits to M-Pesa)</option>
                <option value="withdrawal">Withdrawal (Customer withdraws cash)</option>
                <option value="float_topup">Float Top-up (Add cash to float)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ({currency}) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm({ ...transactionForm, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <input
                type="text"
                value={transactionForm.note}
                onChange={(e) => setTransactionForm({ ...transactionForm, note: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Customer name or reference"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowTransactionModal(false);
                  setSelectedAccountId(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700"
              >
                Add Transaction
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setAccountToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Account"
          message="Are you sure you want to delete this M-Pesa account? All transaction history will be lost."
          confirmText="Delete"
          cancelText="Cancel"
        />
      </div>
    </div>
  );
}
