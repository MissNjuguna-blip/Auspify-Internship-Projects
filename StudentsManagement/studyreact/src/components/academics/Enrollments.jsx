import React, { useEffect, useState } from "react";
import ResourceManager from "./ResourceManager";
import { academicsService } from "../context/api/academicsService";
const Enrollments = () => {
  const [years, setYears] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [yearResponse, classroomResponse] =
          await Promise.all([
            academicsService.getAcademicYears(),
            academicsService.getClassrooms(),
          ]);

        const yearData = yearResponse.data;
        const classroomData = classroomResponse.data;

        setYears(
          Array.isArray(yearData)
            ? yearData
            : yearData.results || []
        );

        setClassrooms(
          Array.isArray(classroomData)
            ? classroomData
            : classroomData.results || []
        );
      } catch (error) {
        console.error("Unable to load enrollment options:", error);
      }
    };

    loadOptions();
  }, []);

  return (
    <ResourceManager
      title="Enrollments"
      description="Manage student classroom enrollments."
      service={{
        list: academicsService.getEnrollments,
        create: academicsService.createEnrollment,
        update: academicsService.updateEnrollment,
        remove: academicsService.deleteEnrollment,
      }}
      fields={[
        {
          name: "student",
          label: "Student ID",
          type: "number",
          placeholder: "Enter student ID",
        },
        {
          name: "classroom",
          label: "Classroom",
          type: "select",
          options: classrooms.map((classroom) => ({
            value: classroom.id,
            label: classroom.name,
          })),
        },
        {
          name: "academic_year",
          label: "Academic Year",
          type: "select",
          options: years.map((year) => ({
            value: year.id,
            label: year.name ||
              `${year.start_date} - ${year.end_date}`,
          })),
        },
      ]}
      columns={[
        {
          key: "student_name",
          label: "Student",
          render: (enrollment) =>
            enrollment.student_name ||
            enrollment.student?.full_name ||
            enrollment.student?.username ||
            enrollment.student ||
            "—",
        },
        {
          key: "classroom_name",
          label: "Classroom",
          render: (enrollment) =>
            enrollment.classroom_name ||
            enrollment.classroom?.name ||
            enrollment.classroom ||
            "—",
        },
        {
          key: "academic_year_name",
          label: "Academic Year",
          render: (enrollment) =>
            enrollment.academic_year_name ||
            enrollment.academic_year?.name ||
            enrollment.academic_year ||
            "—",
        },
        {
          key: "enrollment_date",
          label: "Enrollment Date",
        },
      ]}
      emptyMessage="No student enrollments found."
    />
  );
};

export default Enrollments;
