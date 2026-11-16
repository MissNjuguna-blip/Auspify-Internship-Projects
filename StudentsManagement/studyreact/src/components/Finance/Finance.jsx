import React, { useEffect, useState } from 'react'

import {
  getFeeCategories,
  createFeeCategory,
  updateFeeCategory,
  deleteFeeCategory,
  getPayments,
  recordPayment,
  getFinanceSummary
} from '../context/api/financeApi'
import api from '../context/api/api'
import FinanceStats from './FinanceStats'
import FeeCategories from './FeeCategories'
import FeeCategoryForm from './FeeCategoryForm'
import PaymentForm from './PaymentForm'
import PaymentsTable from './PaymentsTable'
import StudentPaymentHistory from './StudentPaymentHistory'
import DailyCollections from './DailyCollections'

const Finance = () => {

  const [categories, setCategories] = useState([])
  const [payments, setPayments] = useState([])
  const [students, setStudents] = useState([])
  const [summary, setSummary] = useState({
    total_collections: 0,
    total_payments: 0
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')

  const [activeTab, setActiveTab] = useState('payments')

  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)

  // ==================================================
  // LOAD FINANCE DATA
  // ==================================================

  const loadFinanceData = async () => {

    try {
      setLoading(true)
      setError('')

      const [
        categoryData,
        paymentData,
        summaryData,
        studentResponse
      ] = await Promise.all([
        getFeeCategories(),
        getPayments(),
        getFinanceSummary(),
        api.get('/students/')
      ])

      setCategories(
        Array.isArray(categoryData)
          ? categoryData
          : categoryData.results || []
      )

      setPayments(
        Array.isArray(paymentData)
          ? paymentData
          : paymentData.results || []
      )

      setSummary(summaryData)

      const studentData = studentResponse.data

      setStudents(
        Array.isArray(studentData)
          ? studentData
          : studentData.results || []
      )

    } catch (err) {

      setError(
        err.response?.data?.detail ||
        'Failed to load finance information.'
      )

    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFinanceData()
  }, [])

  // ==================================================
  // PAYMENT MANAGEMENT
  // ==================================================

  const handleRecordPayment = async (data) => {

    try {
      setSaving(true)
      setError('')

      await recordPayment(data)

      setShowPaymentForm(false)

      await loadFinanceData()

    } catch (err) {

      setError(
        JSON.stringify(
          err.response?.data ||
          'Failed to record payment.'
        )
      )

    } finally {
      setSaving(false)
    }
  }

  // ==================================================
  // CATEGORY MANAGEMENT
  // ==================================================

  const handleCreateCategory = () => {
    setSelectedCategory(null)
    setShowCategoryForm(true)
  }

  const handleEditCategory = (category) => {
    setSelectedCategory(category)
    setShowCategoryForm(true)
  }

  const handleSaveCategory = async (data) => {

    try {
      setSaving(true)
      setError('')

      if (selectedCategory) {

        await updateFeeCategory(
          selectedCategory.id,
          data
        )

      } else {

        await createFeeCategory(data)

      }

      setShowCategoryForm(false)
      setSelectedCategory(null)

      await loadFinanceData()

    } catch (err) {

      setError(
        JSON.stringify(
          err.response?.data ||
          'Failed to save fee category.'
        )
      )

    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (category) => {

    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    )

    if (!confirmed) return

    try {
      setError('')

      await deleteFeeCategory(category.id)

      await loadFinanceData()

    } catch (err) {

      setError(
        err.response?.data?.detail ||
        'Failed to delete fee category.'
      )

    }
  }

  // ==================================================
  // STUDENT PAYMENT HISTORY
  // ==================================================

  const handleViewHistory = (studentId) => {
    setSelectedStudent(studentId)
  }

  // ==================================================
  // TAB NAVIGATION
  // ==================================================

  const tabs = [
    {
      id: 'payments',
      label: 'Payments'
    },
    {
      id: 'categories',
      label: 'Fee Categories'
    },
    {
      id: 'collections',
      label: 'Daily Collections'
    }
  ]

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            School Finance
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage fee categories, student payments and collections.
          </p>
        </div>

        <div className="flex gap-3">

          <button
            onClick={loadFinanceData}
            disabled={loading}
            className="border px-4 py-3 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Refresh
          </button>

          <button
            onClick={() => setShowPaymentForm(true)}
            className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700"
          >
            + Record Payment
          </button>

        </div>

      </div>

      {/* ERROR */}

      {error && (

        <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-lg text-sm flex justify-between gap-3">

          <span className="break-all">
            {error}
          </span>

          <button
            onClick={() => setError('')}
            className="font-bold"
          >
            &times;
          </button>

        </div>

      )}

      {/* STATISTICS */}

      <FinanceStats
        summary={summary}
        loading={loading}
      />

      {/* NAVIGATION */}

      <div className="bg-white border rounded-xl p-2 flex flex-wrap gap-2">

        {tabs.map(tab => (

          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>

        ))}

      </div>

      {/* PAYMENTS */}

      {activeTab === 'payments' && (

        <div className="space-y-5">

          <PaymentsTable
            payments={payments}
            loading={loading}
            onViewHistory={handleViewHistory}
          />

        </div>

      )}

      {/* CATEGORIES */}

      {activeTab === 'categories' && (

        <div className="space-y-5">

          <div className="flex justify-between items-center">

            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Fee Management
              </h2>

              <p className="text-sm text-gray-500">
                Create and manage school fee categories.
              </p>
            </div>

            <button
              onClick={handleCreateCategory}
              className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
            >
              + Add Category
            </button>

          </div>

          <FeeCategories
            categories={categories}
            loading={loading}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />

        </div>

      )}

      {/* DAILY COLLECTIONS */}

      {activeTab === 'collections' && (
        <DailyCollections />
      )}

      {/* PAYMENT FORM MODAL */}

      {showPaymentForm && (

        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">

            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Record Student Payment
            </h2>

            <PaymentForm
              students={students}
              onSubmit={handleRecordPayment}
              onCancel={() => setShowPaymentForm(false)}
              loading={saving}
            />

          </div>

        </div>

      )}

      {/* CATEGORY FORM MODAL */}

      {showCategoryForm && (

        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">

            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {selectedCategory
                ? 'Edit Fee Category'
                : 'Create Fee Category'}
            </h2>

            <FeeCategoryForm
              category={selectedCategory}
              onSubmit={handleSaveCategory}
              onCancel={() => {
                setShowCategoryForm(false)
                setSelectedCategory(null)
              }}
              loading={saving}
            />

          </div>

        </div>

      )}

      {/* STUDENT PAYMENT HISTORY */}

      {selectedStudent && (

        <StudentPaymentHistory
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />

      )}

    </div>
  )
}

export default Finance
