'use client';

import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { getCurrencySymbol } from '@/lib/utils/format-settings';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface EditEquityFormProps {
  currentEquity: number;
  onEquityUpdated: () => void;
  trigger?: React.ReactNode;
}

export function EditEquityForm({ currentEquity, onEquityUpdated, trigger }: EditEquityFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [equity, setEquity] = useState(currentEquity.toString());
  const { settings } = useSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/portfolio/equity', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initialCapital: parseFloat(equity) }),
      });

      if (response.ok) {
        setIsOpen(false);
        onEquityUpdated();
      } else {
        alert('Failed to update equity');
      }
    } catch (error) {
      console.error('Error updating equity:', error);
      alert('Error updating equity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-emerald-500">
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-gray-200/60 dark:border-slate-800/60 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">Edit Initial Capital</DialogTitle>
          <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
            Update your starting capital. This will recalculate all performance statistics.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-3">
            <Label htmlFor="equity" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Initial Capital ({getCurrencySymbol(settings)})</Label>
            <Input
              id="equity"
              type="number"
              value={equity}
              onChange={(e) => setEquity(e.target.value)}
              placeholder="100000"
              required
              min="0"
              step="0.01"
              className="h-11 rounded-xl border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
            />
          </div>
          <DialogFooter className="gap-3">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl h-11 font-medium border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-300">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl h-11 font-medium shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 active:scale-95">
              {loading ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

