
import React, { useEffect, useState } from "react";
import ResourceManager from "./ResourceManager";
// import { academicsService } from "./academicsService";
import { academicsService } from "../context/api/academicsService";

const Terms = () => {
  const [years, setYears] = useState([]);

  useEffect(() => {
    academicsService.getAcademicYears()
      .then((response) => {
        const data = response.data;
        setYears(
          Array.isArray(data) ? data : data.results || []
        );
      })
      .catch((error) =>
        console.error("Could not load academic years:", error)
      );
  }, []);

  return (
    <ResourceManager
      title="Terms"
      description="Manage terms within your academic years."
      service={{
        list: academicsService.getTerms,
        create: academicsService.createTerm,
        update: academicsService.updateTerm,
        remove: academicsService.deleteTerm,
      }}
      fields={[
        {
          name: "name",
          label: "Term Name",
          placeholder: "e.g. Term 1",
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
      ]}
      columns={[
        { key: "name", label: "Term" },
        {
          key: "academic_year_name",
          label: "Academic Year",
          render: (term) =>
            term.academic_year_name ||
            term.academic_year?.name ||
            term.academic_year ||
            "—",
        },
        { key: "start_date", label: "Start Date" },
        { key: "end_date", label: "End Date" },
      ]}
      emptyMessage="No academic terms found."
    />
  );
};

export default Terms;
