import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "./context/api/api";

const Tasks = ({ projectId }) => {

  // ==================================================
  // SECTION 2: STATES
  // ==================================================

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingTask, setEditingTask] = useState(null);

  const initialForm = {
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    due_date: "",
    project: projectId || "",
  };

  const [form, setForm] = useState(initialForm);

  // ==================================================
  // SECTION 3: FETCH TASKS & PROJECTS
  // ==================================================

  const fetchTasks = useCallback(async () => {

    try {

      setLoading(true);
      setError("");

      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (projectId) {
        params.project = projectId;
      }

      const response = await api.get("tasks/list/", {
        params,
      });

      setTasks(response.data.results || []);

    } catch (err) {

      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Unable to fetch tasks. Please try again."
      );

    } finally {

      setLoading(false);

    }

  }, [search, projectId]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get("projects/list/");
      setProjects(response.data.results || response.data || []);
    } catch (err) {
      console.error("Unable to fetch projects for dropdown:", err);
    }
  }, []);


  // Automatically fetch tasks and projects on mount

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {

    const timer = setTimeout(() => {
      fetchTasks();
    }, 350);

    return () => clearTimeout(timer);

  }, [fetchTasks]);

  // ==================================================
  // SECTION 4: FORM HANDLING
  // ==================================================

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

  };


  // Open create modal

  const openCreateModal = () => {

    setEditingTask(null);

    setForm({
      ...initialForm,
      project: projectId || (projects.length > 0 ? projects[0].id : ""),
    });

    setError("");
    setShowModal(true);

  };


  // Open edit modal

  const openEditModal = (task) => {

    setEditingTask(task);

    setForm({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "todo",
      priority: task.priority || "medium",

      due_date: task.due_date
        ? task.due_date.slice(0, 10)
        : "",

      project:
        task.project || projectId || "",
    });

    setError("");
    setShowModal(true);

  };


  // Close modal

  const closeModal = () => {

    setShowModal(false);
    setEditingTask(null);

    setForm({
      ...initialForm,
      project: projectId || "",
    });

    setError("");

  };

  // ==================================================
  // SECTION 5: CREATE AND UPDATE TASKS
  // ==================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!form.title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (!form.project) {
      setError("Please select a project.");
      return;
    }

    // Validate UUID format before submitting
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(form.project.trim())) {
      setError("Selected project ID must be a valid UUID.");
      return;
    }

    try {

      setSaving(true);
      setError("");

      const payload = {
        ...form,
        title: form.title.trim(),
        project: form.project.trim(),
      };

      if (!payload.due_date) {
        delete payload.due_date;
      }

      if (editingTask) {

        await api.patch(
          `tasks/${editingTask.id}/update/`,
          payload
        );

      } else {

        await api.post(
          "tasks/create/",
          payload
        );

      }

      closeModal();

      await fetchTasks();

    } catch (err) {

      const details = err.response?.data;

      setError(
        details
          ? Object.entries(details)
              .map(([key, value]) =>
                `${key}: ${
                  Array.isArray(value)
                    ? value.join(", ")
                    : typeof value === "object"
                      ? JSON.stringify(value)
                      : value
                }`
              )
              .join(" | ")
          : "Unable to save task."
      );

    } finally {

      setSaving(false);

    }

  };

  // ==================================================
  // SECTION 6: UPDATE TASK STATUS
  // ==================================================

  const handleUpdateStatus = async (task) => {

    const statuses = {
      todo: "in_progress",
      in_progress: "in_review",
      in_review: "completed",
      completed: "todo",
      cancelled: "todo",
    };

    const nextStatus = statuses[task.status];

    if (!nextStatus) {
      setError("Invalid task status.");
      return;
    }

    try {

      setError("");

      await api.patch(
        `tasks/${task.id}/update/`,
        {
          status: nextStatus,
        }
      );

      await fetchTasks();

    } catch (err) {

      setError(
        err.response?.data?.error ||
        "Unable to update task status."
      );

    }

  };

  // ==================================================
  // SECTION 7: DELETE TASK
  // ==================================================

  const handleDelete = async (task) => {

    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) return;

    try {

      setError("");

      await api.delete(
        `tasks/${task.id}/delete/`
      );

      await fetchTasks();

    } catch (err) {

      setError(
        err.response?.data?.error ||
        "Unable to delete task."
      );

    }

  };

  // ==================================================
  // SECTION 8: DATE FORMATTING
  // ==================================================

  const formatDate = (date) => {

    if (!date) return "No due date";

    const parsed = new Date(
      `${date.slice(0, 10)}T00:00:00`
    );

    if (Number.isNaN(parsed.getTime())) {
      return "Invalid date";
    }

    return parsed.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  };


  // ==================================================
  // SECTION 9: OVERDUE CHECK
  // ==================================================

  const isOverdue = (date, status) => {

    if (
      !date ||
      status === "completed" ||
      status === "cancelled"
    ) {
      return false;
    }

    const dueDate = new Date(
      `${date.slice(0, 10)}T00:00:00`
    );

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return dueDate < today;

  };


  // ==================================================
  // SECTION 10: STATUS LABELS & COLORS
  // ==================================================

  const statusLabels = {
    todo: "To Do",
    in_progress: "In Progress",
    in_review: "In Review",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const statusColors = {

    todo:
      "bg-slate-100 text-slate-700 border-slate-200",

    in_progress:
      "bg-amber-100 text-amber-800 border-amber-200",

    in_review:
      "bg-purple-100 text-purple-800 border-purple-200",

    completed:
      "bg-emerald-100 text-emerald-800 border-emerald-200",

    cancelled:
      "bg-rose-100 text-rose-800 border-rose-200",

  };


  // ==================================================
  // SECTION 11: PRIORITY COLORS
  // ==================================================

  const priorityColors = {

    low:
      "bg-slate-100 text-slate-600 border-slate-200",

    medium:
      "bg-blue-50 text-blue-700 border-blue-200",

    high:
      "bg-rose-50 text-rose-700 border-rose-200",

    urgent:
      "bg-red-100 text-red-900 border-red-300 font-bold",

  };

  // ==================================================
  // SECTION 12: PAGE HEADER AND SEARCH
  // ==================================================

  return (

    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

      <div className="max-w-7xl mx-auto">

        {/* PAGE HEADER */}

        <div className="mb-8">

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Task Management
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Organize, track and manage your project tasks.
          </p>

        </div>


        {/* SEARCH AND ADD TASK */}

        <div className="flex flex-col sm:flex-row gap-3 mb-7">

          <div className="relative flex-1">

            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                strokeWidth="2"
              />

              <path
                d="m16 16 4 4"
                strokeWidth="2"
                strokeLinecap="round"
              />

            </svg>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks by title, description or project..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />

          </div>


          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition-colors"
          >

            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 5v14M5 12h14"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            Add Task

          </button>

        </div>


        {/* ERROR MESSAGE */}

        {error && !showModal && (

          <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex justify-between items-center gap-3">

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold text-lg"
            >
              ×
            </button>

          </div>

        )}


        {/* TASK COUNT */}

        <div className="mb-5 flex justify-between items-center">

          <p className="text-sm text-slate-500">
            {loading
              ? "Loading tasks..."
              : `${tasks.length} task(s) found`}
          </p>

          <button
            type="button"
            onClick={fetchTasks}
            disabled={loading}
            className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
          >
            Refresh

          </button>

        </div>

        {/* ==================================================
            SECTION 13: TASK CARDS
        ================================================== */}

        {loading ? (

          <div className="text-center py-20 bg-white rounded-2xl">

            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 mx-auto" />

            <p className="text-sm text-slate-500 mt-4">
              Loading your tasks...
            </p>

          </div>

        ) : error && tasks.length === 0 ? (

          <div className="bg-white rounded-2xl border border-rose-200 p-10 text-center">

            <p className="text-rose-600 font-medium">
              Unable to load tasks.
            </p>

            <button
              type="button"
              onClick={fetchTasks}
              className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm"
            >
              Try Again
            </button>

          </div>

        ) : tasks.length === 0 ? (

          <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-20 text-center">

            <div className="text-4xl mb-4">
              📋
            </div>

            <h3 className="font-semibold text-slate-700">
              No tasks found
            </h3>

            <p className="text-sm text-slate-400 mt-2">
              Create a new task or try another search.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold"
            >
              + Create Task
            </button>

          </div>

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

            {tasks.map((task) => {

              const overdue = isOverdue(
                task.due_date,
                task.status
              );

              return (

                <div
                  key={task.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between"
                >

                  <div>

                    {/* STATUS AND PRIORITY */}

                    <div className="flex justify-between items-center gap-2 mb-4">

                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                          statusColors[task.status] ||
                          statusColors.todo
                        }`}
                      >
                        {statusLabels[task.status] || task.status}
                      </span>

                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border capitalize ${
                          priorityColors[task.priority] ||
                          priorityColors.low
                        }`}
                      >
                        {task.priority}
                      </span>

                    </div>


                    {/* TASK TITLE */}

                    <h3 className="font-bold text-slate-900 text-base mb-2 line-clamp-2">
                      {task.title}
                    </h3>


                    {/* TASK DESCRIPTION */}

                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                      {task.description ||
                        "No description provided."}
                    </p>


                    {/* PROJECT NAME */}

                    {task.project_name && (

                      <p className="text-xs text-indigo-600 mt-3">
                        Project: {task.project_name}
                      </p>

                    )}

                  </div>


                  {/* CARD FOOTER */}

                  <div className="mt-5">

                    {/* DUE DATE */}

                    <div
                      className={`flex items-center gap-2 text-xs mb-4 ${
                        overdue
                          ? "text-rose-600 font-semibold"
                          : "text-slate-400"
                      }`}
                    >

                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >

                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="16"
                          rx="2"
                          strokeWidth="2"
                        />

                        <path
                          d="M16 3v4M8 3v4M3 10h18"
                          strokeWidth="2"
                        />

                      </svg>

                      <span>
                        Due: {formatDate(task.due_date)}
                        {overdue && " · Overdue"}
                      </span>

                    </div>


                    {/* CARD ACTIONS */}

                    <div className="grid grid-cols-2 gap-2">

                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(task)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg py-2.5 text-xs font-semibold transition-colors"
                      >
                        Update Status
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(task)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg py-2.5 text-xs font-semibold transition-colors"
                      >
                        Edit Task
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(task)}
                        className="col-span-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg py-2.5 text-xs font-semibold transition-colors"
                      >
                        Delete Task
                      </button>

                    </div>

                  </div>

                </div>

              );

            })}

          </div>

        )}

        {/* ==================================================
            SECTION 14: CREATE / EDIT TASK MODAL
        ================================================== */}

        {showModal && (

          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">

            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

              {/* MODAL HEADER */}

              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">

                <div>

                  <h2 className="text-lg font-bold text-slate-900">

                    {editingTask
                      ? "Edit Task"
                      : "Create New Task"}

                  </h2>

                  <p className="text-xs text-slate-400 mt-1">
                    Enter your task information below.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="text-slate-400 hover:text-slate-700 text-2xl"
                >
                  ×
                </button>

              </div>


              {/* FORM */}

              <form
                onSubmit={handleSubmit}
                className="p-6 space-y-4"
              >

                {/* TASK TITLE */}

                <div>

                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    Task Title *
                  </label>

                  <input
                    type="text"
                    name="title"
                    required
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Design Landing Page"
                    className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />

                </div>


                {/* DESCRIPTION */}

                <div>

                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    Description
                  </label>

                  <textarea
                    name="description"
                    rows={4}
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Enter task description..."
                    className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />

                </div>


                {/* STATUS AND PRIORITY */}

                <div className="grid grid-cols-2 gap-4">

                  <div>

                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                      Status
                    </label>

                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full px-3 py-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >

                      <option value="todo">
                        To Do
                      </option>

                      <option value="in_progress">
                        In Progress
                      </option>

                      <option value="in_review">
                        In Review
                      </option>

                      <option value="completed">
                        Completed
                      </option>

                      <option value="cancelled">
                        Cancelled
                      </option>

                    </select>

                  </div>


                  <div>

                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                      Priority
                    </label>

                    <select
                      name="priority"
                      value={form.priority}
                      onChange={handleChange}
                      className="w-full px-3 py-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >

                      <option value="low">
                        Low
                      </option>

                      <option value="medium">
                        Medium
                      </option>

                      <option value="high">
                        High
                      </option>

                      <option value="urgent">
                        Urgent
                      </option>

                    </select>

                  </div>

                </div>


                {/* DUE DATE */}

                <div>

                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    Due Date
                  </label>

                  <input
                    type="date"
                    name="due_date"
                    value={form.due_date}
                    onChange={handleChange}
                    className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                </div>


                {/* PROJECT DROPDOWN */}

                {!projectId && (

                  <div>

                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                      Project *
                    </label>

                    <select
                      name="project"
                      required
                      value={form.project}
                      onChange={handleChange}
                      className="w-full px-3 py-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select a project...</option>
                      {projects.map((proj) => (
                        <option key={proj.id} value={proj.id}>
                          {proj.name}
                        </option>
                      ))}
                    </select>

                  </div>

                )}


                {/* FORM ERROR */}

                {error && (

                  <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-sm">

                    {error}

                  </div>

                )}


                {/* FORM BUTTONS */}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm disabled:opacity-50"
                  >

                    {saving
                      ? "Saving..."
                      : editingTask
                        ? "Save Changes"
                        : "Create Task"}

                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

        {/* END TASK MODAL */}

      </div>

    </div>

  );

};
export default Tasks;