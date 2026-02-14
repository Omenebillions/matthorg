
import Link from 'next/link'

export default function NewSalePage() {

  async function createSale(formData: FormData) {
    'use server'
    const sale = {
        item: formData.get('item'),
        amount: formData.get('amount'),
        quantity: formData.get('quantity'),
        customer: formData.get('customer'),
        staff: formData.get('staff'),
    }
    console.log(sale)
    // We will add the logic to save the sale to the database here later
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Record New Sale</h1>
          <Link href="/sales" className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">
            Back to Sales
          </Link>
        </header>

        <main className="flex-grow p-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <form action={createSale}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="item" className="block text-gray-700 font-bold mb-2">Item</label>
                  <input type="text" id="item" name="item" className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label htmlFor="customer" className="block text-gray-700 font-bold mb-2">Customer Name</label>
                  <input type="text" id="customer" name="customer" className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label htmlFor="amount" className="block text-gray-700 font-bold mb-2">Amount ($)</label>
                  <input type="number" id="amount" name="amount" className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label htmlFor="quantity" className="block text-gray-700 font-bold mb-2">Quantity</label>
                  <input type="number" id="quantity" name="quantity" className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label htmlFor="staff" className="block text-gray-700 font-bold mb-2">Recorded By</label>
                  <input type="text" id="staff" name="staff" className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="text-right">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Record Sale</button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
