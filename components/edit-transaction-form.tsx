'use client';

import { useState, useEffect } from 'react';
import { DailyPnL } from '@/types/trading';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface EditTransactionFormProps {
  entry: DailyPnL | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTransactionForm({ entry, isOpen, onClose, onSuccess }: EditTransactionFormProps) {
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
        onSuccess();
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

  const modalContent = isOpen && entry ? (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-auto relative z-[101]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit P&L Entry</h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
              Profit/Loss Amount (₹)
            </label>
            <input
              type="number"
              name="pnl"
              value={formData.pnl}
              onChange={handleChange}
              placeholder="Enter profit (+2400) or loss (-8000)"
              required
              step="0.01"
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Positive for profit, negative for loss
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any notes about the day..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all placeholder:text-gray-500"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all disabled:opacity-50 font-medium"
            >
              {loading ? 'Updating...' : 'Update P&L'}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return typeof window !== 'undefined' && modalContent ? createPortal(modalContent, document.body) : null;
}
