// src/components/ClerkLogin.jsx
import React, { useEffect, useState } from "react";
import { SignIn, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ClerkLogin = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [checkingProfile, setCheckingProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!isLoaded || !user) return;

      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return; // safety: Clerk user with no email

      setCheckingProfile(true);

      try {
        const { data, error } = await supabase
          .from("students")
          .select("enrollment_number")
          .eq("email", email)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Supabase error:", error);
          return; // don’t redirect on DB errors
        }

        if (data) {
          // Student exists in Supabase
          navigate("/dashboard", { replace: true });
        } else {
          // New student → complete profile
          navigate("/complete-profile", { replace: true });
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfile();
  }, [user, isLoaded, navigate]);

  if (checkingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
        <p className="text-[#6B7280] text-lg">Checking your profile...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
      <SignIn
        path="/clerk-login"
        routing="path"
        afterSignInUrl="/clerk-login"
        afterSignUpUrl="/clerk-login"
        appearance={{
          elements: {
            formButtonPrimary:
              "bg-[#6C63FF] hover:bg-[#5B55E3] text-white font-semibold py-2 px-4 rounded-lg transition-all",
            formButtonPrimary_disabled: "bg-[#6C63FF]/50 cursor-not-allowed",
            formFieldInput:
              "border border-[#E5E7EB] focus:ring-[#6C63FF] focus:border-[#6C63FF] text-[#111827] placeholder-[#6B7280]",
            dividerLine: "bg-[#E5E7EB]",
            formFieldLabel: "text-[#6B7280]",
            footerActionText: "text-[#6B7280]",
            footerActionLink: "text-[#6C63FF] hover:text-[#5B55E3]",
            headerTitle: "text-[#111827]",
            headerSubtitle: "text-[#6B7280]",
          },
        }}
      />
    </div>
  );
};

export default ClerkLogin;
