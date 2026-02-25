'use client';

import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

// Placeholder data for inventory items
const initialInventoryItems = [
  { id: 1, name: 'Laptop', stockLevel: 15, price: 1200, category: 'Electronics' },
  { id: 2, name: 'Keyboard', stockLevel: 50, price: 75, category: 'Accessories' },
  { id: 3, name: 'Mouse', stockLevel: 75, price: 25, category: 'Accessories' },
  { id: 4, name: 'Monitor', stockLevel: 20, price: 300, category: 'Electronics' },
];

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState(initialInventoryItems);

  const handleDelete = (id: number) => {
    setInventoryItems(inventoryItems.filter((item) => item.id !== id));
  };

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl">Inventory</h1>
        <button className="flex items-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600">
          <PlusIcon className="h-5 w-5" />
          <span>Add Item</span>
        </button>
      </div>

      <div className="mt-6 flow-root">
        <div className="inline-block min-w-full align-middle">
          <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
            <table className="min-w-full text-gray-900 md:table">
              <thead className="rounded-lg text-left text-sm font-normal">
                <tr>
                  <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium">
                    Stock Level
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium">
                    Price
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium">
                    Category
                  </th>
                  <th scope="col" className="relative py-3 pl-6 pr-3">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {inventoryItems.map((item) => (
                  <tr key={item.id} className="w-full border-b py-3 text-sm last-of-type:border-none">
                    <td className="whitespace-nowrap px-3 py-3">{item.name}</td>
                    <td className="whitespace-nowrap px-3 py-3">{item.stockLevel}</td>
                    <td className="whitespace-nowrap px-3 py-3">${item.price.toFixed(2)}</td>
                    <td className="whitespace-nowrap px-3 py-3">{item.category}</td>
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleDelete(item.id)} className="rounded-md border p-2 hover:bg-gray-100">
                          <TrashIcon className="w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
