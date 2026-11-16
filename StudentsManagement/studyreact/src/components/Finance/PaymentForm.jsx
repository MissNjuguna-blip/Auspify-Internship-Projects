
import React, { useState } from 'react'

const PaymentForm = ({
  students,
  onSubmit,
  onCancel,
  loading
}) => {

  const [formData, setFormData] = useState({
    student: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (Number(formData.amount) <= 0) {
      return
    }

    onSubmit({
      ...formData,
      student: Number(formData.student),
      amount: Number(formData.amount),
      reference_number: formData.reference_number.trim()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* STUDENT */}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Student
        </label>

        <select
          name="student"
          value={formData.student}
          onChange={handleChange}
          required
          className="w-full border rounded-lg px-4 py-3"
        >
          <option value="">Choose student</option>

          {students.map(student => (

            <option key={student.id} value={student.id}>
              {student.first_name} {student.last_name} - {student.admission_number}
            </option>

          ))}

        </select>
      </div>

      {/* AMOUNT */}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Amount (KES)
        </label>

        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          min="0.01"
          step="0.01"
          required
          placeholder="Enter amount"
          className="w-full border rounded-lg px-4 py-3"
        />
      </div>

      {/* PAYMENT DATE */}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Date
        </label>

        <input
          type="date"
          name="payment_date"
          value={formData.payment_date}
          onChange={handleChange}
          required
          className="w-full border rounded-lg px-4 py-3"
        />
      </div>

      {/* REFERENCE */}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Reference Number
        </label>

        <input
          type="text"
          name="reference_number"
          value={formData.reference_number}
          onChange={handleChange}
          required
          placeholder="e.g. MPESA123456"
          className="w-full border rounded-lg px-4 py-3"
        />
      </div>

      {/* BUTTONS */}

      <div className="flex justify-end gap-3">

        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-3 border rounded-lg"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading || !formData.student || Number(formData.amount) <= 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Recording...' : 'Record Payment'}
        </button>

      </div>

    </form>
  )
}

export default PaymentForm
