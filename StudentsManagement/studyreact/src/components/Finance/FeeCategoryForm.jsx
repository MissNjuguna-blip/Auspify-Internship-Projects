
import React, { useEffect, useState } from 'react'

const FeeCategoryForm = ({
  category,
  onSubmit,
  onCancel,
  loading
}) => {

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || ''
      })
    } else {
      setFormData({
        name: '',
        description: ''
      })
    }
  }, [category])

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fee Category Name
        </label>

        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Tuition Fee"
          required
          className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>

        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          placeholder="Enter category description..."
          className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="flex justify-end gap-3">

        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-3 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? 'Saving...'
            : category
              ? 'Update Category'
              : 'Create Category'}
        </button>

      </div>

    </form>
  )
}

export default FeeCategoryForm
