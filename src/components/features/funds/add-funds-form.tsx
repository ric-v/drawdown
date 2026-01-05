'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AddFundsFormProps {
  onFundsAdded: () => void;
  trigger?: React.ReactNode;
}

export function AddFundsForm({ onFundsAdded, trigger }: AddFundsFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'DEPOSIT' as 'DEPOSIT' | 'WITHDRAWAL',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTypeChange = (value: string) => {
    setFormData({
      ...formData,
      type: value as 'DEPOSIT' | 'WITHDRAWAL',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/portfolio/funds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formData.date,
          amount: parseFloat(formData.amount),
          type: formData.type,
          notes: formData.notes || undefined,
        }),
      });

      if (response.ok) {
        setIsOpen(false);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          amount: '',
          type: 'DEPOSIT',
          notes: '',
        });
        onFundsAdded();
      } else {
        alert('Failed to add fund transaction');
      }
    } catch (error) {
      console.error('Error adding fund transaction:', error);
      alert('Error adding fund transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Funds
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-gray-200/60 dark:border-slate-800/60 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">Add Funds Transaction</DialogTitle>
          <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
            Record a deposit or withdrawal from your trading account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
              Date
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="col-span-3 h-11 rounded-xl border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
              Type
            </Label>
            <div className="col-span-3">
              <Select value={formData.type} onValueChange={handleTypeChange}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 transition-all duration-300">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl">
                  <SelectItem value="DEPOSIT" className="rounded-lg font-medium">Add Funds (Deposit)</SelectItem>
                  <SelectItem value="WITHDRAWAL" className="rounded-lg font-medium">Withdraw Funds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="amount" className="text-right pt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Amount
            </Label>
            <div className="col-span-3 space-y-2">
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={handleChange}
                required
                className="h-11 rounded-xl border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Amount will be {formData.type === 'DEPOSIT' ? 'added to' : 'deducted from'} your total capital
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right pt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any notes about this transaction..."
              value={formData.notes}
              onChange={handleChange}
              className="col-span-3 rounded-xl border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 min-h-[100px]"
            />
          </div>
          <DialogFooter className="gap-3">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl h-11 font-medium border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-300">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl h-11 font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 active:scale-95">
              {loading ? 'Processing...' : formData.type === 'DEPOSIT' ? 'Add Funds' : 'Withdraw'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
