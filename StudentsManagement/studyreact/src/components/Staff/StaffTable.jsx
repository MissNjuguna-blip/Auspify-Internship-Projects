
import React from 'react'

const StaffTable = ({
  staff,
  loading,
  onEdit,
  onView,
  onDelete,
  onToggleStatus
}) => {

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-10 text-center">
        <p className="text-gray-500">Loading staff members...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

      <div className="overflow-x-auto">

        <table className="w-full text-sm text-left">

          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-4">Staff</th>
              <th className="px-6 py-4">Staff Number</th>
              <th className="px-6 py-4">Designation</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">

            {staff.length === 0 ? (

              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                  No staff members found.
                </td>
              </tr>

            ) : (

              staff.map((member) => (

                <tr key={member.id} className="hover:bg-gray-50">

                  <td className="px-6 py-4">

                    <div className="flex items-center gap-3">

                      <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                        {member.first_name?.charAt(0)}
                        {member.last_name?.charAt(0)}
                      </div>

                      <div>
                        <p className="font-medium text-gray-800">
                          {member.first_name} {member.last_name}
                        </p>

                        <p className="text-xs text-gray-500">
                          {member.email}
                        </p>
                      </div>

                    </div>

                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {member.staff_number}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {member.designation}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {member.phone_number || 'N/A'}
                  </td>

                  <td className="px-6 py-4">

                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>

                  </td>

                  <td className="px-6 py-4">

                    <div className="flex items-center gap-3">

                      <button
                        onClick={() => onView(member)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        View
                      </button>

                      <button
                        onClick={() => onEdit(member)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => onToggleStatus(member)}
                        className="text-orange-600 hover:text-orange-800"
                      >
                        {member.is_active ? 'Disable' : 'Enable'}
                      </button>

                      <button
                        onClick={() => onDelete(member)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  )
}

export default StaffTable
