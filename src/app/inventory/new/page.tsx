import { createItem } from '../actions';

export default function AddInventoryItemPage() {
  return (
    <div className="w-full">
      <h1 className="text-2xl">Add Inventory Item</h1>

      <form action={createItem} className="mt-6">
        <div className="rounded-md bg-gray-50 p-4 md:p-6">
          {/* Item Name */}
          <div className="mb-4">
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Item Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter item name"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-none placeholder:text-gray-500"
              required
            />
          </div>

          {/* Stock Level */}
          <div className="mb-4">
            <label htmlFor="stockLevel" className="mb-2 block text-sm font-medium">
              Stock Level
            </label>
            <input
              id="stockLevel"
              name="stockLevel"
              type="number"
              placeholder="Enter stock level"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-none placeholder:text-gray-500"
              required
            />
          </div>

          {/* Price */}
          <div className="mb-4">
            <label htmlFor="price" className="mb-2 block text-sm font-medium">
              Price
            </label>
            <input
              id="price"
              name="price"
              type="number"
              placeholder="Enter price"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-none placeholder:text-gray-500"
              required
            />
          </div>

          {/* Category */}
          <div className="mb-4">
            <label htmlFor="category" className="mb-2 block text-sm font-medium">
              Category
            </label>
            <input
              id="category"
              name="category"
              type="text"
              placeholder="Enter category"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-none placeholder:text-gray-500"
              required
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-.4">
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
            Add Item
          </button>
        </div>
      </form>
    </div>
  );
}
