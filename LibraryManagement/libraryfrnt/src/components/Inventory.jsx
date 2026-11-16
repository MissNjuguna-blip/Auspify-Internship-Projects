import React, { useState, useEffect } from "react";
import api from "./context/api/api";


const INITIAL_COPY_FORM = {
  book: "",
  shelf: "",
  barcode: "",
  status: "AVAILABLE",
  condition: "GOOD",
  acquisition_date: new Date().toISOString().split("T")[0],
  notes: "",
};

const INITIAL_SHELF_FORM = {
  name: "",
  location: "",
  description: "",
};

const Inventory = () => {
  const [activeTab, setActiveTab] = useState("copies"); // "copies" | "shelves" | "books" | "statistics"
  
  // Data States
  const [copies, setCopies] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [books, setBooks] = useState([]);
  const [statistics, setStatistics] = useState(null);

  // Loading and Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [shelfFilter, setShelfFilter] = useState("");

  // Modal States
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isShelfModalOpen, setIsShelfModalOpen] = useState(false);
  const [editingCopy, setEditingCopy] = useState(null);
  const [editingShelf, setEditingShelf] = useState(null);

  // Form States
  const [copyForm, setCopyForm] = useState(INITIAL_COPY_FORM);
  const [shelfForm, setShelfForm] = useState(INITIAL_SHELF_FORM);

  // Fetch Data functions
  const fetchCopies = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (conditionFilter) params.condition = conditionFilter;
      if (shelfFilter) params.shelf = shelfFilter;

      const res = await api.get("inventory/copies/", { params });
      setCopies(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to load book copies", err);
      setError("Failed to fetch inventory copies.");
    } finally {
      setLoading(false);
    }
  };

  const fetchShelves = async () => {
    setLoading(true);
    try {
      const params = searchTerm ? { search: searchTerm } : {};
      const res = await api.get("inventory/shelves/", { params });
      setShelves(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to load shelves", err);
      setError("Failed to fetch shelves.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = searchTerm ? { search: searchTerm } : {};
      const res = await api.get("inventory/books/", { params });
      setBooks(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to load books", err);
      setError("Failed to fetch book catalog lookup.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const res = await api.get("inventory/copies/statistics/");
      setStatistics(res.data);
    } catch (err) {
      console.error("Failed to load statistics", err);
      setError("Failed to fetch inventory statistics.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger data fetch on tab or filter change
  useEffect(() => {
    setError(null);
    const delay = setTimeout(() => {
      if (activeTab === "copies") fetchCopies();
      else if (activeTab === "shelves") fetchShelves();
      else if (activeTab === "books") fetchBooks();
      else if (activeTab === "statistics") fetchStatistics();
    }, 300);

    return () => clearTimeout(delay);
  }, [activeTab, searchTerm, statusFilter, conditionFilter, shelfFilter]);

  // Also load books and shelves list once for the Copy dropdown selectors
  useEffect(() => {
    api.get("inventory/books/").then((res) => setBooks(res.data.results || res.data)).catch(() => {});
    api.get("inventory/shelves/").then((res) => setShelves(res.data.results || res.data)).catch(() => {});
  }, []);

  // Handle Copy Submit (Create / Edit)
  const handleCopySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCopy) {
        await api.patch(`inventory/copies/${editingCopy.id}/`, copyForm);
      } else {
        await api.post("inventory/copies/", copyForm);
      }
      setIsCopyModalOpen(false);
      setEditingCopy(null);
      setCopyForm(INITIAL_COPY_FORM);
      fetchCopies();
    } catch (err) {
      console.error("Error saving copy:", err);
      alert("Failed to save book copy. Check form fields and backend validation.");
    }
  };

  // Handle Shelf Submit (Create / Edit)
  const handleShelfSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingShelf) {
        await api.patch(`inventory/shelves/${editingShelf.id}/`, shelfForm);
      } else {
        await api.post("inventory/shelves/", shelfForm);
      }
      setIsShelfModalOpen(false);
      setEditingShelf(null);
      setShelfForm(INITIAL_SHELF_FORM);
      fetchShelves();
    } catch (err) {
      console.error("Error saving shelf:", err);
      alert("Failed to save shelf.");
    }
  };

  // Delete Copy
  const handleDeleteCopy = async (id) => {
    if (!window.confirm("Are you sure you want to delete this book copy?")) return;
    try {
      await api.delete(`inventory/copies/${id}/`);
      fetchCopies();
    } catch (err) {
      alert("Failed to delete copy.");
    }
  };

  // Delete Shelf
  const handleDeleteShelf = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shelf?")) return;
    try {
      await api.delete(`inventory/shelves/${id}/`);
      fetchShelves();
    } catch (err) {
      alert("Failed to delete shelf. Ensure no copies are attached.");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#153c32]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            Library Inventory Management
          </h1>
          <p className="text-sm text-gray-500">
            Manage book physical copies, shelf locations, catalog lookup, and inventory statistics.
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === "copies" && (
            <button
              onClick={() => { setEditingCopy(null); setCopyForm(INITIAL_COPY_FORM); setIsCopyModalOpen(true); }}
              className="bg-[#153c32] hover:bg-[#225543] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow transition flex items-center gap-2"
            >
              + Add Book Copy
            </button>
          )}
          {activeTab === "shelves" && (
            <button
              onClick={() => { setEditingShelf(null); setShelfForm(INITIAL_SHELF_FORM); setIsShelfModalOpen(true); }}
              className="bg-[#153c32] hover:bg-[#225543] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow transition flex items-center gap-2"
            >
              + Add Shelf Location
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {[
          { id: "copies", label: "Book Copies" },
          { id: "shelves", label: "Shelves" },
          { id: "books", label: "Book Catalog" },
          { id: "statistics", label: "Statistics Overview" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-[#153c32] text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filters Bar (For Copies and Shelves and Books) */}
      {activeTab !== "statistics" && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="w-full sm:w-1/2">
            <input
              type="text"
              placeholder={
                activeTab === "copies" ? "Search by barcode, title, ISBN, shelf..." :
                activeTab === "shelves" ? "Search by name, location, description..." :
                "Search book title, ISBN, author..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-[#153c32] focus:outline-none"
            />
          </div>

          {activeTab === "copies" && (
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-xl text-xs bg-white focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="ON_LOAN">On Loan</option>
                <option value="RESERVED">Reserved</option>
                <option value="DAMAGED">Damaged</option>
                <option value="LOST">Lost</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>

              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="px-3 py-2 border rounded-xl text-xs bg-white focus:outline-none"
              >
                <option value="">All Conditions</option>
                <option value="NEW">New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>
          )}
        </div>
      )}

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}

      {/* TAB 1: BOOK COPIES */}
      {activeTab === "copies" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Barcode</th>
                  <th className="p-4">Book Title</th>
                  <th className="p-4">Shelf</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Condition</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  <tr><td colSpan="6" className="text-center p-8 text-gray-400">Loading copies...</td></tr>
                ) : copies.length === 0 ? (
                  <tr><td colSpan="6" className="text-center p-8 text-gray-400">No book copies found.</td></tr>
                ) : (
                  copies.map((copy) => (
                    <tr key={copy.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-mono font-medium text-gray-900">{copy.barcode}</td>
                      <td className="p-4 font-semibold text-[#153c32]">
                        {copy.book_title || copy.book?.title || `Book #${copy.book}`}
                      </td>
                      <td className="p-4 text-gray-600">{copy.shelf_name || copy.shelf?.name || "Unassigned"}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          copy.status === "AVAILABLE" ? "bg-green-100 text-green-700" :
                          copy.status === "ON_LOAN" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-800"
                        }`}>
                          {copy.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-medium text-gray-600">{copy.condition}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingCopy(copy);
                            setCopyForm({
                              book: copy.book,
                              shelf: copy.shelf || "",
                              barcode: copy.barcode,
                              status: copy.status,
                              condition: copy.condition,
                              acquisition_date: copy.acquisition_date || "",
                              notes: copy.notes || "",
                            });
                            setIsCopyModalOpen(true);
                          }}
                          className="text-blue-600 hover:underline text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCopy(copy.id)}
                          className="text-red-600 hover:underline text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SHELVES */}
      {activeTab === "shelves" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Shelf Name</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Total Copies</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  <tr><td colSpan="5" className="text-center p-8 text-gray-400">Loading shelves...</td></tr>
                ) : shelves.length === 0 ? (
                  <tr><td colSpan="5" className="text-center p-8 text-gray-400">No shelves found.</td></tr>
                ) : (
                  shelves.map((shelf) => (
                    <tr key={shelf.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-bold text-[#153c32]">{shelf.name}</td>
                      <td className="p-4 text-gray-600">{shelf.location || "N/A"}</td>
                      <td className="p-4 text-gray-500 text-xs">{shelf.description || "—"}</td>
                      <td className="p-4 font-mono font-bold text-gray-800">{shelf.copy_count ?? 0}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingShelf(shelf);
                            setShelfForm({ name: shelf.name, location: shelf.location || "", description: shelf.description || "" });
                            setIsShelfModalOpen(true);
                          }}
                          className="text-blue-600 hover:underline text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteShelf(shelf.id)}
                          className="text-red-600 hover:underline text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BOOK CATALOG LOOKUP */}
      {activeTab === "books" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">ISBN</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Authors</th>
                  <th className="p-4">Publisher / Year</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  <tr><td colSpan="4" className="text-center p-8 text-gray-400">Loading catalog...</td></tr>
                ) : books.length === 0 ? (
                  <tr><td colSpan="4" className="text-center p-8 text-gray-400">No books found in catalog.</td></tr>
                ) : (
                  books.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-mono text-xs text-gray-600">{b.isbn || "N/A"}</td>
                      <td className="p-4 font-bold text-[#153c32]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>{b.title}</td>
                      <td className="p-4 text-gray-600">
                        {b.authors?.map(a => `${a.first_name} ${a.last_name}`).join(", ") || "Unknown Author"}
                      </td>
                      <td className="p-4 text-xs text-gray-500">{b.publisher} ({b.publication_year || "N/A"})</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STATISTICS OVERVIEW */}
      {activeTab === "statistics" && (
        <div>
          {loading ? (
            <p className="text-center p-12 text-gray-400">Loading statistics...</p>
          ) : statistics ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(statistics).map(([key, value]) => (
                <div key={key} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-3xl font-black text-[#153c32] mt-3" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400">No statistics available.</p>
          )}
        </div>
      )}

      {/* COPY MODAL */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              {editingCopy ? "Edit Book Copy" : "Add New Book Copy"}
            </h3>
            <form onSubmit={handleCopySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Book Title / ID</label>
                <select
                  required
                  value={copyForm.book}
                  onChange={(e) => setCopyForm({ ...copyForm, book: e.target.value })}
                  className="w-full border rounded-xl p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#153c32]"
                >
                  <option value="">Select Book from Catalog</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>{b.title} ({b.isbn})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    required
                    value={copyForm.barcode}
                    onChange={(e) => setCopyForm({ ...copyForm, barcode: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#153c32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Shelf Location</label>
                  <select
                    value={copyForm.shelf}
                    onChange={(e) => setCopyForm({ ...copyForm, shelf: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#153c32]"
                  >
                    <option value="">Select Shelf</option>
                    {shelves.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={copyForm.status}
                    onChange={(e) => setCopyForm({ ...copyForm, status: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-sm bg-white focus:outline-none"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="ON_LOAN">On Loan</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="DAMAGED">Damaged</option>
                    <option value="LOST">Lost</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Condition</label>
                  <select
                    value={copyForm.condition}
                    onChange={(e) => setCopyForm({ ...copyForm, condition: e.target.value })}
                    className="w-full border rounded-xl p-2.5 text-sm bg-white focus:outline-none"
                  >
                    <option value="NEW">New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCopyModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#153c32] text-white rounded-xl text-sm font-semibold hover:bg-[#225543]"
                >
                  {editingCopy ? "Save Changes" : "Create Copy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHELF MODAL */}
      {isShelfModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              {editingShelf ? "Edit Shelf" : "Add New Shelf"}
            </h3>
            <form onSubmit={handleShelfSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Shelf Name</label>
                <input
                  type="text"
                  required
                  value={shelfForm.name}
                  onChange={(e) => setShelfForm({ ...shelfForm, name: e.target.value })}
                  className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#153c32]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={shelfForm.location}
                  onChange={(e) => setShelfForm({ ...shelfForm, location: e.target.value })}
                  className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#153c32]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={shelfForm.description}
                  onChange={(e) => setShelfForm({ ...shelfForm, description: e.target.value })}
                  className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#153c32]"
                  rows="3"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsShelfModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#153c32] text-white rounded-xl text-sm font-semibold hover:bg-[#225543]"
                >
                  {editingShelf ? "Save Changes" : "Create Shelf"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;