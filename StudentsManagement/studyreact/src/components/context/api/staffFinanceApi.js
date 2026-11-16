
import api from './api'

// Get all staff payroll records
export const getStaffFinance = async () => {
  const response = await api.get('/staff/finance/')
  return response.data
}

// Create payroll record
export const createPayroll = async (data) => {
  const response = await api.post('/staff/finance/', data)
  return response.data
}

// Update payroll record
export const updatePayroll = async (id, data) => {
  const response = await api.patch(`/staff/finance/${id}/`, data)
  return response.data
}

// Delete payroll record
export const deletePayroll = async (id) => {
  const response = await api.delete(`/staff/finance/${id}/`)
  return response.data
}

// Record salary payment
export const paySalary = async (id, data = {}) => {
  const response = await api.post(
    `/staff/finance/${id}/pay/`,
    data
  )
  return response.data
}
