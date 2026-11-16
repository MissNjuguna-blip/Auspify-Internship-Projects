import React, { useEffect, useState } from 'react'
import {
  getStaff,
  getStaffSalaries,
  getStaffPayroll,
  saveStaffSalary,
  generateStaffPayroll,
  updatePayrollStatus
} from '../context/api/staffApi'

const StaffFinance = () => {

  const [staff, setStaff] = useState([])
  const [salaries, setSalaries] = useState([])
  const [payroll, setPayroll] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  const [period, setPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  })

  const [form, setForm] = useState({
    staff: '',
    basic_salary: '',
    allowances: 0,
    deductions: 0,
    currency: 'KES'
  })

  const loadFinance = async () => {
    try {
      setLoading(true)
      setError('')

      const [staffData, salaryData, payrollData] =
        await Promise.all([
          getStaff(),
          getStaffSalaries(),
          getStaffPayroll(period)
        ])

      setStaff(staffData)
      setSalaries(salaryData)
      setPayroll(payrollData)

    } catch (err) {
      setError('Unable to load finance information.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFinance()
  }, [period.month, period.year])

  const formatMoney = value => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(Number(value || 0))
  }

  const totals = {
    total: payroll.reduce(
      (sum, item) => sum + Number(item.net_salary),
      0
    ),

    paid: payroll.filter(
      item => item.status === 'paid'
    ).reduce(
      (sum, item) => sum + Number(item.net_salary),
      0
    ),

    pending: payroll.filter(
      item => item.status === 'pending'
    ).reduce(
      (sum, item) => sum + Number(item.net_salary),
      0
    )
  }

  const handleSalarySubmit = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError('')

      await saveStaffSalary({
        ...form,
        staff: Number(form.staff),
        basic_salary: Number(form.basic_salary),
        allowances: Number(form.allowances),
        deductions: Number(form.deductions)
      })

      setShowModal(false)

      setForm({
        staff: '',
        basic_salary: '',
        allowances: 0,
        deductions: 0,
        currency: 'KES'
      })

      await loadFinance()

    } catch (err) {
      setError(
        JSON.stringify(
          err.response?.data || 'Unable to save salary.'
        )
      )
    } finally {
      setSaving(false)
    }
  }

  const handleGeneratePayroll = async () => {

    const confirmed = window.confirm(
      `Generate payroll for ${period.month}/${period.year}?`
    )

    if (!confirmed) return

    try {
      setSaving(true)
      setError('')

      await generateStaffPayroll(period)

      await loadFinance()

    } catch (err) {
      setError(
        JSON.stringify(
          err.response?.data || 'Unable to generate payroll.'
        )
      )
    } finally {
      setSaving(false)
    }
  }

  const handleMarkPaid = async (item) => {

    const confirmed = window.confirm(
      'Confirm that this salary has actually been paid?'
    )

    if (!confirmed) return

    try {
      await updatePayrollStatus(item.id, {
        status: 'paid',
        payment_date: new Date().toLocaleDateString('en-CA')
      })

      await loadFinance()

    } catch (err) {
      setError('Unable to update payroll status.')
    }
  }

  const getStaffName = (staffId) => {
    const member = staff.find(
      item => item.id === staffId
    )

    return member
      ? `${member.first_name} ${member.last_name}`
      : `Staff #${staffId}`
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Staff Finance
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage staff salaries and payroll.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-5 py-3 rounded-lg"
        >
          + Configure Salary
        </button>

      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* SUMMARY */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {[
          {
            title: 'Total Payroll',
            value: totals.total,
            color: 'text-blue-600'
          },
          {
            title: 'Paid Salaries',
            value: totals.paid,
            color: 'text-green-600'
          },
          {
            title: 'Pending Salaries',
            value: totals.pending,
            color: 'text-orange-600'
          }
        ].map(item => (

          <div
            key={item.title}
            className="bg-white border rounded-xl p-5"
          >
            <p className="text-sm text-gray-500">
              {item.title}
            </p>

            <h2 className={`text-2xl font-bold mt-3 ${item.color}`}>
              {formatMoney(item.value)}
            </h2>

          </div>

        ))}

      </div>

      {/* PERIOD */}

      <div className="bg-white border rounded-xl p-5 flex flex-wrap justify-between items-end gap-4">

        <div className="flex gap-3">

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Month
            </label>

            <select
              value={period.month}
              onChange={e => setPeriod({
                ...period,
                month: Number(e.target.value)
              })}
              className="border rounded-lg p-3"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleString('en', {
                    month: 'long'
                  })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Year
            </label>

            <input
              type="number"
              value={period.year}
              onChange={e => setPeriod({
                ...period,
                year: Number(e.target.value)
              })}
              className="border rounded-lg p-3 w-28"
            />
          </div>

        </div>

        <button
          onClick={handleGeneratePayroll}
          disabled={saving}
          className="bg-green-600 text-white px-5 py-3 rounded-lg disabled:opacity-50"
        >
          {saving ? 'Processing...' : 'Generate Payroll'}
        </button>

      </div>

      {/* PAYROLL TABLE */}

      <div className="bg-white border rounded-xl overflow-hidden">

        <div className="p-5 border-b">
          <h2 className="font-semibold text-gray-800">
            Monthly Payroll
          </h2>
        </div>

        {loading ? (

          <div className="p-10 text-center text-gray-500">
            Loading payroll...
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm text-left">

              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-4">Staff</th>
                  <th className="p-4">Basic Salary</th>
                  <th className="p-4">Allowances</th>
                  <th className="p-4">Deductions</th>
                  <th className="p-4">Net Salary</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y">

                {payroll.map(item => (

                  <tr key={item.id}>

                    <td className="p-4 font-medium">
                      {getStaffName(item.staff)}
                    </td>

                    <td className="p-4">
                      {formatMoney(item.basic_salary)}
                    </td>

                    <td className="p-4">
                      {formatMoney(item.allowances)}
                    </td>

                    <td className="p-4">
                      {formatMoney(item.deductions)}
                    </td>

                    <td className="p-4 font-semibold">
                      {formatMoney(item.net_salary)}
                    </td>

                    <td className="p-4">

                      <span className={`px-3 py-1 rounded-full text-xs ${
                        item.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : item.status === 'pending'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.status}
                      </span>

                    </td>

                    <td className="p-4">

                      {item.status === 'pending' && (
                        <button
                          onClick={() => handleMarkPaid(item)}
                          className="text-blue-600 font-medium hover:underline"
                        >
                          Mark Paid
                        </button>
                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

            {payroll.length === 0 && (
              <p className="text-center text-gray-500 p-10">
                No payroll records found for this period.
              </p>
            )}

          </div>

        )}

      </div>

      {/* SALARY MODAL */}

      {showModal && (

        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <form
            onSubmit={handleSalarySubmit}
            className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >

            <h2 className="text-xl font-bold">
              Configure Staff Salary
            </h2>

            <div>
              <label className="block text-sm mb-1">
                Staff Member
              </label>

              <select
                required
                value={form.staff}
                onChange={e => setForm({
                  ...form,
                  staff: e.target.value
                })}
                className="w-full border rounded-lg p-3"
              >
                <option value="">Select Staff</option>

                {staff.filter(item => item.is_active).map(item => (
                  <option key={item.id} value={item.id}>
                    {item.first_name} {item.last_name}
                  </option>
                ))}

              </select>
            </div>

            {[
              ['basic_salary', 'Basic Salary'],
              ['allowances', 'Allowances'],
              ['deductions', 'Deductions']
            ].map(([name, label]) => (

              <div key={name}>
                <label className="block text-sm mb-1">
                  {label}
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required={name === 'basic_salary'}
                  value={form[name]}
                  onChange={e => setForm({
                    ...form,
                    [name]: e.target.value
                  })}
                  className="w-full border rounded-lg p-3"
                />
              </div>

            ))}

            <div className="flex justify-end gap-3 pt-4">

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="border px-5 py-2 rounded-lg"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg"
              >
                {saving ? 'Saving...' : 'Save Salary'}
              </button>

            </div>

          </form>

        </div>

      )}

    </div>
  )
}

export default StaffFinance
