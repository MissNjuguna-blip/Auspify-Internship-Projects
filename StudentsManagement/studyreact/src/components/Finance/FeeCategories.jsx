
import React from 'react'

const FeeCategories = ({
  categories,
  loading,
  onEdit,
  onDelete
}) => {

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading fee categories...
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden">

      <div className="p-5 border-b">
        <h2 className="font-semibold text-gray-800">
          Fee Categories
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Manage the types of fees collected by the school.
        </p>
      </div>

      <div className="divide-y">

        {categories.length === 0 ? (

          <div className="p-10 text-center text-gray-500">
            No fee categories created yet.
          </div>

        ) : (

          categories.map(category => (

            <div
              key={category.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50"
            >

              <div>
                <h3 className="font-medium text-gray-800">
                  {category.name}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  {category.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex gap-4">

                <button
                  onClick={() => onEdit(category)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Edit
                </button>

                <button
                  onClick={() => onDelete(category)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>

              </div>

            </div>

          ))

        )}

      </div>

    </div>
  )
}

export default FeeCategories
