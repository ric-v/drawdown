'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FundTransaction } from '@/types/trading';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, History, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useState, useEffect, useMemo } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DateRange } from "react-day-picker";

interface FundHistoryProps {
  onFundUpdate?: () => void;
  dateRange?: DateRange;
}

export function FundHistory({ onFundUpdate, dateRange }: FundHistoryProps = {}) {
  const [transactions, setTransactions] = useState<FundTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchTransactions();
  }, [isModalOpen, dateRange]); // Refresh when opening or when date changes

  const fetchTransactions = async () => {
    try {
      let url = '/api/portfolio/funds';

      // Add data params if exists
      if (dateRange?.from) {
        url += `?from=${dateRange.from.toISOString()}`;
        if (dateRange.to) {
          url += `&to=${dateRange.to.toISOString()}`;
        }
      }

      const response = await fetch(url);
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
        if (onFundUpdate) {
          onFundUpdate();
        }
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

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <Card className="col-span-1 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Fund History
            </CardTitle>
            <DialogTrigger asChild>
              <Button variant="ghost" className="text-sm text-blue-500 hover:text-blue-600">
                Show All
              </Button>
            </DialogTrigger>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Deposits</p>
                <p className="text-sm font-semibold text-emerald-500">+{formatINR(totalDeposits)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Withdrawals</p>
                <p className="text-sm font-semibold text-red-500">-{formatINR(totalWithdrawals)}</p>
              </div>
            </div>

            {/* Latest Transaction */}
            {latestTransaction ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Latest Transaction</p>
                <div
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
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
                      <p className="text-sm font-medium">
                        {latestTransaction.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(latestTransaction.date), 'MMM dd, yyyy')}
                      </p>
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
            ) : (
              <p className="text-sm text-muted-foreground">No transactions recorded</p>
            )}
          </div>
        </CardContent>
      </Card>

      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Fund Transaction History</DialogTitle>
          <DialogDescription>
            A complete history of your deposits and withdrawals.
          </DialogDescription>
        </DialogHeader>

        {/* Summary Modal */}
        <div className="grid grid-cols-2 gap-4 my-2 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Deposits</p>
            <p className="text-xl font-semibold text-emerald-500">+{formatINR(totalDeposits)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Withdrawals</p>
            <p className="text-xl font-semibold text-red-500">-{formatINR(totalWithdrawals)}</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(new Date(transaction.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === 'DEPOSIT' ? 'success' : 'destructive'}>
                      {transaction.type === 'DEPOSIT' ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {transaction.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-medium",
                    transaction.type === 'DEPOSIT' ? 'text-emerald-500' : 'text-red-500'
                  )}>
                    {transaction.type === 'DEPOSIT' ? '+' : '-'}{formatINR(transaction.amount)}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {transaction.notes || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTransaction(transaction.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {currentTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
