import React, { useState } from "react";
import AcademicYears from "./AcademicYears";
import Terms from "./Terms";
import Classrooms from "./Classrooms";
import Subjects from "./Subjects";
import Enrollments from "./Enrollments";

const Academics = () => {
  const [activeTab, setActiveTab] = useState("years");

  const tabs = [
    { id: "years", label: "Academic Years" },
    { id: "terms", label: "Terms" },
    { id: "classrooms", label: "Classrooms" },
    { id: "subjects", label: "Subjects" },
    { id: "enrollments", label: "Enrollments" },
  ];

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Academic Management
        </h1>
        <p className="text-sm text-gray-500">
          Manage academic years, terms, classrooms, subjects and enrollments.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 bg-white p-2 border rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 rounded-lg text-sm ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "years" && <AcademicYears />}
      {activeTab === "terms" && <Terms />}
      {activeTab === "classrooms" && <Classrooms />}
      {activeTab === "subjects" && <Subjects />}
      {activeTab === "enrollments" && <Enrollments />}

    </div>
  );
};

export default Academics;
