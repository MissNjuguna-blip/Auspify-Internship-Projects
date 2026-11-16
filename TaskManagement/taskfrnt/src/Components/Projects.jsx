import React, { useEffect, useState, useCallback } from "react";
import api from "./context/api/api";

const Projects = () => {

  // Project data
  const [projects, setProjects] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Error handling
  const [error, setError] = useState(null);

  // Search and filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Selected project
  const [selectedProject, setSelectedProject] = useState(null);

  // Editing mode
  const [isEditing, setIsEditing] = useState(false);

  // Project form
  const initialProject = {
    name: "",
    description: "",
    status: "active",
  };

  const [newProject, setNewProject] = useState(initialProject);

  const fetchProjects = useCallback(async () => {

    setLoading(true);
    setError(null);

    try {

      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await api.get("projects/list/", {
        params,
      });

      setProjects(
        response.data.results || response.data
      );

    } catch (err) {

      console.error("Failed to fetch projects:", err);

      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Unable to load projects. Please try again."
      );

    } finally {

      setLoading(false);

    }

  }, [search, statusFilter]);

  useEffect(() => {

    fetchProjects();

  }, [fetchProjects]);

  const resetForm = () => {

    setNewProject(initialProject);

    setSelectedProject(null);

    setIsEditing(false);

    setError(null);

  };

  const handleOpenCreateModal = () => {

    resetForm();

    setIsModalOpen(true);

  };

  const handleCreateProject = async (e) => {

    e.preventDefault();

    if (!newProject.name.trim()) {

      setError("Project name is required.");

      return;

    }

    setSaving(true);

    setError(null);

    try {

      await api.post(
        "projects/create/",
        newProject
      );

      setIsModalOpen(false);

      resetForm();

      await fetchProjects();

    } catch (err) {

      console.error("Failed to create project:", err);

      const backendErrors = err.response?.data;

      setError(
        backendErrors?.detail ||
        backendErrors?.error ||
        (
          typeof backendErrors === "object"
            ? Object.entries(backendErrors)
                .map(([field, messages]) =>
                  `${field}: ${
                    Array.isArray(messages)
                      ? messages.join(", ")
                      : messages
                  }`
                )
                .join(" | ")
            : "Failed to create project."
        )
      );

    } finally {

      setSaving(false);

    }

  };

  const handleEditProject = (project) => {

    setSelectedProject(project);

    setNewProject({
      name: project.name || "",
      description: project.description || "",
      status: project.status || "active",
    });

    setIsEditing(true);

    setError(null);

    setIsModalOpen(true);

  };

  const handleUpdateProject = async (e) => {

    e.preventDefault();

    if (!newProject.name.trim()) {

      setError("Project name is required.");

      return;

    }

    if (!selectedProject?.id) {

      setError("No project selected.");

      return;

    }

    setSaving(true);

    setError(null);

    try {

      await api.patch(
        `projects/${selectedProject.id}/update/`,
        newProject
      );

      setIsModalOpen(false);

      resetForm();

      await fetchProjects();

    } catch (err) {

      console.error("Failed to update project:", err);

      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Failed to update project. Check your permissions and inputs."
      );

    } finally {

      setSaving(false);

    }

  };

  const handleDeleteProject = async (project) => {

    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"? This may also delete associated tasks.`
    );

    if (!confirmed) return;

    setSaving(true);

    setError(null);

    try {

      await api.delete(
        `projects/${project.id}/delete/`
      );

      await fetchProjects();

      setIsViewModalOpen(false);

      setSelectedProject(null);

    } catch (err) {

      console.error("Failed to delete project:", err);

      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Failed to delete project."
      );

    } finally {

      setSaving(false);

    }

  };

  const handleViewProject = async (project) => {

    setError(null);

    try {

      const response = await api.get(
        `projects/${project.id}/`
      );

      setSelectedProject(response.data);

      setIsViewModalOpen(true);

    } catch (err) {

      console.error("Failed to fetch project details:", err);

      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Unable to load project details."
      );

    }

  };

  // Human-readable status mapping
  const statusLabels = {
    active: "Active",
    inactive: "Inactive",
    archived: "Archived",
  };

  const getStatusBadgeColor = (status) => {

    switch (status?.toLowerCase()) {

      case "active":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";

      case "inactive":
        return "bg-slate-100 text-slate-800 border-slate-200";

      case "archived":
        return "bg-amber-100 text-amber-800 border-amber-200";

      default:
        return "bg-slate-100 text-slate-800 border-slate-200";

    }

  };

  const getCompletionPercentage = (project) => {

    const total = Number(project.total_tasks || 0);

    const completed = Number(project.completed_tasks || 0);

    if (total === 0) return 0;

    return Math.round((completed / total) * 100);

  };

  return (

    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 font-sans">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">

          <div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Projects
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Organize your tasks into dedicated project groups.
            </p>

          </div>

          <div className="flex flex-col sm:flex-row gap-3">

            {/* SEARCH */}

            <div className="relative">

              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <svg
                className="w-5 h-5 absolute left-3 top-3 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" strokeWidth="2" />
                <path d="m16 16 4 4" strokeWidth="2" />
              </svg>

            </div>

            {/* STATUS FILTER */}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >

              <option value="">All Statuses</option>

              <option value="active">Active</option>

              <option value="inactive">Inactive</option>

              <option value="archived">Archived</option>

            </select>

            {/* ADD PROJECT */}

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all duration-200 cursor-pointer"
            >

              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>

              Add Project

            </button>

          </div>

        </div>

        {/* ERROR MESSAGE */}

        {error && (

          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm p-4 rounded-xl mb-6 flex justify-between gap-3">

            <span>{error}</span>

            <button
              onClick={() => setError(null)}
              className="font-bold"
            >
              ×
            </button>

          </div>

        )}

        {/* PROJECT GRID */}

        {loading ? (

          <div className="text-center py-16">

            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />

            <p className="text-sm text-slate-500">
              Loading projects...
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">

            {projects.map((proj) => (

              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between p-5"
              >

                <div>

                  {/* STATUS BADGE */}

                  <div className="flex items-center justify-between gap-2 mb-3">

                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusBadgeColor(proj.status)}`}
                    >
                      {statusLabels[proj.status] || proj.status || "Active"}
                    </span>

                    <button
                      onClick={() => handleViewProject(proj)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      View
                    </button>

                  </div>

                  {/* TITLE */}

                  <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1">
                    {proj.name}
                  </h3>

                  {/* DESCRIPTION */}

                  <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                    {proj.description || "No description provided."}
                  </p>

                  {/* TASK STATISTICS */}

                  <div className="grid grid-cols-2 gap-2 mb-4">

                    <div className="bg-slate-50 rounded-lg p-2">

                      <p className="text-xs text-slate-500">
                        Total Tasks
                      </p>

                      <p className="font-bold text-slate-800">
                        {proj.total_tasks ?? 0}
                      </p>

                    </div>

                    <div className="bg-emerald-50 rounded-lg p-2">

                      <p className="text-xs text-emerald-600">
                        Completed
                      </p>

                      <p className="font-bold text-emerald-800">
                        {proj.completed_tasks ?? 0}
                      </p>

                    </div>

                  </div>

                  {/* PROGRESS BAR */}

                  <div className="mb-4">

                    <div className="flex justify-between text-xs mb-1">

                      <span className="text-slate-500">
                        Progress
                      </span>

                      <span className="font-semibold text-slate-700">
                        {getCompletionPercentage(proj)}%
                      </span>

                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2">

                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${getCompletionPercentage(proj)}%`
                        }}
                      />

                    </div>

                  </div>

                </div>

                {/* FOOTER */}

                <div>

                  <div className="flex items-center text-xs text-slate-400 mb-4">

                    <svg
                      className="w-4 h-4 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>

                    Created: {
                      proj.created_at
                        ? new Date(proj.created_at).toLocaleDateString()
                        : "Not available"
                    }

                  </div>

                  {/* ACTION BUTTONS */}

                  <div className="flex gap-2">

                    <button
                      onClick={() => handleEditProject(proj)}
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold py-2 rounded-lg"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDeleteProject(proj)}
                      disabled={saving}
                      className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold py-2 rounded-lg disabled:opacity-50"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

        {/* EMPTY STATE */}

        {!loading && projects.length === 0 && (

          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 mt-6">

            <svg
              className="w-12 h-12 text-slate-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
              />
            </svg>

            <p className="text-slate-500 font-medium">
              No projects found.
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Create a project or change your search.
            </p>

          </div>

        )}

        {/* CREATE / EDIT PROJECT MODAL */}

        {isModalOpen && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">

            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">

              {/* MODAL HEADER */}

              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">

                <h3 className="text-lg font-bold text-slate-900">

                  {isEditing ? "Edit Project" : "Create New Project"}

                </h3>

                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  ✕
                </button>

              </div>

              {/* FORM */}

              <form
                onSubmit={
                  isEditing
                    ? handleUpdateProject
                    : handleCreateProject
                }
                className="p-6 space-y-4"
              >

                {/* ERROR */}

                {error && (

                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl">
                    {error}
                  </div>

                )}

                {/* PROJECT NAME */}

                <div>

                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Project Name *
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="e.g., Marketing Website"
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        name: e.target.value
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />

                </div>

                {/* DESCRIPTION */}

                <div>

                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Description
                  </label>

                  <textarea
                    rows="3"
                    placeholder="Enter project details..."
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        description: e.target.value
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none"
                  />

                </div>

                {/* STATUS */}

                <div>

                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Status
                  </label>

                  <select
                    value={newProject.status}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        status: e.target.value
                      })
                    }
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >

                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>

                    <option value="archived">
                      Archived
                    </option>

                  </select>

                </div>

                {/* FORM BUTTONS */}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">

                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                  >

                    {saving
                      ? "Saving..."
                      : isEditing
                        ? "Update Project"
                        : "Create Project"
                    }

                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

        {/* VIEW PROJECT MODAL */}

        {isViewModalOpen && selectedProject && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">

            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">

              <div className="flex items-center justify-between px-6 py-4 border-b">

                <h3 className="text-lg font-bold text-slate-900">
                  Project Details
                </h3>

                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>

              </div>

              <div className="p-6 space-y-4">

                <div>

                  <p className="text-xs uppercase font-semibold text-slate-400">
                    Project Name
                  </p>

                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {selectedProject.name}
                  </h2>

                </div>

                <div>

                  <p className="text-xs uppercase font-semibold text-slate-400">
                    Description
                  </p>

                  <p className="text-sm text-slate-600 mt-1">
                    {selectedProject.description || "No description provided."}
                  </p>

                </div>

                <div>

                  <p className="text-xs uppercase font-semibold text-slate-400">
                    Status
                  </p>

                  <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full border ${getStatusBadgeColor(selectedProject.status)}`}>
                    {statusLabels[selectedProject.status] || selectedProject.status}
                  </span>

                </div>

                <div className="grid grid-cols-2 gap-3">

                  <div className="bg-slate-50 rounded-xl p-3">

                    <p className="text-xs text-slate-500">
                      Total Tasks
                    </p>

                    <p className="text-xl font-bold text-slate-900">
                      {selectedProject.total_tasks ?? 0}
                    </p>

                  </div>

                  <div className="bg-emerald-50 rounded-xl p-3">

                    <p className="text-xs text-emerald-600">
                      Completed Tasks
                    </p>

                    <p className="text-xl font-bold text-emerald-800">
                      {selectedProject.completed_tasks ?? 0}
                    </p>

                  </div>

                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">

                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleEditProject(selectedProject);
                    }}
                    className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                  >
                    Edit Project
                  </button>

                  <button
                    onClick={() => handleDeleteProject(selectedProject)}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50"
                  >
                    Delete
                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>

  );

};

export default Projects;