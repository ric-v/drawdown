import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FundTransaction } from '@/types/trading';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, History, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

export function FundHistory() {
  const [transactions, setTransactions] = useState<FundTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/portfolio/funds');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.fundTransactions.map((t: any) => ({
          ...t,
          date: new Date(t.date)
        })).sort((a: FundTransaction, b: FundTransaction) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      }
    } catch (error) {
      console.error('Error fetching fund transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fund transaction? This will update your capital.')) {
      return;
    }

    try {
      const response = await fetch(`/api/portfolio/funds?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchTransactions();
        // Refresh the page to update all stats
        window.location.reload();
      } else {
        alert('Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Error deleting transaction');
    }
  };

  const formatINR = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalDeposits = transactions
    .filter(t => t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalWithdrawals = transactions
    .filter(t => t.type === 'WITHDRAWAL')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = useMemo(() => 
    transactions.slice(startIndex, endIndex),
    [transactions, startIndex, endIndex]
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const latestTransaction = transactions[0];

  if (transactions.length === 0) return null;

  const modalContent = isModalOpen ? (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl shadow-2xl p-8 max-w-4xl w-full mx-auto relative z-[101] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Fund Transaction History</h2>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="text-center">
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Deposits</p>
            <p className="text-lg md:text-xl font-semibold text-emerald-500">+{formatINR(totalDeposits)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Withdrawals</p>
            <p className="text-lg md:text-xl font-semibold text-red-500">-{formatINR(totalWithdrawals)}</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-3 px-4 text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="text-right py-3 px-4 text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="text-left py-3 px-4 text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Notes</th>
                <th className="text-center py-3 px-4 text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-200/50 dark:border-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 px-4 text-xs md:text-sm text-gray-700 dark:text-gray-300">
                    {format(new Date(transaction.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      transaction.type === 'DEPOSIT'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    )}>
                      {transaction.type === 'DEPOSIT' ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {transaction.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                    </span>
                  </td>
                  <td className={cn(
                    'py-3 px-4 text-xs md:text-sm text-right font-semibold',
                    transaction.type === 'DEPOSIT' ? 'text-emerald-500' : 'text-red-500'
                  )}>
                    {transaction.type === 'DEPOSIT' ? '+' : '-'}{formatINR(transaction.amount)}
                  </td>
                  <td className="py-3 px-4 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    {transaction.notes || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="p-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/20 transition-colors"
                        title="Delete transaction"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, transactions.length)} of {transactions.length} transactions
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-4 py-2 text-xs md:text-sm text-gray-900 dark:text-gray-100">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
    <Card className="col-span-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Fund History
          </CardTitle>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            Show All
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Deposits</p>
              <p className="text-sm font-semibold text-emerald-500">+{formatINR(totalDeposits)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Withdrawals</p>
              <p className="text-sm font-semibold text-red-500">-{formatINR(totalWithdrawals)}</p>
            </div>
          </div>

          {/* Latest Transaction */}
          {latestTransaction && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Latest Transaction</p>
              <div
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    latestTransaction.type === 'DEPOSIT' 
                      ? "bg-emerald-500/10 text-emerald-500" 
                      : "bg-red-500/10 text-red-500"
                  )}>
                    {latestTransaction.type === 'DEPOSIT' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {latestTransaction.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(latestTransaction.date), 'MMM dd, yyyy')}
                    </p>
                    {latestTransaction.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {latestTransaction.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className={cn(
                  "text-sm font-semibold",
                  latestTransaction.type === 'DEPOSIT' ? "text-emerald-500" : "text-red-500"
                )}>
                  {latestTransaction.type === 'DEPOSIT' ? '+' : '-'}{formatINR(latestTransaction.amount)}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    {typeof window !== 'undefined' && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
