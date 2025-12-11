import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction } from '@/types/trading';
import { cn, formatCurrency, formatPercentage, getColorClass } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Symbol</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Quantity</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">P&L</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">P&L %</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-gray-300">
                    {format(new Date(transaction.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-semibold text-gray-100">
                      {transaction.symbol}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        transaction.type === 'BUY'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-amber-500/10 text-amber-400'
                      )}
                    >
                      {transaction.type === 'BUY' ? (
                        <ArrowDownRight className="w-3 h-3 mr-1" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                      )}
                      {transaction.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300 text-right">
                    {transaction.quantity.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300 text-right">
                    {formatCurrency(transaction.price)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300 text-right">
                    {formatCurrency(transaction.totalValue)}
                  </td>
                  <td className={cn(
                    'py-3 px-4 text-sm text-right font-semibold',
                    transaction.pnl !== undefined ? getColorClass(transaction.pnl) : 'text-gray-600'
                  )}>
                    {transaction.pnl !== undefined 
                      ? formatCurrency(transaction.pnl, true)
                      : '-'
                    }
                  </td>
                  <td className={cn(
                    'py-3 px-4 text-sm text-right font-semibold',
                    transaction.pnlPercentage !== undefined ? getColorClass(transaction.pnlPercentage) : 'text-gray-600'
                  )}>
                    {transaction.pnlPercentage !== undefined
                      ? formatPercentage(transaction.pnlPercentage, true)
                      : '-'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
