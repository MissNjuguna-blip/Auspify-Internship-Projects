
// import api from "../context/api/api";
import api from "./api";

// Academic Years
const getAcademicYears = () => api.get("academics/academic-years/");
const createAcademicYear = (data) => api.post("academics/academic-years/", data);
const updateAcademicYear = (id, data) =>
  api.put(`academics/academic-years/${id}/`, data);
const deleteAcademicYear = (id) =>
  api.delete(`academics/academic-years/${id}/`);

const activateAcademicYear = (id) =>
  api.post(`academics/academic-years/${id}/activate/`);

// Terms
const getTerms = () => api.get("academics/terms/");
const createTerm = (data) => api.post("academics/terms/", data);
const updateTerm = (id, data) =>
  api.put(`academics/terms/${id}/`, data);
const deleteTerm = (id) => api.delete(`academics/terms/${id}/`);

// Classrooms
const getClassrooms = () => api.get("academics/classrooms/");
const createClassroom = (data) => api.post("academics/classrooms/", data);
const updateClassroom = (id, data) =>
  api.put(`academics/classrooms/${id}/`, data);
const deleteClassroom = (id) =>
  api.delete(`academics/classrooms/${id}/`);

// Subjects
const getSubjects = () => api.get("academics/subjects/");
const createSubject = (data) => api.post("academics/subjects/", data);
const updateSubject = (id, data) =>
  api.put(`academics/subjects/${id}/`, data);
const deleteSubject = (id) =>
  api.delete(`academics/subjects/${id}/`);

// Enrollments
const getEnrollments = (params = {}) =>
  api.get("academics/enrollments/", { params });

const createEnrollment = (data) =>
  api.post("academics/enrollments/", data);

const updateEnrollment = (id, data) =>
  api.put(`academics/enrollments/${id}/`, data);

const deleteEnrollment = (id) =>
  api.delete(`academics/enrollments/${id}/`);

export const academicsService = {
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  activateAcademicYear,

  getTerms,
  createTerm,
  updateTerm,
  deleteTerm,

  getClassrooms,
  createClassroom,
  updateClassroom,
  deleteClassroom,

  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,

  getEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
};
