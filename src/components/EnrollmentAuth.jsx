// src/components/EnrollmentAuth.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function EnrollmentAuth() {
  const [enrollment, setEnrollment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCheckEnrollment = async () => {
    setError("");
    const trimmedEnrollment = enrollment.trim();

    if (!trimmedEnrollment) {
      setError("⚠️ Please enter your enrollment ID.");
      return;
    }

    setLoading(true);
    try {
      // query students table by enrollment_number
      const { data, error: supaError } = await supabase
        .from("students")
        .select("enrollment_number, clerk_user_id")
        .eq("enrollment_number", trimmedEnrollment)
        .maybeSingle(); // safe: returns null if not found

      if (supaError) {
        console.error("Supabase error:", supaError);
        setError("Something went wrong. Please try again.");
        return;
      }

      if (!data) {
        setError("❌ Enrollment not found. Access denied.");
        return;
      }

      // ✅ Found the student
      if (data.clerk_user_id) {
        // already linked to Clerk → go directly to dashboard
        navigate("/dashboard");
      } else {
        // not yet linked → go to Clerk login, carry enrollment
        navigate("/clerk-login", {
          state: { enrollmentNumber: data.enrollment_number },
        });
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB] px-4">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl bg-white border border-[#E5E7EB]">
        <h2 className="text-3xl font-bold text-center mb-2 text-[#6C63FF]">
          Student Login
        </h2>
        <p className="text-center text-[#6B7280] mb-6">
          Verify your enrollment ID to continue
        </p>

        <input
          type="text"
          placeholder="Enter Enrollment ID"
          value={enrollment}
          onChange={(e) => setEnrollment(e.target.value)}
          className="w-full px-4 py-3 mb-4 border border-[#E5E7EB] rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-[#6C63FF] text-[#111827] 
                     placeholder-[#6B7280]"
        />

        <button
          onClick={handleCheckEnrollment}
          disabled={loading}
          className="w-full py-3 rounded-lg font-semibold text-white 
                     bg-[#6C63FF] hover:bg-[#5B55E3] transition-colors 
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Verifying..." : "Verify Enrollment"}
        </button>

        {error && (
          <p className="text-[#FF6584] text-center mt-4 font-medium">{error}</p>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-[#6B7280]">
            Having trouble?{" "}
            <a
              href="/support"
              className="text-[#6C63FF] font-medium hover:underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
