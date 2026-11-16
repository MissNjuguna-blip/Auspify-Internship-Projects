
import React, { useEffect, useState } from 'react'

const StaffForm = ({ staff, onSubmit, onCancel, loading }) => {

  const initialState = {
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    staff_number: '',
    designation: '',
    employment_date: '',
  }

  const [form, setForm] = useState(initialState)

  useEffect(() => {
    if (staff) {
      setForm({
        username: staff.username || '',
        email: staff.email || '',
        password: '',
        first_name: staff.first_name || '',
        last_name: staff.last_name || '',
        phone_number: staff.phone_number || '',
        staff_number: staff.staff_number || '',
        designation: staff.designation || '',
        employment_date: staff.employment_date || '',
      })
    } else {
      setForm(initialState)
    }
  }, [staff])

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const data = { ...form }

    if (staff) {
      delete data.username
      delete data.password
    }

    onSubmit(data)
  }

  const inputClass = `
    w-full px-4 py-2.5 border border-gray-300
    rounded-lg outline-none text-sm
    focus:ring-2 focus:ring-blue-100
    focus:border-blue-500
  `

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {!staff && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className={inputClass}
                minLength={8}
                required
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            First Name
          </label>
          <input
            type="text"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Last Name
          </label>
          <input
            type="text"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Phone Number
          </label>
          <input
            type="text"
            name="phone_number"
            value={form.phone_number}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Staff Number
          </label>
          <input
            type="text"
            name="staff_number"
            value={form.staff_number}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Designation
          </label>
          <input
            type="text"
            name="designation"
            value={form.designation}
            onChange={handleChange}
            placeholder="e.g. Teacher, Accountant"
            className={inputClass}
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">
            Employment Date
          </label>
          <input
            type="date"
            name="employment_date"
            value={form.employment_date}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">

        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? 'Saving...'
            : staff
              ? 'Update Staff'
              : 'Register Staff'
          }
        </button>

      </div>

    </form>
  )
}

export default StaffForm
