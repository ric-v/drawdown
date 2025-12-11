'use client';

import { useState } from 'react';
import { Edit2 } from 'lucide-react';

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Initial Capital</DialogTitle>
          <DialogDescription>
            Update your starting capital. This will recalculate all performance statistics.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="equity">Initial Capital (₹)</Label>
            <Input
              id="equity"
              type="number"
              value={equity}
              onChange={(e) => setEquity(e.target.value)}
              placeholder="100000"
              required
              min="0"
              step="0.01"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

