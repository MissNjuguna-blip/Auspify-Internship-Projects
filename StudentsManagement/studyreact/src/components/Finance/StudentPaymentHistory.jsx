
import React, { useEffect, useState } from 'react'
import { getStudentPaymentHistory } from '../context/api/financeApi'

const StudentPaymentHistory = ({ student, onClose }) => {

  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {

    if (!student) return

    const loadHistory = async () => {
      try {
        setLoading(true)
        setError('')

        const data = await getStudentPaymentHistory(student)

        setPayments(
          Array.isArray(data) ? data : data.results || []
        )

      } catch (err) {
        setError(
          err.response?.data?.detail ||
          'Failed to load payment history.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadHistory()

  }, [student])

  const formatCurrency = amount =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(Number(amount || 0))

  const totalPaid = payments.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

        <div className="p-6 border-b flex items-center justify-between">

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Student Payment History
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Student ID: {student}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-800"
          >
            &times;
          </button>

        </div>

        <div className="p-6">

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {loading ? (

            <p className="text-center py-10 text-gray-500">
              Loading payment history...
            </p>

          ) : (

            <>
              <div className="bg-blue-50 rounded-xl p-5 mb-6">

                <p className="text-sm text-blue-700">
                  Total Payments Recorded
                </p>

                <h2 className="text-2xl font-bold text-blue-800 mt-2">
                  {formatCurrency(totalPaid)}
                </h2>

                <p className="text-sm text-blue-600 mt-1">
                  {payments.length} payment transactions
                </p>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Reference</th>
                      <th className="text-right p-3">Amount</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">

                    {payments.length === 0 ? (

                      <tr>
                        <td colSpan="3" className="text-center py-8 text-gray-500">
                          No payments recorded for this student.
                        </td>
                      </tr>

                    ) : (

                      payments.map(item => (

                        <tr key={item.id}>
                          <td className="p-3">
                            {item.payment_date}
                          </td>

                          <td className="p-3">
                            {item.reference_number}
                          </td>

                          <td className="p-3 text-right font-semibold">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>

                      ))

                    )}

                  </tbody>

                </table>

              </div>
            </>
          )}

        </div>

        <div className="p-6 border-t">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 rounded-lg py-3"
          >
            Close
          </button>
        </div>

      </div>

    </div>
  )
}

export default StudentPaymentHistory
