
import api from './api'

// STAFF
export const getStaff = async () => {
  const response = await api.get('/staff/')
  return response.data
}

export const getStaffById = async (id) => {
  const response = await api.get(`/staff/${id}/`)
  return response.data
}

export const createStaff = async (data) => {
  const response = await api.post('/staff/', data)
  return response.data
}

export const updateStaff = async (id, data) => {
  const response = await api.patch(`/staff/${id}/`, data)
  return response.data
}

export const deleteStaff = async (id) => {
  const response = await api.delete(`/staff/${id}/`)
  return response.data
}

export const updateStaffStatus = async (id, is_active) => {
  const response = await api.patch(`/staff/${id}/status/`, {
    is_active
  })
  return response.data
}

export const searchStaff = async (params) => {
  const response = await api.get('/staff/search/', { params })
  return response.data
}

// ATTENDANCE
export const getStaffAttendance = async (params) => {
  const response = await api.get('/staff-attendance/', { params })
  return response.data
}

export const saveStaffAttendance = async (data) => {
  const response = await api.post('/staff-attendance/', data)
  return response.data
}

export const updateStaffAttendance = async (id, data) => {
  const response = await api.patch(`/staff-attendance/${id}/`, data)
  return response.data
}

// FINANCE
export const getStaffSalaries = async () => {
  const response = await api.get('/staff-finance/salaries/')
  return response.data
}

export const saveStaffSalary = async (data) => {
  const response = await api.post('/staff-finance/salaries/', data)
  return response.data
}

export const getStaffPayroll = async (params) => {
  const response = await api.get('/staff-finance/payroll/', { params })
  return response.data
}

export const generateStaffPayroll = async (data) => {
  const response = await api.post('/staff-finance/payroll/', data)
  return response.data
}

export const updatePayrollStatus = async (id, data) => {
  const response = await api.patch(`/staff-finance/payroll/${id}/`, data)
  return response.data
}
