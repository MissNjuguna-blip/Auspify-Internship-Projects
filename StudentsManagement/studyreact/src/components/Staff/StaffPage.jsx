import React, { useEffect, useState } from 'react'

import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  updateStaffStatus
} from '../../api/staffApi'

import StaffForm from './StaffForm'
import StaffTable from './StaffTable'
import StaffStats from './StaffStats'
import StaffDetails from './StaffDetails'
const StaffPage = () => {

  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [designation, setDesignation] = useState('all')

  const [showForm, setShowForm] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [viewStaff, setViewStaff] = useState(null)

  const [error, setError] = useState('')

  const loadStaff = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getStaff()
      setStaff(data)

    } catch (err) {
      setError(
        err.response?.data?.detail || 'Failed to load staff.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [])

  const designations = [
    ...new Set(staff.map(item => item.designation))
  ]

  const filteredStaff = staff.filter(member => {

    const name = `${member.first_name} ${member.last_name}`.toLowerCase()

    const matchesSearch =
      name.includes(search.toLowerCase()) ||
      member.staff_number.toLowerCase().includes(search.toLowerCase())

    const matchesDesignation =
      designation === 'all' ||
      member.designation === designation

    return matchesSearch && matchesDesignation
  })

  const handleCreate = () => {
    setSelectedStaff(null)
    setShowForm(true)
  }

  const handleEdit = (member) => {
    setSelectedStaff(member)
    setViewStaff(null)
    setShowForm(true)
  }

  const handleSubmit = async (data) => {
    try {
      setSaving(true)
      setError('')

      if (selectedStaff) {
        await updateStaff(selectedStaff.id, data)
      } else {
        await createStaff(data)
      }

      setShowForm(false)
      setSelectedStaff(null)

      await loadStaff()

    } catch (err) {
      setError(
        JSON.stringify(
          err.response?.data || 'Failed to save staff.'
        )
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (member) => {

    const confirmed = window.confirm(
      `Are you sure you want to delete ${member.first_name} ${member.last_name}? This also deletes their user account.`
    )

    if (!confirmed) return

    try {
      await deleteStaff(member.id)
      await loadStaff()
    } catch (err) {
      setError('Failed to delete staff.')
    }
  }

  const handleToggleStatus = async (member) => {

    try {
      await updateStaffStatus(
        member.id,
        !member.is_active
      )

      await loadStaff()

    } catch (err) {
      setError('Failed to update staff status.')
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Staff Management
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage employees and staff information.
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700"
        >
          + Add Staff
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* STATISTICS */}

      <StaffStats staff={staff} />

      {/* SEARCH */}

      <div className="bg-white border rounded-xl p-4 flex flex-col md:flex-row gap-3">

        <input
          type="text"
          placeholder="Search by name or staff number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100"
        />

        <select
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          className="border rounded-lg px-4 py-3"
        >
          <option value="all">All Designations</option>

          {designations.map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}

        </select>

      </div>

      {/* TABLE */}

      <StaffTable
        staff={filteredStaff}
        loading={loading}
        onEdit={handleEdit}
        onView={setViewStaff}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />

      {/* FORM MODAL */}

      {showForm && (

        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">

            <h2 className="text-xl font-bold mb-6">
              {selectedStaff ? 'Edit Staff' : 'Register Staff'}
            </h2>

            <StaffForm
              staff={selectedStaff}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false)
                setSelectedStaff(null)
              }}
              loading={saving}
            />

          </div>

        </div>

      )}

      {/* DETAILS MODAL */}

      {viewStaff && (

        <StaffDetails
          staff={viewStaff}
          onClose={() => setViewStaff(null)}
          onEdit={handleEdit}
        />

      )}

    </div>
  )
}

export default StaffPage
