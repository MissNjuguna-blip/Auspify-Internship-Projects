import React, { useState } from 'react'
import { getDailyCollections } from '../context/api/financeApi'
const DailyCollections = () => {

  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [collection, setCollection] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formatCurrency = amount =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(Number(amount || 0))

  const handleSearch = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError('')

      const data = await getDailyCollections(date)

      setCollection(data)

    } catch (err) {
      setCollection(null)
      setError(
        err.response?.data?.error ||
        'Failed to retrieve daily collections.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border rounded-xl p-5">

      <div className="mb-5">
        <h2 className="font-semibold text-gray-800">
          Daily Collections
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          View total fee collections for a particular date.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row gap-3"
      >

        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
          className="flex-1 border rounded-lg px-4 py-3"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'View Collections'}
        </button>

      </form>

      {error && (
        <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {collection && (

        <div className="mt-5 bg-green-50 border border-green-100 rounded-xl p-5">

          <p className="text-sm text-green-700">
            Total Collections on {collection.date}
          </p>

          <h2 className="text-2xl font-bold text-green-800 mt-2">
            {formatCurrency(collection.total_collections)}
          </h2>

        </div>

      )}

    </div>
  )
}

export default DailyCollections
