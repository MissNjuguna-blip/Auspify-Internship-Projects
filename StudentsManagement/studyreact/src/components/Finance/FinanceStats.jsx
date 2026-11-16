
import React from 'react'

const FinanceStats = ({ summary, loading }) => {

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(Number(amount || 0))
  }

  const stats = [
    {
      title: 'Total Collections',
      value: formatCurrency(summary?.total_collections),
      icon: '💰',
      color: 'bg-blue-50 text-blue-700'
    },
    {
      title: 'Total Payments',
      value: summary?.total_payments ?? 0,
      icon: '🧾',
      color: 'bg-green-50 text-green-700'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

      {stats.map((item, index) => (

        <div
          key={index}
          className="bg-white border rounded-xl p-5 shadow-sm"
        >

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                {item.title}
              </p>

              <h2 className="text-2xl font-bold text-gray-800 mt-2">
                {loading ? '...' : item.value}
              </h2>
            </div>

            <div className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center text-xl`}>
              {item.icon}
            </div>

          </div>

        </div>

      ))}

    </div>
  )
}

export default FinanceStats
