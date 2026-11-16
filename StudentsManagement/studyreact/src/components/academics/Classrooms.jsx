
import React from "react";
import ResourceManager from "./ResourceManager";
// import { academicsService } from "./academicsService";
import { academicsService } from "../context/api/academicsService";

const Classrooms = () => {
  return (
    <ResourceManager
      title="Classrooms"
      description="Create and manage institution classrooms."
      service={{
        list: academicsService.getClassrooms,
        create: academicsService.createClassroom,
        update: academicsService.updateClassroom,
        remove: academicsService.deleteClassroom,
      }}
      fields={[
        {
          name: "name",
          label: "Classroom Name",
          placeholder: "e.g. Grade 10 East",
        },
      ]}
      columns={[
        { key: "name", label: "Classroom Name" },
      ]}
      emptyMessage="No classrooms have been created yet."
    />
  );
};

export default Classrooms;
