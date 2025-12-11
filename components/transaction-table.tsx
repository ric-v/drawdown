import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DailyPnL } from '@/types/trading';
import { cn, getColorClass } from '@/lib/utils';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2, Layers } from 'lucide-react';
import { useState, useMemo } from 'react';

interface TransactionTableProps {
  transactions: DailyPnL[];
  isConsolidated?: boolean;
  onToggleConsolidation?: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (entry: DailyPnL) => void;
}

type SortField = 'date' | 'pnl';
type SortOrder = 'asc' | 'desc';

export function TransactionTable({ transactions, isConsolidated = true, onToggleConsolidation, onDelete, onEdit }: TransactionTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const formatINR = (amount: number) => {
    return `₹${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'pnl') {
        comparison = a.pnl - b.pnl;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [transactions, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = sortedTransactions.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortOrder === 'asc' ? 
      <ArrowUp className="w-4 h-4 ml-1" /> : 
      <ArrowDown className="w-4 h-4 ml-1" />;
  };

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Daily P&L History</CardTitle>
        {transactions.length > 0 && (
          <div className="flex items-center gap-3">
            {onToggleConsolidation && (
              <button
                onClick={onToggleConsolidation}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm transition-colors border",
                  isConsolidated
                    ? "bg-emerald-600/10 text-emerald-500 border-emerald-600/20 hover:bg-emerald-600/20"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-700"
                )}
              >
                <Layers className="w-4 h-4" />
                {isConsolidated ? 'Show All Entries' : 'Consolidate by Date'}
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">entries</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th 
                  className="text-left py-3 px-4 text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date
                    <SortIcon field="date" />
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th 
                  className="text-right py-3 px-4 text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  onClick={() => handleSort('pnl')}
                >
                  <div className="flex items-center justify-end">
                    P&L Amount
                    <SortIcon field="pnl" />
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Notes</th>
                {!isConsolidated && (onEdit || onDelete) && (
                  <th className="text-center py-3 px-4 text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={!isConsolidated && (onEdit || onDelete) ? 5 : 4} className="py-8 text-center text-gray-500 dark:text-gray-500">
                    No data yet. Add your first daily P&L entry!
                  </td>
                </tr>
              ) : (
                currentTransactions.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-gray-200/50 dark:border-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-xs md:text-sm text-gray-700 dark:text-gray-300">
                      {format(new Date(entry.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          entry.pnl >= 0
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        )}
                      >
                        {entry.pnl >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {entry.pnl >= 0 ? 'PROFIT' : 'LOSS'}
                      </span>
                    </td>
                    <td className={cn(
                      'py-3 px-4 text-xs md:text-sm text-right font-semibold',
                      getColorClass(entry.pnl)
                    )}>
                      {entry.pnl >= 0 ? '+' : '-'}{formatINR(entry.pnl)}
                    </td>
                    <td className="py-3 px-4 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                      {entry.notes || '-'}
                    </td>
                    {!isConsolidated && (onEdit || onDelete) && (
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(entry)}
                              className="p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-600/20 transition-colors"
                              title="Edit entry"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(entry.id)}
                              className="p-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/20 transition-colors"
                              title="Delete entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {transactions.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, transactions.length)} of {transactions.length} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                    return false;
                  })
                  .map((page, index, array) => (
                    <>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-500 dark:text-gray-500">...</span>
                      )}
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={cn(
                          'px-3 py-1 rounded-lg transition-colors',
                          currentPage === page
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        )}
                      >
                        {page}
                      </button>
                    </>
                  ))}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
