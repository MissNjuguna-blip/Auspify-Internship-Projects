
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  BookOpen,
  CalendarDays,
  Loader2,
  GraduationCap,
} from "lucide-react";
import api from "../context/api/api";

// import api from "../context/api/api";

const StudentEnrollments = () => {
  const { id } = useParams();

  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);

        const response = await api.get(
          "academics/enrollments/",
          {
            params: { student: id },
          }
        );

        const data = response.data;

        setEnrollments(
          Array.isArray(data)
            ? data
            : data.results || []
        );

      } catch (err) {
        setError(
          err.response?.data?.detail ||
          "Unable to retrieve student enrollments."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [id]);

  return (
    <div className="space-y-5">

      <div>
        <h2 className="text-xl font-bold text-slate-800">
          Academic Enrollments
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          View the student's classroom and academic year history.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={28} />
        </div>
      ) : enrollments.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-14 text-center">
          <GraduationCap
            size={38}
            className="mx-auto text-slate-300"
          />

          <h3 className="mt-3 font-semibold text-slate-700">
            No enrollments found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            This student has not been enrolled in a classroom yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >

              <div className="flex items-center gap-3">

                <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                  <BookOpen size={23} />
                </div>

                <div>
                  <h3 className="font-semibold text-slate-800">
                    {enrollment.classroom_name || "Classroom"}
                  </h3>

                  <p className="text-xs text-slate-500">
                    {enrollment.academic_year_name || "Academic Year"}
                  </p>
                </div>

              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays size={17} className="text-blue-600" />

                  <span>Enrollment Date:</span>

                  <strong className="ml-auto text-slate-800">
                    {enrollment.enrollment_date || "—"}
                  </strong>
                </div>

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
};

export default StudentEnrollments;
