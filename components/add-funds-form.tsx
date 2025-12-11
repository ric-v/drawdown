'use client';

import { useState } from 'react';
import { Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { createPortal } from 'react-dom';

interface AddFundsFormProps {
  onFundsAdded: () => void;
}

export function AddFundsForm({ onFundsAdded }: AddFundsFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'DEPOSIT' as 'DEPOSIT' | 'WITHDRAWAL',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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

  const modalContent = isOpen ? (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-auto relative z-[101]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Add/Withdraw Funds</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
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
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
              Transaction Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              <option value="DEPOSIT">Add Funds (Deposit)</option>
              <option value="WITHDRAWAL">Withdraw Funds</option>
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              required
              step="0.01"
              min="0"
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-gray-500"
            />
            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-500 mt-2">
              Amount will be {formData.type === 'DEPOSIT' ? 'added to' : 'deducted from'} your total capital
            </p>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any notes about this transaction..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all placeholder:text-gray-500"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all disabled:opacity-50 font-medium"
            >
              {loading ? 'Processing...' : formData.type === 'DEPOSIT' ? 'Add Funds' : 'Withdraw'}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
        title="Add or withdraw funds"
      >
        <Plus className="w-4 h-4" />
        <span>Funds</span>
      </button>
      {typeof window !== 'undefined' && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
