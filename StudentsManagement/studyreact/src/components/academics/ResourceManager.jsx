
import React, { useEffect, useState, useCallback } from "react";

const ResourceManager = ({
  title,
  description,
  service,
  fields = [],
  columns = [],
  emptyMessage = "No records found.",
}) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({});

  const getList = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await service.list();
      const data = response.data;

      setRecords(
        Array.isArray(data) ? data : data.results || []
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load records."
      );
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    getList();
  }, [getList]);

  // INITIAL FORM VALUES
  const openCreate = () => {
    const initial = {};

    fields.forEach((field) => {
      initial[field.name] =
        field.defaultValue ??
        (field.type === "checkbox" ? false : "");
    });

    setForm(initial);
    setEditing(null);
    setError("");
    setShowForm(true);
  };

  // EDIT EXISTING RECORD
  const openEdit = (record) => {
    const initial = {};

    fields.forEach((field) => {
      const value = record[field.name];

      if (field.type === "checkbox") {
        initial[field.name] = Boolean(value);
      } else {
        initial[field.name] =
          value && typeof value === "object"
            ? value.id ?? ""
            : value ?? "";
      }
    });

    setForm(initial);
    setEditing(record);
    setError("");
    setShowForm(true);
  };

  // FORM SUBMISSION
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      // Ensure checkbox values are actual booleans
      const payload = { ...form };

      fields.forEach((field) => {
        if (field.type === "checkbox") {
          payload[field.name] = Boolean(
            form[field.name]
          );
        }
      });

      if (editing) {
        await service.update(editing.id, payload);
      } else {
        await service.create(payload);
      }

      setShowForm(false);
      setEditing(null);

      await getList();
    } catch (err) {
      const data = err.response?.data;

      setError(
        typeof data === "object"
          ? JSON.stringify(data)
          : data || "Unable to save record."
      );
    } finally {
      setSaving(false);
    }
  };

  // DELETE RECORD
  const handleDelete = async (record) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this record?"
      )
    ) {
      return;
    }

    try {
      setError("");
      await service.remove(record.id);
      await getList();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to delete record."
      );
    }
  };

  // HANDLE INPUT CHANGES
  const handleChange = (name, value) => {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {title}
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {description}
          </p>
        </div>

        <button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg"
        >
          + Add {title.replace(/s$/, "")}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg break-words">
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-hidden">

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading {title.toLowerCase()}...
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-sm text-left">

              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="p-4">
                      {column.label}
                    </th>
                  ))}

                  <th className="p-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">

                {records.map((record) => (
                  <tr key={record.id}>

                    {columns.map((column) => (
                      <td key={column.key} className="p-4">
                        {column.render
                          ? column.render(record)
                          : record[column.key] ?? "—"}
                      </td>
                    ))}

                    <td className="p-4">
                      <div className="flex justify-end gap-3">

                        <button
                          onClick={() => openEdit(record)}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(record)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}

              </tbody>

            </table>

            {records.length === 0 && (
              <p className="text-center text-gray-500 p-10">
                {emptyMessage}
              </p>
            )}

          </div>
        )}

      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4"
          >

            <h3 className="text-xl font-bold text-gray-800">
              {editing ? "Edit" : "Create"} {title}
            </h3>

            {fields.map((field) => (
              <div key={field.name}>

                {field.type === "checkbox" ? (

                  <label className="flex items-center gap-3 cursor-pointer">

                    <input
                      type="checkbox"
                      name={field.name}
                      checked={Boolean(form[field.name])}
                      onChange={(e) =>
                        handleChange(
                          field.name,
                          e.target.checked
                        )
                      }
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    <span className="text-sm font-medium text-gray-700">
                      {field.label}
                    </span>

                  </label>

                ) : (

                  <>
                    <label className="block text-sm font-medium mb-2">
                      {field.label}
                    </label>

                    {field.type === "select" ? (

                      <select
                        required={field.required !== false}
                        value={form[field.name] ?? ""}
                        onChange={(e) =>
                          handleChange(
                            field.name,
                            e.target.value
                          )
                        }
                        className="w-full border rounded-lg p-3"
                      >
                        <option value="">
                          Select {field.label}
                        </option>

                        {field.options?.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>

                    ) : (

                      <input
                        type={field.type || "text"}
                        required={field.required !== false}
                        placeholder={field.placeholder || ""}
                        value={form[field.name] ?? ""}
                        onChange={(e) =>
                          handleChange(
                            field.name,
                            e.target.value
                          )
                        }
                        className="w-full border rounded-lg p-3"
                      />

                    )}
                  </>

                )}

              </div>
            ))}

            <div className="flex justify-end gap-3 pt-4">

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border px-5 py-2 rounded-lg"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>

            </div>

          </form>
        </div>
      )}

    </div>
  );
};

export default ResourceManager;
