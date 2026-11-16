
import React from 'react'

const StaffStats = ({ staff }) => {

  const totalStaff = staff.length

  const activeStaff = staff.filter(
    item => item.is_active
  ).length

  const inactiveStaff = staff.filter(
    item => !item.is_active
  ).length

  const designations = new Set(
    staff.map(item => item.designation)
  ).size

  const stats = [
    {
      title: 'Total Staff',
      value: totalStaff,
      color: 'blue',
      icon: '👥'
    },
    {
      title: 'Active Staff',
      value: activeStaff,
      color: 'green',
      icon: '✓'
    },
    {
      title: 'Inactive Staff',
      value: inactiveStaff,
      color: 'red',
      icon: '⊗'
    },
    {
      title: 'Designations',
      value: designations,
      color: 'purple',
      icon: '▦'
    }
  ]

  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

      {stats.map((item, index) => (

        <div
          key={index}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
        >

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                {item.title}
              </p>

              <h2 className="text-3xl font-bold text-gray-800 mt-2">
                {item.value}
              </h2>
            </div>

            <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-xl ${colors[item.color]}`}>
              {item.icon}
            </div>

          </div>

        </div>

      ))}

    </div>
  )
}

export default StaffStats
