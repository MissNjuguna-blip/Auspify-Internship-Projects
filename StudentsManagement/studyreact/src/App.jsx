import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
// Authentication
import { AuthProvider } from "./components/context/AuthContext";
import ProtectedRoute from "./components/context/ProtectedRoute";
// Public components
import LogIn from "./components/LogIn";
import SignUp from "./components/SignUp";
import LandingPage from "./components/LandingPage";

// Dashboard layout
import DashboardLayout from "./components/DashboardLayout";
// Guardian components
import Guardian from "./components/Guardian/Guardian";
import GuardianDetails from "./components/Guardian/GuardianDetails";
import GuardianForm from "./components/Guardian/GuardianForm";
import StudentGuardian from "./components/Guardian/StudentGuardian";
import Students from "./components/students/Students";
import StudentRegister from "./components/students/StudentRegister";
import StudentDetails from "./components/students/StudentDetails";
import StudentEdit from "./components/students/StudentEdit";
import StudentEnrollments from "./components/students/StudentEnrollments";
import Academics from "./components/academics/Academics";
import StaffForm from "./components/Staff/StaffForm";
import StaffDetails from "./components/Staff/StaffDetails";
import StaffAttendance from "./components/Staff/StaffAttendance";
import StaffFinance from "./components/Staff/StaffFinance";
import AcademicYears from "./components/academics/AcademicYears";
import Terms from "./components/academics/Terms";
import Classrooms from "./components/academics/Classrooms";
import Subjects from "./components/academics/Subjects";
import Enrollments from "./components/academics/Enrollments";
import Finance from "./components/Finance/Finance";
import Dashboard from "./components/Dashboard";
// import Students from "./components/students/Students";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/signup" element={<SignUp />} />
          {/* PROTECTED ROUTES */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* DASHBOARD */}
              <Route
                path="/dashboard"
                element={<Dashboard/>}/>
              {/* STUDENTS */}
              <Route path="/students" element={<Students />} />
              <Route path="/students/register" element={<StudentRegister />} />
              <Route path="/students/:id" element={<StudentDetails />} />
              <Route path="/students/:id/edit" element={<StudentEdit />} />
              <Route path="/students/:id/enrollments" element={<StudentEnrollments />} />
              <Route path='/students/enrollments' element={<StudentEnrollments/>}/>
              {/* ACADEMICS */}
              <Route path="/academics" element={<Academics />} />
              <Route path="/academics/academic-years" element={<AcademicYears />} />
              <Route path="/academics/terms" element={<Terms />} />
              <Route path="/academics/classrooms" element={<Classrooms />} />
              <Route path="/academics/subjects" element={<Subjects />} />
              <Route path="/academics/departments" element={<Enrollments />} />
              {/* GUARDIANS */}
              <Route path="/guardians" element={<Guardian />} />
              <Route path="/guardians/register" element={<GuardianForm />} />
              <Route path="/guardians/:id" element={<GuardianDetails />} />
              <Route path="/student-guardians" element={<StudentGuardian />} />
              {/* STAFF */}
              {/* <Route path="/staff" element={<Staff />} /> */}
              <Route path="/staff/register" element={<StaffForm />} />
              <Route path="/staff/:id" element={<StaffDetails />} />
              <Route path="/staff/attendance" element={<StaffAttendance />} />
              <Route path="/staff/finance" element={<StaffFinance />} />
              {/* FINANCE */}
              <Route path="/finance" element={<Finance />} />
            </Route>
          </Route>

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
