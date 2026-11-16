import React, { useEffect, useState } from 'react'

const StaffAttendance = () => {

  const today = new Date().toLocaleDateString('en-CA')

  const [date, setDate] = useState(today)
  const [staff, setStaff] = useState([])
  const [attendance, setAttendance] = useState({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadAttendance = async () => {
    try {
      setLoading(true)
      setError('')

      const [staffData, attendanceData] = await Promise.all([
        getStaff(),
        getStaffAttendance({ date })
      ])

      setStaff(staffData)

      const records = {}

      attendanceData.forEach(record => {
        records[record.staff] = {
          id: record.id,
          status: record.status,
          check_in: record.check_in || '',
          check_out: record.check_out || '',
          remarks: record.remarks || ''
        }
      })

      staffData.forEach(member => {
        if (!records[member.id]) {
          records[member.id] = {
            status: 'present',
            check_in: '',
            check_out: '',
            remarks: ''
          }
        }
      })

      setAttendance(records)

    } catch (err) {
      setError('Unable to load attendance records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAttendance()
  }, [date])

  const updateRecord = (staffId, field, value) => {
    setAttendance(previous => ({
      ...previous,
      [staffId]: {
        ...previous[staffId],
        [field]: value
      }
    }))
  }

  const activeStaff = staff.filter(
    member => member.is_active
  )

  const countStatus = (status) => {
    return activeStaff.filter(
      member => attendance[member.id]?.status === status
    ).length
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')

      for (const member of activeStaff) {

        const record = attendance[member.id]

        if (!record) continue

        const payload = {
          staff: member.id,
          date,
          status: record.status,
          check_in: record.check_in || null,
          check_out: record.check_out || null,
          remarks: record.remarks
        }

        if (record.id) {
          await updateStaffAttendance(record.id, payload)
        } else {
          await saveStaffAttendance(payload)
        }
      }

      await loadAttendance()

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Unable to save attendance. Some records may already have been saved.'
      )
    } finally {
      setSaving(false)
    }
  }

  const summary = [
    {
      label: 'Present',
      value: countStatus('present'),
      color: 'text-green-600'
    },
    {
      label: 'Absent',
      value: countStatus('absent'),
      color: 'text-red-600'
    },
    {
      label: 'Late',
      value: countStatus('late'),
      color: 'text-orange-600'
    },
    {
      label: 'Excused',
      value: countStatus('excused'),
      color: 'text-blue-600'
    }
  ]

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Staff Attendance
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Manage daily employee attendance.
        </p>
      </div>

      {/* DATE */}

      <div className="bg-white border rounded-xl p-5">

        <label className="block text-sm font-medium mb-2">
          Select Attendance Date
        </label>

        <input
          type="date"
          value={date}
          max={today}
          onChange={e => setDate(e.target.value)}
          className="border rounded-lg px-4 py-3"
        />

      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {summary.map(item => (

          <div
            key={item.label}
            className="bg-white border rounded-xl p-5"
          >
            <p className="text-sm text-gray-500">
              {item.label}
            </p>

            <h2 className={`text-3xl font-bold mt-2 ${item.color}`}>
              {item.value}
            </h2>

          </div>

        ))}

      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* ATTENDANCE REGISTER */}

      <div className="bg-white border rounded-xl overflow-hidden">

        <div className="p-5 border-b flex flex-col sm:flex-row justify-between gap-3">

          <h2 className="font-semibold text-gray-800">
            Daily Attendance Register
          </h2>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>

        </div>

        {loading ? (

          <div className="p-10 text-center text-gray-500">
            Loading attendance...
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left">Staff</th>
                  <th className="p-4 text-left">Staff Number</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Check In</th>
                  <th className="p-4 text-left">Check Out</th>
                  <th className="p-4 text-left">Remarks</th>
                </tr>
              </thead>

              <tbody className="divide-y">

                {activeStaff.map(member => {

                  const record = attendance[member.id] || {}

                  return (
                    <tr key={member.id}>

                      <td className="p-4 font-medium">
                        {member.first_name} {member.last_name}
                      </td>

                      <td className="p-4">
                        {member.staff_number}
                      </td>

                      <td className="p-4">

                        <select
                          value={record.status || 'present'}
                          onChange={e => updateRecord(
                            member.id,
                            'status',
                            e.target.value
                          )}
                          className="border rounded-lg p-2"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                          <option value="excused">Excused</option>
                        </select>

                      </td>

                      <td className="p-4">
                        <input
                          type="time"
                          value={record.check_in || ''}
                          onChange={e => updateRecord(
                            member.id,
                            'check_in',
                            e.target.value
                          )}
                          className="border rounded-lg p-2"
                        />
                      </td>

                      <td className="p-4">
                        <input
                          type="time"
                          value={record.check_out || ''}
                          onChange={e => updateRecord(
                            member.id,
                            'check_out',
                            e.target.value
                          )}
                          className="border rounded-lg p-2"
                        />
                      </td>

                      <td className="p-4">
                        <input
                          type="text"
                          value={record.remarks || ''}
                          onChange={e => updateRecord(
                            member.id,
                            'remarks',
                            e.target.value
                          )}
                          placeholder="Remarks"
                          className="border rounded-lg p-2 w-32"
                        />
                      </td>

                    </tr>
                  )
                })}

              </tbody>

            </table>

            {activeStaff.length === 0 && (
              <p className="p-8 text-center text-gray-500">
                No active staff members available.
              </p>
            )}

          </div>

        )}

      </div>

    </div>
  )
}

export default StaffAttendance
