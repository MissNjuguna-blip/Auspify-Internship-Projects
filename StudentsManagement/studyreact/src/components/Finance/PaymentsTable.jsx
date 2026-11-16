
import React from 'react'

const PaymentsTable = ({ payments, loading, onViewHistory }) => {

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(Number(amount || 0))

  if (loading) {
    return (
      <div className="bg-white border rounded-xl p-10 text-center text-gray-500">
        Loading payments...
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden">

      <div className="p-5 border-b">
        <h2 className="font-semibold text-gray-800">
          Student Fee Payments
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          All recorded student fee transactions.
        </p>
      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-5 py-4">Student</th>
              <th className="text-left px-5 py-4">Admission Number</th>
              <th className="text-left px-5 py-4">Amount</th>
              <th className="text-left px-5 py-4">Payment Date</th>
              <th className="text-left px-5 py-4">Reference</th>
              <th className="text-left px-5 py-4">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y">

            {payments.length === 0 ? (

              <tr>
                <td colSpan="6" className="text-center py-12 text-gray-500">
                  No payment records found.
                </td>
              </tr>

            ) : (

              payments.map(payment => (

                <tr key={payment.id} className="hover:bg-gray-50">

                  <td className="px-5 py-4 font-medium text-gray-800">
                    {payment.student_name}
                  </td>

                  <td className="px-5 py-4">
                    {payment.admission_number}
                  </td>

                  <td className="px-5 py-4 font-semibold text-gray-800 whitespace-nowrap">
                    {formatCurrency(payment.amount)}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    {payment.payment_date}
                  </td>

                  <td className="px-5 py-4">
                    {payment.reference_number}
                  </td>

                  <td className="px-5 py-4">
                    <button
                      onClick={() => onViewHistory(payment.student)}
                      className="text-blue-600 hover:underline"
                    >
                      History
                    </button>
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

export default PaymentsTable
