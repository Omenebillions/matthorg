'use client';

import { motion } from 'framer-motion';
import { UserIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface StaffOnlineProps {
  staff: any[];
  attendance: any[];
  totalStaff: number;
  activeStaff: number;
}

export default function StaffOnline({ staff, attendance, totalStaff, activeStaff }: StaffOnlineProps) {
  const checkedInStaff = attendance.map(a => a.staff_id);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
        <span className="flex items-center">
          <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
          Staff Online
        </span>
        <span className="text-sm bg-green-100 text-green-600 px-2 py-1 rounded-full">
          {activeStaff}/{totalStaff} Online
        </span>
      </h2>

      <div className="space-y-3">
        {staff.map((member, index) => {
          const isOnline = checkedInStaff.includes(member.id);
          
          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {member.full_name?.charAt(0) || '?'}
                  </div>
                  {isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{member.full_name}</p>
                  <p className="text-xs text-gray-500">{member.roles?.name || 'Staff'}</p>
                </div>
              </div>
              <div className="flex items-center">
                {isOnline ? (
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                ) : (
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {staff.length === 0 && (
        <p className="text-center text-gray-500 py-4">No staff members</p>
      )}
    </div>
  );
}