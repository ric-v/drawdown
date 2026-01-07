'use client';

import { useState, useEffect } from 'react';
import { DailyPnL } from '@/types/trading';
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface EditTransactionFormProps {
  entry: DailyPnL | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<DailyPnL>) => Promise<void>;
}

export function EditTransactionForm({ entry, isOpen, onClose, onUpdate }: EditTransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    pnl: '',
    notes: '',
  });

  useEffect(() => {
    if (entry) {
      const date = new Date(entry.date);
      const formattedDate = date.toISOString().split('T')[0];
      setFormData({
        date: formattedDate,
        pnl: (entry.pnl ?? 0).toString(),
        notes: entry.notes || '',
      });
    } else {
      // Reset form when no entry
      setFormData({
        date: '',
        pnl: '',
        notes: '',
      });
    }
  }, [entry]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;

    setLoading(true);

    try {
      await onUpdate(entry.id, {
        date: new Date(formData.date),
        pnl: parseFloat(formData.pnl),
        notes: formData.notes || undefined,
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Error updating entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-gray-200/60 dark:border-slate-800/60 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">Edit P&L Entry</DialogTitle>
          <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
            Make changes to your daily P&L entry here. Click save when you're done.
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
              className="col-span-3 h-11 rounded-xl border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/30 transition-all duration-300"
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
                placeholder="Enter profit or loss"
                value={formData.pnl}
                onChange={handleChange}
                required
                className="h-11 rounded-xl border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/30 transition-all duration-300"
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
              className="col-span-3 rounded-xl border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/30 transition-all duration-300 min-h-[100px]"
            />
          </div>
          <DialogFooter className="gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl h-11 font-medium border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-300">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl h-11 font-medium shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 active:scale-95">
              {loading ? 'Updating...' : 'Update P&L'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
