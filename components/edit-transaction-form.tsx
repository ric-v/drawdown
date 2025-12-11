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
  onEntryUpdated: () => void;
}

export function EditTransactionForm({ entry, isOpen, onClose, onEntryUpdated }: EditTransactionFormProps) {
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
        pnl: entry.pnl.toString(),
        notes: entry.notes || '',
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
      const response = await fetch(`/api/portfolio/${entry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formData.date,
          pnl: parseFloat(formData.pnl),
          notes: formData.notes || undefined,
        }),
      });

      if (response.ok) {
        onEntryUpdated();
        onClose();
      } else {
        alert('Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Error updating entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit P&L Entry</DialogTitle>
          <DialogDescription>
            Make changes to your daily P&L entry here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="pnl" className="text-right pt-2.5">
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
              />
              <p className="text-[0.8rem] text-muted-foreground">
                Positive for profit, negative for loss
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right pt-2.5">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any notes about the day..."
              value={formData.notes}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? 'Updating...' : 'Update P&L'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
