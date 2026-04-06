"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

// Assuming you have a Logo component. If not, replace <Logo /> with an image or text.
import Logo from "@/components/Logo"; 

const RegisterPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // FormData relies on the 'name' attributes of your HTML inputs
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    const fullName = formData.get("fullName");
    const startupName = formData.get("startupName");

    try {
      await axios.post("/api/auth/register", {
        email,
        password,
        fullName,
        startupName,
      });
      
      router.push("/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setErrorMsg(error.response.data.error || "Something went wrong");
      } else {
        setErrorMsg("An unexpected network error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans text-slate-900">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <Logo />
          <h2 className="text-xl font-bold text-slate-800 mt-4">
            Register your Startup
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Start managing your team&apos;s budget today.
          </p>
        </div>

        {/* Fixed: Changed 'error' to 'errorMsg' to match your state variable */}
        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Startup Name
            </label>
            {/* Added name="startupName", removed value/onChange */}
            <input
              type="text"
              name="startupName"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
              placeholder="Acme Corp"
            />
          </div>
          
          {/* Added Full Name input so the API receives the required data */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Your Full Name
            </label>
            <input
              type="text"
              name="fullName"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Founder Email
            </label>
            {/* Added name="email", removed value/onChange */}
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
              placeholder="founder@acme.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Password
            </label>
            {/* Added name="password", removed value/onChange */}
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition shadow-md disabled:opacity-70 mt-4"
          >
            {loading ? "Registering..." : "Create Workspace"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;