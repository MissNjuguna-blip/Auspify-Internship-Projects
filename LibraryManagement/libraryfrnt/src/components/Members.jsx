import React, { useState, useEffect } from "react";
import api from "./context/api/api";


// Base URL corresponding to router.register("members", MemberViewSet, basename="member")
const API_BASE_URL = "members";

const INITIAL_FORM_STATE = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  membership_number: "",
  address: "",
  joined_date: new Date().toISOString().split("T")[0],
  membership_type: "PUBLIC",
  status: "ACTIVE",
};

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters and Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // Fetch Members from API
  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;

      // Requests http://127.0.0.1:8000/api/members/
      const response = await api.get(`${API_BASE_URL}/members/`, { params });
      setMembers(response.data.results || response.data);
    } catch (err) {
      console.error("Failed to fetch members:", err);
      setError("Failed to load members. Please check backend connection or authentication.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMembers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter]);

  // Handle Input Changes in Form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingMember(null);
    setFormData(INITIAL_FORM_STATE);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      first_name: member.first_name || "",
      last_name: member.last_name || "",
      email: member.email || "",
      phone_number: member.phone_number || "",
      membership_number: member.membership_number || "",
      address: member.address || "",
      joined_date: member.joined_date || new Date().toISOString().split("T")[0],
      membership_type: member.membership_type || "PUBLIC",
      status: member.status || "ACTIVE",
    });
    setIsModalOpen(true);
  };

  // Save Member (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        // PATCH http://127.0.0.1:8000/api/members/{id}/
        await api.patch(`${API_BASE_URL}/${editingMember.id}/`, formData);
      } else {
        // POST http://127.0.0.1:8000/api/members/
        await api.post(`${API_BASE_URL}/`, formData);
      }
      setIsModalOpen(false);
      fetchMembers();
    } catch (err) {
      console.error("Error saving member:", err);
      const errorData = err.response?.data;
      let message = "Failed to save member.";
      if (errorData) {
        // Extract Django REST framework validation errors
        const fieldErrors = Object.entries(errorData)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('\n');
        if (fieldErrors) message = fieldErrors;
      }
      alert(message);
    }
  };

  // Delete Member
  const handleDelete = async () => {
    if (!memberToDelete) return;
    try {
      // DELETE http://127.0.0.1:8000/api/members/{id}/
      await api.delete(`${API_BASE_URL}/${memberToDelete.id}/`);
      setIsDeleteModalOpen(false);
      setMemberToDelete(null);
      fetchMembers();
    } catch (err) {
      console.error("Failed to delete member:", err);
      alert("Failed to delete member.");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Library Members Management
          </h1>
          <p className="text-sm text-gray-500">
            View, search, add, edit, and manage registered library members.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow transition flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
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
          Add New Member
        </button>
      </div>

      {/* Controls / Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="w-full sm:w-1/2">
          <input
            type="text"
            placeholder="Search by name, email, phone, or membership number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="EXPIRED">Expired</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Member No.</th>
                <th className="p-4">Name</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-gray-400">
                    Loading members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-gray-400">
                    No members found.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id || member.membership_number} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-mono font-medium text-gray-900">
                      {member.membership_number}
                    </td>
                    <td className="p-4 font-medium">
                      {member.first_name} {member.last_name}
                    </td>
                    <td className="p-4">
                      <div>{member.email}</div>
                      <div className="text-xs text-gray-400">{member.phone_number}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-xs rounded-md bg-gray-100 font-medium">
                        {member.membership_type || "PUBLIC"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          member.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : member.status === "SUSPENDED"
                            ? "bg-yellow-100 text-yellow-700"
                            : member.status === "EXPIRED"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {member.status || "ACTIVE"}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      {member.joined_date || "N/A"}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(member)}
                        className="text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setMemberToDelete(member);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded"
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

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingMember ? "Edit Member" : "Add New Member"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Membership Number
                  </label>
                  <input
                    type="text"
                    name="membership_number"
                    required
                    value={formData.membership_number}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Membership Type
                  </label>
                  <select
                    name="membership_type"
                    value={formData.membership_type}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="STAFF">Staff</option>
                    <option value="PUBLIC">Public</option>
                    <option value="RESEARCHER">Researcher</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Joined Date
                  </label>
                  <input
                    type="date"
                    name="joined_date"
                    value={formData.joined_date}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium"
                >
                  {editingMember ? "Save Changes" : "Create Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              Confirm Deletion
            </h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete member{" "}
              <span className="font-semibold text-gray-900">
                {memberToDelete?.first_name} {memberToDelete?.last_name}
              </span>{" "}
              ({memberToDelete?.membership_number})? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 font-medium"
              >
                Delete Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;