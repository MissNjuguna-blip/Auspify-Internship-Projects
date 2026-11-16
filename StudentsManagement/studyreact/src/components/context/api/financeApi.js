
import api from './api'

// ==================================================
// FEE CATEGORIES
// ==================================================

export const getFeeCategories = async () => {
  const response = await api.get('/finance/categories/')
  return response.data
}

export const createFeeCategory = async (data) => {
  const response = await api.post('/finance/categories/', data)
  return response.data
}

export const updateFeeCategory = async (id, data) => {
  const response = await api.patch(`/finance/categories/${id}/`, data)
  return response.data
}

export const deleteFeeCategory = async (id) => {
  const response = await api.delete(`/finance/categories/${id}/`)
  return response.data
}

// ==================================================
// STUDENT PAYMENTS
// ==================================================

export const getPayments = async () => {
  const response = await api.get('/finance/payments/')
  return response.data
}

export const recordPayment = async (data) => {
  const response = await api.post('/finance/payments/', data)
  return response.data
}

// ==================================================
// STUDENT PAYMENT HISTORY
// ==================================================

export const getStudentPaymentHistory = async (studentId) => {
  const response = await api.get(
    `/finance/students/${studentId}/payments/`
  )
  return response.data
}

// ==================================================
// FINANCE SUMMARY
// ==================================================

export const getFinanceSummary = async () => {
  const response = await api.get('/finance/summary/')
  return response.data
}

// ==================================================
// DAILY COLLECTIONS
// ==================================================

export const getDailyCollections = async (date) => {
  const response = await api.get(
    `/finance/collections/daily/?date=${date}`
  )
  return response.data
}
