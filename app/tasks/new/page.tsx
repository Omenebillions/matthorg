
import Link from 'next/link'

export default function NewTaskPage() {

  async function createTask(formData: FormData) {
    'use server'
    const task = {
        title: formData.get('title'),
        description: formData.get('description'),
        assignedTo: formData.get('assignedTo'),
        priority: formData.get('priority'),
        dueDate: formData.get('dueDate'),
    }
    console.log(task)
    // We will add the logic to save the task to the database here later
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Create New Task</h1>
          <Link href="/tasks" className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">
            Back to Tasks
          </Link>
        </header>

        <main className="flex-grow p-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <form action={createTask}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-700 font-bold mb-2">Title</label>
                <input type="text" id="title" name="title" className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-gray-700 font-bold mb-2">Description</label>
                <textarea id="description" name="description" rows={4} className="w-full px-3 py-2 border rounded-lg"></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label htmlFor="assignedTo" className="block text-gray-700 font-bold mb-2">Assigned To</label>
                  <input type="text" id="assignedTo" name="assignedTo" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label htmlFor="priority" className="block text-gray-700 font-bold mb-2">Priority</label>
                  <select id="priority" name="priority" className="w-full px-3 py-2 border rounded-lg">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="dueDate" className="block text-gray-700 font-bold mb-2">Due Date</label>
                  <input type="date" id="dueDate" name="dueDate" className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="text-right">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Task</button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
