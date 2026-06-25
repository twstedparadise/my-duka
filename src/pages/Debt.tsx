import { useState } from 'react';
import { Plus, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Transaction, Pocket } from '../types';
import Modal from '../components/Modal';
import { format, differenceInDays } from 'date-fns';

export default function Debt() {
  const { data, addTransaction } = useStore();
  const [showNewDebtModal, setShowNewDebtModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    amount: '',
    items: '',
    note: '',
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentPocket, setPaymentPocket] = useState<Pocket>('Cash');

  const debts = data.transactions.filter(t => t.type === 'debt');
  const payments = data.transactions.filter(t => t.type === 'debt_payment');

  const getDebtStatus = (debt: Transaction) => {
    const debtPayments = payments
      .filter(p => p.debtPayment?.debtId === debt.id)
      .reduce((sum, p) => sum + (p.debtPayment?.amount || 0), 0);

    const remaining = (debt.debt?.amount || 0) - debtPayments;
    const daysSince = differenceInDays(new Date(), new Date(debt.timestamp));

    if (remaining <= 0) return { status: 'paid', label: 'Paid', color: 'green' };
    if (daysSince <= 7) return { status: 'current', label: 'Current', color: 'blue' };
    if (daysSince <= 30) return { status: 'overdue', label: 'Overdue', color: 'yellow' };
    if (daysSince <= 90) return { status: 'old', label: 'Old', color: 'orange' };
    return { status: 'bad', label: 'Bad Debt', color: 'red' };
  };

  const getOutstandingAmount = (debt: Transaction) => {
    const debtPayments = payments
      .filter(p => p.debtPayment?.debtId === debt.id)
      .reduce((sum, p) => sum + (p.debtPayment?.amount || 0), 0);
    return (debt.debt?.amount || 0) - debtPayments;
  };

  const totalOutstanding = debts.reduce((sum, debt) => sum + getOutstandingAmount(debt), 0);
  const totalCollected = payments.reduce((sum, p) => sum + (p.debtPayment?.amount || 0), 0);
  const totalDebt = debts.reduce((sum, debt) => sum + (debt.debt?.amount || 0), 0);
  const recoveryRate = totalDebt > 0 ? ((totalCollected / totalDebt) * 100).toFixed(1) : '0';

  const handleNewDebt = (e: React.FormEvent) => {
    e.preventDefault();

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type: 'debt',
      timestamp: new Date().toISOString(),
      dateKey: new Date().toISOString().split('T')[0],
      userId: data.currentUser?.id || 'admin',
      note: formData.note || undefined,
      debt: {
        customerName: formData.customerName,
        amount: parseFloat(formData.amount),
        items: formData.items || undefined,
        status: 'unpaid',
        amountPaid: 0,
        payments: [],
      },
    };

    addTransaction(transaction);
    setShowNewDebtModal(false);
    setFormData({ customerName: '', amount: '', items: '', note: '' });
  };

  const handlePayment = () => {
    if (!selectedDebt || !paymentAmount) return;

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type: 'debt_payment',
      timestamp: new Date().toISOString(),
      dateKey: new Date().toISOString().split('T')[0],
      userId: data.currentUser?.id || 'admin',
      debtPayment: {
        debtId: selectedDebt.id,
        amount: parseFloat(paymentAmount),
        receivedBy: data.currentUser?.name || 'Admin',
        pocket: paymentPocket,
      },
    };

    addTransaction(transaction);
    setShowPaymentModal(false);
    setSelectedDebt(null);
    setPaymentAmount('');
    setPaymentPocket('Cash');
  };

  const currency = data.shopProfile?.currency || 'KES';

  const sortedDebts = [...debts].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="p-4 pb-24 md:pb-6 md:ml-64">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Debt Management</h1>
          <button
            onClick={() => setShowNewDebtModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus size={20} />
            Record Debt
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-surface rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Outstanding</p>
            <p className="text-2xl font-bold text-red-600">{currency} {totalOutstanding.toLocaleString()}</p>
          </div>
          <div className="bg-surface rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Collected</p>
            <p className="text-2xl font-bold text-green-600">{currency} {totalCollected.toLocaleString()}</p>
          </div>
          <div className="bg-surface rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Recovery Rate</p>
            <p className="text-2xl font-bold text-blue-600">{recoveryRate}%</p>
          </div>
        </div>

        {/* Debts List */}
        <div className="bg-surface rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold">Active Debts</h2>
          </div>
          {sortedDebts.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {sortedDebts.map((debt) => {
                const status = getDebtStatus(debt);
                const outstanding = getOutstandingAmount(debt);
                const daysSince = differenceInDays(new Date(), new Date(debt.timestamp));

                return (
                  <div key={debt.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{debt.debt?.customerName}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              status.color === 'green' ? 'bg-green-100 text-green-700' :
                              status.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                              status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                              status.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{debt.debt?.items}</p>
                        <p className="text-sm text-gray-500">{format(new Date(debt.timestamp), 'MMM d, yyyy')} • {daysSince} days ago</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">{currency} {outstanding.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">outstanding</p>
                        {outstanding > 0 && (
                          <button
                            onClick={() => {
                              setSelectedDebt(debt);
                              setShowPaymentModal(true);
                            }}
                            className="mt-2 text-primary font-medium text-sm hover:underline"
                          >
                            Record Payment
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <DollarSign size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No debts recorded</p>
            </div>
          )}
        </div>

        <Modal
          isOpen={showNewDebtModal}
          onClose={() => {
            setShowNewDebtModal(false);
            setFormData({ customerName: '', amount: '', items: '', note: '' });
          }}
          title="Record New Debt"
        >
          <form onSubmit={handleNewDebt} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ({currency}) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Items Purchased (optional)</label>
              <input
                type="text"
                value={formData.items}
                onChange={(e) => setFormData({ ...formData, items: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., 2kg Sugar, 1 Bread"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowNewDebtModal(false);
                  setFormData({ customerName: '', amount: '', items: '', note: '' });
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700"
              >
                Record Debt
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedDebt(null);
            setPaymentAmount('');
            setPaymentPocket('Cash');
          }}
          title="Record Debt Payment"
        >
          {selectedDebt && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold">{selectedDebt.debt?.customerName}</p>
                <p className="text-sm text-gray-600">
                  Outstanding: {currency} {getOutstandingAmount(selectedDebt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount ({currency}) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Pocket</label>
                <select
                  value={paymentPocket}
                  onChange={(e) => setPaymentPocket(e.target.value as Pocket)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="Cash">Cash</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank">Bank</option>
                  <option value="Mobile Money">Mobile Money</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedDebt(null);
                    setPaymentAmount('');
                    setPaymentPocket('Cash');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700"
                >
                  Record Payment
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
