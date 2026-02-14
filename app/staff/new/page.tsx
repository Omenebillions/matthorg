
import Link from 'next/link'

const roles = [
  { id: 1, name: 'Owner' },
  { id: 2, name: 'Manager' },
  { id: 3, name: 'Staff' },
  { id: 4, name: 'Finance' },
  { id: 5, name: 'HR' },
];

export default function NewStaffPage() {

  async function createStaff(formData: FormData) {
    'use server'
    const staff = {
        name: formData.get('name'),
        email: formData.get('email'),
        role: formData.get('role'),
        department: formData.get('department'),
    }
    console.log(staff)
    // We will add the logic to save the staff to the database here later
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Add New Staff</h1>
          <Link href="/staff" className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">
            Back to Staff
          </Link>
        </header>

        <main className="flex-grow p-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <form action={createStaff}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="name" className="block text-gray-700 font-bold mb-2">Full Name</label>
                  <input type="text" id="name" name="name" className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label htmlFor="email" className="block text-gray-700 font-bold mb-2">Email</label>
                  <input type="email" id="email" name="email" className="w-full px-3 py-2 border rounded-lg" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="role" className="block text-gray-700 font-bold mb-2">Role</label>
                  <select id="role" name="role" className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Select Role</option>
                    {roles.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="department" className="block text-gray-700 font-bold mb-2">Department</label>
                  <input type="text" id="department" name="department" className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="text-right">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Staff Member</button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
