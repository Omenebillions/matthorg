'use client';

import { useState } from 'react';
import { addExpense } from '../actions';

const TAX_RATE = 0.08; // 8% tax rate

export default function AddExpensePage() {
  const [amount, setAmount] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseFloat(e.target.value) || 0;
    const newTax = newAmount * TAX_RATE;
    const newTotal = newAmount + newTax;
    setAmount(newAmount);
    setTax(newTax);
    setTotal(newTotal);
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl">Add Expense</h1>

      <form action={addExpense} className="mt-6">
        <div className="rounded-md bg-gray-50 p-4 md:p-6">
          {/* Description */}
          <div className="mb-4">
            <label htmlFor="description" className="mb-2 block text-sm font-medium">
              Description
            </label>
            <input
              id="description"
              name="description"
              type="text"
              placeholder="Enter a description"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-none placeholder:text-gray-500"
              required
            />
          </div>

          {/* Amount */}
          <div className="mb-4">
            <label htmlFor="amount" className="mb-2 block text-sm font-medium">
              Amount
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              placeholder="Enter the amount"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-none placeholder:text-gray-500"
              required
              onChange={handleAmountChange}
            />
          </div>

          {/* Tax */}
          <div className="mb-4">
            <label htmlFor="tax" className="mb-2 block text-sm font-medium">
              Tax (8%)
            </label>
            <input
              id="tax"
              name="tax"
              type="text"
              value={`$${tax.toFixed(2)}`}
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-none placeholder:text-gray-500 bg-gray-100"
              readOnly
            />
          </div>

          {/* Total */}
          <div className="mb-4">
            <label htmlFor="total" className="mb-2 block text-sm font-medium">
              Total
            </label>
            <input
              id="total"
              name="total"
              type="text"
              value={`$${total.toFixed(2)}`}
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-none placeholder:text-gray-500 bg-gray-100"
              readOnly
            />
          </div>

          {/* Category */}
          <div className="mb-4">
            <label htmlFor="category" className="mb-2 block text-sm font-medium">
              Category
            </label>
            <select
              id="category"
              name="category"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-none placeholder:text-gray-500"
              required
            >
              <option value="" disabled>
                Select a category
              </option>
              <option value="Salaries">Salaries</option>
              <option value="Marketing">Marketing</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Utilities">Utilities</option>
              <option value="Travel">Travel</option>
            </select>
          </div>

          {/* Date */}
          <div className="mb-4">
            <label htmlFor="date" className="mb-2 block text-sm font-medium">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-none placeholder:text-gray-500"
              required
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            type="button"
            className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex h-10 items-center rounded-lg bg-blue-500 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Add Expense
          </button>
        </div>
      </form>
    </div>
  );
}
