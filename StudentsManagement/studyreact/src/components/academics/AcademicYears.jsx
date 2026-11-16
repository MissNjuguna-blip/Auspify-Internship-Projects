
import { useState } from "react";
import ResourceManager from "./ResourceManager";
import { academicsService } from "../context/api/academicsService";

const AcademicYears = () => {
  const [activating, setActivating] = useState(null);

  const handleActivate = async (year) => {
    const confirmed = window.confirm(
      `Are you sure you want to activate ${year.name || `${year.start_date} - ${year.end_date}`}?`
    );

    if (!confirmed) return;

    try {
      setActivating(year.id);

      await academicsService.activateAcademicYear(year.id);

      window.alert("Academic year activated successfully.");

      window.location.reload();

    } catch (error) {
      console.error("Failed to activate academic year:", error);

      window.alert(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Unable to activate academic year."
      );
    } finally {
      setActivating(null);
    }
  };

  return (
    <ResourceManager
      title="Academic Years"
      description="Create, manage and activate your institution's academic years."

      service={{
        list: academicsService.getAcademicYears,
        create: academicsService.createAcademicYear,
        update: academicsService.updateAcademicYear,
        remove: academicsService.deleteAcademicYear,
      }}

      fields={[
        {
          name: "name",
          label: "Academic Year Name",
          placeholder: "e.g. Academic Year 2026",
        },
        {
          name: "start_date",
          label: "Start Date",
          type: "date",
        },
        {
          name: "end_date",
          label: "End Date",
          type: "date",
        },
        {
          name: "is_active",
          label: "Active Academic Year",
          type: "checkbox",
          required: false,
        },
      ]}

      columns={[
        {
          key: "name",
          label: "Academic Year",
          render: (year) =>
            year.name ||
            `${year.start_date} - ${year.end_date}`,
        },
        {
          key: "start_date",
          label: "Start Date",
        },
        {
          key: "end_date",
          label: "End Date",
        },
        {
          key: "is_active",
          label: "Status",
          render: (year) => (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                year.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {year.is_active ? "Active" : "Inactive"}
            </span>
          ),
        },
        {
          key: "actions",
          label: "Activation",
          render: (year) => (
            year.is_active ? (
              <span className="text-green-600 font-medium">
                Current Year
              </span>
            ) : (
              <button
                onClick={() => handleActivate(year)}
                disabled={activating === year.id}
                className="text-blue-600 hover:underline disabled:opacity-50"
              >
                {activating === year.id
                  ? "Activating..."
                  : "Activate"}
              </button>
            )
          ),
        },
      ]}

      emptyMessage="No academic years have been created yet."
    />
  );
};

export default AcademicYears;
