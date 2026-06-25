import { useState } from 'react';
import { Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Transaction, Pocket } from '../types';
import { format } from 'date-fns';

export default function EndOfDay() {
  const { data, addTransaction } = useStore();
  const [pocketCounts, setPocketCounts] = useState<Record<Pocket, string>>({
    'Cash': '',
    'M-Pesa': '',
    'Bank': '',
    'Mobile Money': '',
  });
  const [note, setNote] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = data.transactions.filter(t => t.dateKey === today && t.type === 'sale');

  const expectedTotals: Record<Pocket, number> = {
    'Cash': 0,
    'M-Pesa': 0,
    'Bank': 0,
    'Mobile Money': 0,
  };

  todayTransactions.forEach(t => {
    if (t.sale?.pocket) {
      expectedTotals[t.sale.pocket] += t.sale.totalAmount;
    }
  });

  const totalCounted = Object.values(pocketCounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const expectedTotal = Object.values(expectedTotals).reduce((sum, val) => sum + val, 0);
  const discrepancy = totalCounted - expectedTotal;
  const discrepancyPercent = expectedTotal > 0 ? (discrepancy / expectedTotal) * 100 : 0;

  const handleSubmit = () => {
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type: 'eod_count',
      timestamp: new Date().toISOString(),
      dateKey: today,
      userId: data.currentUser?.id || 'admin',
      note: note || undefined,
      eodCount: {
        pocketCounts: Object.fromEntries(
          Object.entries(pocketCounts).map(([key, value]) => [key, parseFloat(value) || 0])
        ) as Record<string, number>,
        totalCounted,
        expectedTotal,
        discrepancy,
        discrepancyPercent,
        shiftDate: today,
      },
    };

    addTransaction(transaction);
    setPocketCounts({
      'Cash': '',
      'M-Pesa': '',
      'Bank': '',
      'Mobile Money': '',
    });
    setNote('');
    alert('End of Day reconciliation saved successfully!');
  };

  const currency = data.shopProfile?.currency || 'KES';

  const pockets: Pocket[] = ['Cash', 'M-Pesa', 'Bank', 'Mobile Money'];

  return (
    <div className="p-4 pb-24 md:pb-6 md:ml-64">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">End of Day Reconciliation</h1>

        <div className="bg-surface rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">{format(new Date(), 'EEEE, MMMM d, yyyy')}</h2>
          </div>

          <div className="space-y-4">
            {pockets.map((pocket) => (
              <div key={pocket}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {pocket} Count ({currency})
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={pocketCounts[pocket]}
                    onChange={(e) => setPocketCounts({ ...pocketCounts, [pocket]: e.target.value })}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <div className="text-right min-w-32">
                    <p className="text-sm text-gray-600">Expected:</p>
                    <p className="font-semibold">{currency} {expectedTotals[pocket].toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">System Expected Total:</span>
              <span className="font-semibold">{currency} {expectedTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">You Counted Total:</span>
              <span className="font-semibold">{currency} {totalCounted.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-gray-600 font-medium">Discrepancy:</span>
              <span className={`text-2xl font-bold ${discrepancy >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {discrepancy >= 0 ? '+' : ''}{currency} {discrepancy.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Percentage:</span>
              <span className={`font-semibold ${Math.abs(discrepancyPercent) <= 5 ? 'text-green-600' : 'text-red-600'}`}>
                {discrepancyPercent.toFixed(2)}%
              </span>
            </div>
            {Math.abs(discrepancyPercent) <= 5 && (
              <div className="flex items-center gap-2 text-green-600 mt-2">
                <CheckCircle size={18} />
                <span className="text-sm">Acceptable variance (≤5%)</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Add any notes about the discrepancy..."
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full mt-6 bg-primary text-white py-3 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
        >
          <CheckCircle size={20} />
          Confirm End of Day
        </button>

        <div className="mt-6 bg-surface rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Today's Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Revenue:</span>
              <span className="font-semibold">{currency} {expectedTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transactions:</span>
              <span className="font-semibold">{todayTransactions.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
