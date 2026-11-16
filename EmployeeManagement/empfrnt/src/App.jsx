
import { Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "./Components/DashboardLayout";
import Dashboard from "./Components/Dashboard";
import Employees from "./Components/Employees";
import Departments from "./Components/Departments";
import Attendance from "./Components/Attendance";
import LeaveManagement from "./Components/LeaveManagement";
import PayRoll from "./Components/PayRoll";
import Reports from "./Components/Reports";
import LogIn from "./Components/LogIn";
import SignUp from "./Components/SignUp";
import Landingpage from "./Components/Landingpage";
import ProtectedRoute from "./Components/context/ProtectedRoute";

function App() {
  return (
    <Routes>

      {/* PUBLIC ROUTES */}
      <Route path="/login" element={<LogIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/" element={<Landingpage />} />

      {/* PROTECTED ROUTES */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/employees"
            element={<Employees />}
          />

          <Route
            path="/departments"
            element={<Departments />}
          />

          <Route
            path="/attendance"
            element={<Attendance />}
          />

          <Route
            path="/payroll"
            element={<PayRoll />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/leaves"
            element={<LeaveManagement />}
          />

        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}

export default App;
