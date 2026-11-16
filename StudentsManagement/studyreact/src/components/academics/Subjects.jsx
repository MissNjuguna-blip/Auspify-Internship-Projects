
import React from "react";
import ResourceManager from "./ResourceManager";
// import { academicsService } from "./academicsService";
import { academicsService } from "../context/api/academicsService";

const Subjects = () => {
  return (
    <ResourceManager
      title="Subjects"
      description="Manage subjects taught in your institution."
      service={{
        list: academicsService.getSubjects,
        create: academicsService.createSubject,
        update: academicsService.updateSubject,
        remove: academicsService.deleteSubject,
      }}
      fields={[
        {
          name: "name",
          label: "Subject Name",
          placeholder: "e.g. Mathematics",
        },
        {
          name: "code",
          label: "Subject Code",
          placeholder: "e.g. MAT101",
          required: false,
        },
      ]}
      columns={[
        { key: "name", label: "Subject Name" },
        { key: "code", label: "Subject Code" },
      ]}
      emptyMessage="No subjects have been added yet."
    />
  );
};

export default Subjects;
