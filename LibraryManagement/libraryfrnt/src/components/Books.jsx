import { useEffect, useState } from "react";
import api from "./context/api/api";

import {
  Plus,
  Search,
  BookOpen,
  Pencil,
  Trash2,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// API ENDPOINTS
const BOOKS_URL = "books/books/";
const AUTHORS_URL = "books/authors/";
const PUBLISHERS_URL = "books/publishers/";
const CATEGORIES_URL = "books/categories/";

// INITIAL BOOK FORM
const initialForm = {
  title: "",
  subtitle: "",
  isbn: "",
  description: "",
  publication_year: "",
  language: "English",
  publisher: "",
  authors: [],
  categories: [],
};

// HANDLE PAGINATED AND NON-PAGINATED RESPONSES
const getResults = (data) => {
  if (Array.isArray(data)) return data;
  return data?.results || [];
};

// FORMAT API ERRORS
const getErrorMessage = (error) => {
  const data = error.response?.data;

  if (!data) {
    return "Something went wrong. Please try again.";
  }

  if (typeof data === "string") return data;

  return Object.entries(data)
    .map(([field, messages]) => {
      const value = Array.isArray(messages)
        ? messages.join(", ")
        : messages;

      return `${field}: ${value}`;
    })
    .join("\n");
};

// DISPLAY AUTHORS
const getAuthors = (book, authors) => {
  if (!book.authors?.length) return "No authors";

  return book.authors
    .map((author) => {
      if (typeof author === "object") {
        return `${author.first_name || ""} ${author.last_name || ""}`.trim();
      }

      const found = authors.find(
        (item) => item.id === author
      );

      return found
        ? `${found.first_name} ${found.last_name}`
        : `Author #${author}`;
    })
    .join(", ");
};

// DISPLAY BOOK PRICE
const formatPrice = (book) => {
  const price =
    book.average_price ??
    book.price ??
    book.acquisition_price;

  if (price === undefined || price === null) {
    return "—";
  }

  return `KSh ${Number(price).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const Books = () => {
  // BOOK DATA
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [categories, setCategories] = useState([]);

  // LOADING STATES
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // SEARCH AND FILTER
  const [search, setSearch] = useState("");
  const [availabilityFilter, setAvailabilityFilter] =
    useState("all");

  // BOOK AVAILABILITY
  const [availability, setAvailability] = useState({});

  // FORM STATES
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [form, setForm] = useState(initialForm);

  // QUICK CREATE AUTHOR AND CATEGORY
  const [showAuthorForm, setShowAuthorForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [authorForm, setAuthorForm] = useState({
    first_name: "",
    last_name: "",
  });
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });
  const [savingRelated, setSavingRelated] = useState(false);

  // NOTIFICATIONS
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // DELETE CONFIRMATION
  const [deleteBook, setDeleteBook] = useState(null);

  // PAGINATION
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const pageSize = 10;

  // INPUT STYLING
  const inputStyle =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  // FETCH BOOKS
  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        search: search || undefined,
      };

      if (availabilityFilter === "available") {
        params.available = "true";
      } else if (availabilityFilter === "unavailable") {
        params.available = "false";
      }

      const response = await api.get(BOOKS_URL, { params });

      const bookList = getResults(response.data);

      setBooks(bookList);
      setTotalCount(
        response.data.count ?? bookList.length
      );

      // FETCH AVAILABILITY FOR EACH BOOK
      const results = await Promise.all(
        bookList.map(async (book) => {
          try {
            const result = await api.get(
              `${BOOKS_URL}${book.id}/availability/`
            );

            return [book.id, result.data];
          } catch {
            return [
              book.id,
              {
                is_available: false,
                available_copies: 0,
                total_copies: 0,
              },
            ];
          }
        })
      );

      setAvailability(Object.fromEntries(results));

    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // FETCH AUTHORS, PUBLISHERS AND CATEGORIES
  const fetchFormData = async () => {
    try {
      const [authorRes, publisherRes, categoryRes] =
        await Promise.all([
          api.get(AUTHORS_URL),
          api.get(PUBLISHERS_URL),
          api.get(CATEGORIES_URL),
        ]);

      setAuthors(getResults(authorRes.data));
      setPublishers(getResults(publisherRes.data));
      setCategories(getResults(categoryRes.data));

    } catch (err) {
      setError(
        "Unable to load authors, publishers or categories."
      );
    }
  };

  // LOAD RELATED DATA ON PAGE OPEN
  useEffect(() => {
    fetchFormData();
  }, []);

  // LOAD BOOKS WHEN SEARCH, FILTER OR PAGE CHANGES
  useEffect(() => {
    fetchBooks();
  }, [page, search, availabilityFilter]);

  // HANDLE FORM INPUTS
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // HANDLE MULTIPLE AUTHORS AND CATEGORIES
  const handleMultiSelect = (e) => {
    const values = Array.from(
      e.target.selectedOptions,
      (option) => Number(option.value)
    );

    setForm((prev) => ({
      ...prev,
      [e.target.name]: values,
    }));
  };

  // CREATE NEW AUTHOR
  const handleAddAuthor = async (e) => {
    e.preventDefault();
    try {
      setSavingRelated(true);
      setError("");
      const response = await api.post(
        AUTHORS_URL,
        authorForm
      );
      const newAuthor = response.data;
      // Update authors dropdown
      setAuthors((prev) => [...prev, newAuthor]);
      // Automatically select newly created author
      setForm((prev) => ({
        ...prev,
        authors: [...prev.authors, newAuthor.id],
      }));
      setAuthorForm({
        first_name: "",
        last_name: "",
      });
      setShowAuthorForm(false);
      setSuccess("Author added successfully!");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingRelated(false);
    }
  };

  // CREATE NEW CATEGORY
  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      setSavingRelated(true);
      setError("");
      const response = await api.post(
        CATEGORIES_URL,
        categoryForm
      );
      const newCategory = response.data;
      // Update categories dropdown
      setCategories((prev) => [...prev, newCategory]);
      // Automatically select newly created category
      setForm((prev) => ({
        ...prev,
        categories: [...prev.categories, newCategory.id],
      }));
      setCategoryForm({
        name: "",
        description: "",
      });
      setShowCategoryForm(false);
      setSuccess("Category added successfully!");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingRelated(false);
    }
  };

  // OPEN CREATE FORM
  const openCreateForm = () => {
    setEditingBook(null);
    setForm(initialForm);
    setError("");
    setShowForm(true);
  };

  // OPEN EDIT FORM
  const openEditForm = (book) => {
    setEditingBook(book);

    setForm({
      title: book.title || "",
      subtitle: book.subtitle || "",
      isbn: book.isbn || "",
      description: book.description || "",
      publication_year: book.publication_year || "",
      language: book.language || "English",

      publisher: String(
        typeof book.publisher === "object"
          ? book.publisher?.id || ""
          : book.publisher || ""
      ),

      authors: (book.authors || []).map((item) =>
        Number(typeof item === "object" ? item.id : item)
      ),

      categories: (book.categories || []).map((item) =>
        Number(typeof item === "object" ? item.id : item)
      ),
    });

    setError("");
    setShowForm(true);
  };

  // CLOSE FORM
  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingBook(null);
    setForm(initialForm);
    setError("");
  };

  // CREATE OR UPDATE BOOK
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.title.trim() ||
      !form.isbn.trim() ||
      !form.publisher ||
      !form.authors.length ||
      !form.categories.length
    ) {
      setError(
        "Please complete all required fields and select at least one author and category."
      );
      return;
    }

    const payload = {
      ...form,
      publisher: Number(form.publisher),
      authors: form.authors,
      categories: form.categories,
      publication_year: form.publication_year
        ? Number(form.publication_year)
        : null,
    };

    try {
      setSaving(true);

      if (editingBook) {
        await api.patch(
          `${BOOKS_URL}${editingBook.id}/`,
          payload
        );

        setSuccess("Book updated successfully!");
      } else {
        await api.post(BOOKS_URL, payload);

        setSuccess("Book added successfully!");
      }

      setShowForm(false);
      setEditingBook(null);
      setForm(initialForm);

      await fetchBooks();

    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // DELETE BOOK
  const handleDelete = async () => {
    if (!deleteBook) return;

    try {
      setDeleting(true);

      await api.delete(
        `${BOOKS_URL}${deleteBook.id}/`
      );

      setSuccess(
        `"${deleteBook.title}" deleted successfully.`
      );

      setDeleteBook(null);

      await fetchBooks();

    } catch (err) {
      setError(getErrorMessage(err));
      setDeleteBook(null);
    } finally {
      setDeleting(false);
    }
  };

  // STATISTICS
  const availableBooks = books.filter(
    (book) => availability[book.id]?.is_available
  ).length;

  const unavailableBooks = books.filter(
    (book) =>
      availability[book.id] &&
      !availability[book.id].is_available
  ).length;

  // PAGINATION
  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / pageSize)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">

      {/* PAGE HEADER */}

      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Books Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your library catalog, book details
            and availability.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          <Plus size={18} />
          Add New Book
        </button>

      </div>

      {/* SUCCESS MESSAGE */}

      {success && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">

          <span className="flex items-center gap-2">
            <CheckCircle size={18} />
            {success}
          </span>

          <button onClick={() => setSuccess("")}>
            <X size={17} />
          </button>

        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && !showForm && (
        <div className="mb-5 flex items-center justify-between whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">

          <span>{error}</span>

          <button onClick={() => setError("")}>
            <X size={17} />
          </button>

        </div>
      )}

      {/* STATISTICS CARDS */}

      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* TOTAL BOOKS */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Total Books
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {totalCount}
              </h2>
            </div>

            <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
              <BookOpen size={24} />
            </div>

          </div>
        </div>

        {/* AVAILABLE BOOKS */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Available Titles
              </p>

              <h2 className="mt-2 text-3xl font-bold text-green-600">
                {availableBooks}
              </h2>
            </div>

            <div className="rounded-lg bg-green-100 p-3 text-green-700">
              <CheckCircle size={24} />
            </div>

          </div>
        </div>

        {/* UNAVAILABLE BOOKS */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Unavailable Titles
              </p>

              <h2 className="mt-2 text-3xl font-bold text-amber-600">
                {unavailableBooks}
              </h2>
            </div>

            <div className="rounded-lg bg-amber-100 p-3 text-amber-700">
              <AlertCircle size={24} />
            </div>

          </div>
        </div>

      </div>

      {/* SEARCH AND FILTER */}

      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">

        <div className="relative flex-1">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search by title, author, ISBN..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />

        </div>

        <select
          value={availabilityFilter}
          onChange={(e) => {
            setPage(1);
            setAvailabilityFilter(e.target.value);
          }}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600"
        >
          <option value="all">All Books</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>

        <button
          onClick={fetchBooks}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>

      </div>

      {/* BOOKS TABLE */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

          <div>
            <h2 className="font-semibold text-gray-900">
              Library Collection
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Manage all registered books.
            </p>
          </div>

          <span className="text-xs text-gray-500">
            {totalCount} records
          </span>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1050px] text-left">

            <thead className="bg-gray-50 text-xs uppercase text-gray-500">

              <tr>
                <th className="px-5 py-4">Book Title</th>
                <th className="px-5 py-4">Author(s)</th>
                <th className="px-5 py-4">ISBN</th>
                <th className="px-5 py-4">Publisher</th>
                <th className="px-5 py-4">Year</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Availability</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {/* LOADING */}

              {loading ? (

                <tr>
                  <td colSpan="8" className="py-16 text-center">

                    <Loader2
                      className="mx-auto animate-spin text-blue-700"
                      size={30}
                    />

                    <p className="mt-3 text-sm text-gray-500">
                      Loading books...
                    </p>

                  </td>
                </tr>

              ) : books.length === 0 ? (

                /* EMPTY STATE */

                <tr>
                  <td colSpan="8" className="py-16 text-center">

                    <BookOpen
                      className="mx-auto text-gray-300"
                      size={40}
                    />

                    <p className="mt-3 font-medium text-gray-700">
                      No books found
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Add a new book or change your search.
                    </p>

                  </td>
                </tr>

              ) : (

                /* DISPLAY BOOKS */

                books.map((book) => {
                  const bookAvailability =
                    availability[book.id];

                  const isAvailable =
                    bookAvailability?.is_available;

                  return (
                    <tr
                      key={book.id}
                      className="transition hover:bg-gray-50"
                    >

                      {/* TITLE */}

                      <td className="px-5 py-4">

                        <div className="font-semibold text-gray-900">
                          {book.title}
                        </div>

                        {book.subtitle && (
                          <div className="mt-1 text-xs text-gray-500">
                            {book.subtitle}
                          </div>
                        )}

                      </td>

                      {/* AUTHORS */}

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {getAuthors(book, authors)}
                      </td>

                      {/* ISBN */}

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {book.isbn || "—"}
                      </td>

                      {/* PUBLISHER */}

                      <td className="px-5 py-4 text-sm text-gray-600">

                        {typeof book.publisher === "object"
                          ? book.publisher?.name
                          : publishers.find(
                              (p) => p.id === book.publisher
                            )?.name || "—"}

                      </td>

                      {/* PUBLICATION YEAR */}

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {book.publication_year || "—"}
                      </td>

                      {/* PRICE */}

                      <td className="px-5 py-4 text-sm font-medium text-gray-800">
                        {formatPrice(book)}
                      </td>

                      {/* AVAILABILITY */}

                      <td className="px-5 py-4">

                        {!bookAvailability ? (

                          <span className="text-xs text-gray-400">
                            Checking...
                          </span>

                        ) : (

                          <div className="space-y-1">

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                                isAvailable
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >

                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isAvailable
                                    ? "bg-green-600"
                                    : "bg-amber-600"
                                }`}
                              />

                              {isAvailable
                                ? "Available"
                                : "Unavailable"}

                            </span>

                            <p className="text-xs text-gray-500">
                              {bookAvailability.available_copies}
                              {" / "}
                              {bookAvailability.total_copies}
                              {" copies"}
                            </p>

                          </div>

                        )}

                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4">

                        <div className="flex items-center justify-center gap-2">

                          <button
                            onClick={() => openEditForm(book)}
                            title="Edit book"
                            className="rounded-lg bg-blue-50 p-2 text-blue-700 transition hover:bg-blue-100"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() => setDeleteBook(book)}
                            title="Delete book"
                            className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                          >
                            <Trash2 size={17} />
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })

              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}

        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">

          <p className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </p>

          <div className="flex gap-2">

            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>

          </div>

        </div>

      </div>

      {/* CREATE / EDIT BOOK MODAL */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingBook ? "Edit Book" : "Add New Book"}
              </h2>
              <button onClick={closeForm} disabled={saving}>
                <X size={20} className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 whitespace-pre-line">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={form.title}
                    onChange={handleChange}
                    className={inputStyle}
                    placeholder="Book title"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    value={form.subtitle}
                    onChange={handleChange}
                    className={inputStyle}
                    placeholder="Subtitle (optional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    ISBN *
                  </label>
                  <input
                    type="text"
                    name="isbn"
                    required
                    value={form.isbn}
                    onChange={handleChange}
                    className={inputStyle}
                    placeholder="ISBN number"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Publisher *
                  </label>
                  <select
                    name="publisher"
                    required
                    value={form.publisher}
                    onChange={handleChange}
                    className={inputStyle}
                  >
                    <option value="">Select publisher</option>
                    {publishers.map((pub) => (
                      <option key={pub.id} value={pub.id}>
                        {pub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Publication Year
                  </label>
                  <input
                    type="number"
                    name="publication_year"
                    value={form.publication_year}
                    onChange={handleChange}
                    className={inputStyle}
                    placeholder="YYYY"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Language
                  </label>
                  <input
                    type="text"
                    name="language"
                    value={form.language}
                    onChange={handleChange}
                    className={inputStyle}
                    placeholder="English"
                  />
                </div>
              </div>

              {/* AUTHORS */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Authors *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAuthorForm(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                  >
                    <Plus size={14} />
                    Add Author
                  </button>
                </div>
                <select
                  multiple
                  name="authors"
                  value={form.authors.map(String)}
                  onChange={handleMultiSelect}
                  className={`${inputStyle} min-h-28`}
                  required
                >
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.first_name} {author.last_name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  Select existing authors or click Add Author to register a new one.
                </p>
              </div>

              {/* CATEGORIES */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Categories *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryForm(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                  >
                    <Plus size={14} />
                    Add Category
                  </button>
                </div>
                <select
                  multiple
                  name="categories"
                  value={form.categories.map(String)}
                  onChange={handleMultiSelect}
                  className={`${inputStyle} min-h-28`}
                  required
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  Select existing categories or click Add Category to create one.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="3"
                  value={form.description}
                  onChange={handleChange}
                  className={inputStyle}
                  placeholder="Book summary or details..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingBook ? "Update Book" : "Save Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD AUTHOR MODAL */}
      {showAuthorForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              Add New Author
            </h2>
            <form onSubmit={handleAddAuthor} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  First Name *
                </label>
                <input
                  required
                  value={authorForm.first_name}
                  onChange={(e) =>
                    setAuthorForm({
                      ...authorForm,
                      first_name: e.target.value,
                    })
                  }
                  className={inputStyle}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Last Name *
                </label>
                <input
                  required
                  value={authorForm.last_name}
                  onChange={(e) =>
                    setAuthorForm({
                      ...authorForm,
                      last_name: e.target.value,
                    })
                  }
                  className={inputStyle}
                  placeholder="Enter last name"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAuthorForm(false)}
                  disabled={savingRelated}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRelated}
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {savingRelated ? "Saving..." : "Save Author"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showCategoryForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              Add New Category
            </h2>
            <form onSubmit={handleAddCategory} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Category Name *
                </label>
                <input
                  required
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      name: e.target.value,
                    })
                  }
                  className={inputStyle}
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      description: e.target.value,
                    })
                  }
                  className={inputStyle}
                  rows="3"
                  placeholder="Describe this category..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(false)}
                  disabled={savingRelated}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRelated}
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {savingRelated ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              Confirm Delete
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete <span className="font-semibold text-gray-700">"{deleteBook.title}"</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteBook(null)}
                disabled={deleting}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Book"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Books;