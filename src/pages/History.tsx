import { useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { useStore } from '../store/useStore';
import { TransactionType } from '../types';
import { format } from 'date-fns';

export default function History() {
  const { data } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'All'>('All');
  const [selectedDate, setSelectedDate] = useState('');

  const filteredTransactions = data.transactions
    .filter(t => {
      const matchesType = selectedType === 'All' || t.type === selectedType;
      const matchesDate = !selectedDate || t.dateKey === selectedDate;
      const matchesSearch = !searchQuery || 
        t.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.sale?.productId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesDate && matchesSearch;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const transactionTypes: (TransactionType | 'All')[] = ['All', 'sale', 'restock', 'debt', 'debt_payment', 'eod_count'];

  const getTransactionLabel = (type: TransactionType) => {
    const labels: Record<TransactionType, string> = {
      sale: 'Sale',
      restock: 'Restock',
      debt: 'Debt Recorded',
      debt_payment: 'Debt Payment',
      payment_out: 'Payment Out',
      payment_in: 'Payment In',
      eod_count: 'End of Day',
      adjustment: 'Adjustment',
    };
    return labels[type];
  };

  const getTransactionDetails = (t: Transaction) => {
    const currency = data.shopProfile?.currency || 'KES';
    
    switch (t.type) {
      case 'sale':
        const product = data.products.find(p => p.id === t.sale?.productId);
        return (
          <>
            <p className="font-medium">{product?.name || 'Unknown Product'} x{t.sale?.quantity}</p>
            <p className="text-sm text-gray-600">{currency} {t.sale?.totalAmount?.toLocaleString()}</p>
            {t.sale?.grossProfit && t.sale.grossProfit > 0 && (
              <p className="text-sm text-green-600">Profit: {currency} {t.sale.grossProfit.toLocaleString()}</p>
            )}
          </>
        );
      case 'restock':
        const restockProduct = data.products.find(p => p.id === t.restock?.productId);
        return (
          <>
            <p className="font-medium">{restockProduct?.name || 'Unknown Product'} +{t.restock?.quantity}</p>
            <p className="text-sm text-gray-600">{currency} {t.restock?.totalCost?.toLocaleString()}</p>
          </>
        );
      case 'debt':
        return (
          <>
            <p className="font-medium">{t.debt?.customerName}</p>
            <p className="text-sm text-gray-600">{currency} {t.debt?.amount?.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{t.debt?.items}</p>
          </>
        );
      case 'debt_payment':
        return (
          <>
            <p className="font-medium">Payment Received</p>
            <p className="text-sm text-gray-600">{currency} {t.debtPayment?.amount?.toLocaleString()}</p>
            <p className="text-sm text-gray-500">via {t.debtPayment?.pocket}</p>
          </>
        );
      case 'eod_count':
        return (
          <>
            <p className="font-medium">End of Day Count</p>
            <p className="text-sm text-gray-600">Discrepancy: {currency} {t.eodCount?.discrepancy?.toLocaleString()}</p>
          </>
        );
      default:
        return <p className="text-gray-600">{t.note || 'No details'}</p>;
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Details', 'Amount', 'Note'];
    const rows = filteredTransactions.map(t => {
      const currency = data.shopProfile?.currency || 'KES';
      let amount = '';
      if (t.type === 'sale') amount = t.sale?.totalAmount?.toString() || '';
      else if (t.type === 'restock') amount = t.restock?.totalCost?.toString() || '';
      else if (t.type === 'debt') amount = t.debt?.amount?.toString() || '';
      else if (t.type === 'debt_payment') amount = t.debtPayment?.amount?.toString() || '';

      return [
        format(new Date(t.timestamp), 'yyyy-MM-dd HH:mm'),
        getTransactionLabel(t.type),
        t.note || '',
        amount,
        t.note || '',
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-4 pb-24 md:pb-6 md:ml-64">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as TransactionType | 'All')}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {transactionTypes.map(type => (
                <option key={type} value={type}>{type === 'All' ? 'All Types' : getTransactionLabel(type as TransactionType)}</option>
              ))}
            </select>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div className="bg-surface rounded-lg shadow-sm">
          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-500">
                        {format(new Date(transaction.timestamp), 'MMM d, yyyy • h:mm a')}
                      </p>
                      <span className="inline-block mt-1 text-xs px-2 py-1 bg-gray-100 rounded-full">
                        {getTransactionLabel(transaction.type)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    {getTransactionDetails(transaction)}
                  </div>
                  {transaction.note && (
                    <p className="text-sm text-gray-500 mt-2 italic">{transaction.note}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No transactions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
