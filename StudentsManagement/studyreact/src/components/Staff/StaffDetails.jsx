
import React from 'react'

const StaffDetails = ({ staff, onClose, onEdit }) => {

  if (!staff) return null

  const details = [
    ['Staff Number', staff.staff_number],
    ['First Name', staff.first_name],
    ['Last Name', staff.last_name],
    ['Username', staff.username],
    ['Email', staff.email],
    ['Phone Number', staff.phone_number || 'N/A'],
    ['Designation', staff.designation],
    ['Employment Date', staff.employment_date || 'N/A'],
    ['Account Status', staff.is_active ? 'Active' : 'Inactive'],
    [
      'Date Registered',
      staff.created_at
        ? new Date(staff.created_at).toLocaleDateString()
        : 'N/A'
    ]
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        <div className="p-6 border-b flex justify-between items-center">

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Staff Details
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Employee information and account details
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>

        </div>

        <div className="p-6">

          <div className="flex items-center gap-4 mb-8">

            <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
              {staff.first_name?.charAt(0)}
              {staff.last_name?.charAt(0)}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {staff.first_name} {staff.last_name}
              </h3>

              <p className="text-sm text-gray-500">
                {staff.designation}
              </p>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {details.map(([label, value]) => (

              <div key={label} className="border-b border-gray-100 pb-3">

                <p className="text-xs text-gray-500 mb-1">
                  {label}
                </p>

                <p className="text-sm font-medium text-gray-800">
                  {value}
                </p>

              </div>

            ))}

          </div>

        </div>

        <div className="p-6 border-t flex justify-end gap-3">

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border"
          >
            Close
          </button>

          <button
            onClick={() => onEdit(staff)}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Edit Staff
          </button>

        </div>

      </div>

    </div>
  )
}

export default StaffDetails
