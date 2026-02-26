// /home/user/matthorg/src/components/dashboard/TaskList.tsx
"use client";

interface TaskListProps {
  tasks: any[];
  orgId?: string; // Added to fix TS2322
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

export default function TaskList({ 
  tasks, 
  orgId, // Destructured prop
  onStatusChange 
}: TaskListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Task</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Due Date</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <tr key={task.id}>
              <td className="px-6 py-4">{task.title}</td>
              <td className="px-6 py-4">
                <select
                  value={task.status}
                  onChange={(e) => onStatusChange?.(task.id, e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </td>
              <td className="px-6 py-4">
                {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
              </td>
              <td className="px-6 py-4">
                <button className="text-blue-600 hover:underline text-sm">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}