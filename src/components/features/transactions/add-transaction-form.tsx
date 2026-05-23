'use client';

import { useState, useEffect } from 'react';
import { DailyPnL } from '@/types/trading';
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

interface AddTransactionFormProps {
  onAdd: (entry: Partial<DailyPnL>) => Promise<void>;
  trigger?: React.ReactNode;
  defaultDate?: string; // ISO 8601 date string (YYYY-MM-DD)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddTransactionForm({ onAdd, trigger, defaultDate, open, onOpenChange }: AddTransactionFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: defaultDate || new Date().toISOString().split('T')[0],
    pnl: '',
    notes: '',
  });

  useEffect(() => {
    if (defaultDate) {
      setFormData(prev => ({ ...prev, date: defaultDate }));
    }
  }, [defaultDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const entry: Partial<DailyPnL> = {
        date: new Date(formData.date),
        pnl: parseFloat(formData.pnl),
        notes: formData.notes || undefined,
      };

      await onAdd(entry);

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        pnl: '',
        notes: '',
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding P&L entry:', error);
      alert('Error adding P&L entry');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button className="bg-positive hover:bg-positive/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add P&L
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-gray-200/60 dark:border-slate-800/60 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">Add Daily P&L</DialogTitle>
          <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
            Enter your profit or loss for the day. Click save when you're done.
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
              className="col-span-3 h-11 rounded-xl border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm focus:ring-2 focus:ring-positive/30 transition-all duration-300"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="pnl" className="text-right pt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Amount
            </Label>
            <div className="col-span-3 space-y-2">
              <Input
                id="pnl"
                name="pnl"
                type="number"
                step="0.01"
                placeholder="+2400 or -1500"
                value={formData.pnl}
                onChange={handleChange}
                required
                className="h-11 rounded-xl border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm focus:ring-2 focus:ring-positive/30 transition-all duration-300"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Positive for profit, negative for loss
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
              placeholder="Any notes about the day..."
              value={formData.notes}
              onChange={handleChange}
              className="col-span-3 rounded-xl border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm focus:ring-2 focus:ring-positive/30 transition-all duration-300 min-h-[100px]"
            />
          </div>
          <DialogFooter className="gap-3">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl h-11 font-medium border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-300">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-positive hover:bg-positive/90 text-white rounded-xl h-11 font-medium shadow-lg shadow-positive/30 hover:shadow-xl hover:shadow-positive/40 transition-all duration-300 active:scale-95">
              {loading ? 'Adding...' : 'Add P&L'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
