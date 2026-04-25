import { useState, useEffect } from "react";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import logo from "../assets/logo-1.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* 🔥 AUTO CLEAR ERROR AFTER 3s */
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [error]);

  /* 🔐 VALIDATION FUNCTION */
  const validate = () => {
    if (!email.trim() && !password.trim()) {
      return "Username and password are required";
    }

    if (!email.trim()) {
      return "Username is required";
    }

    if (!password.trim()) {
      return "Password is required";
    }

    if (password.length < 4) {
      return "Password must be at least 4 characters";
    }
    if (email.length > 20) {
      return "Username must be less than 20 characters";
    }

    return null;
  };

  const handleLogin = async () => {
    setError("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const res = await window.electronAPI.login({
        username: email,
        password: password,
      });

      if (res.success) {
        // 🔥 store full user data
        localStorage.setItem("user", JSON.stringify(res.data));

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("username", res.data.username);

        window.electronAPI.startRecorder();
      } else {
        setError(res.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Server error. Please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center px-4">
      {/* LOGO */}
      <div className="mb-10 flex items-center">
        <img
          src={logo}
          alt="Logo"
          className="w-50 h-14 object-contain drop-shadow-[0_0_12px_rgba(59,130,246,0.7)]"
        />
      </div>

      {/* CARD */}
      <div className="w-full max-w-sm bg-[#0f0f0f] border border-[#1f2937] rounded-2xl p-6 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
        {/* USERNAME */}
        <div className="relative mb-5">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />

          <input
            type="text"
            placeholder="Enter your Username"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(""); // 🔥 clear error on typing
            }}
            className="w-full pl-10 pr-3 py-3 rounded-xl bg-[#111] border border-[#374151] text-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>

        {/* PASSWORD */}
        <div className="relative mb-5">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(""); // 🔥 clear error on typing
            }}
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#111] border border-[#374151] text-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />

          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <p className="text-red-500 text-sm mb-3 text-center animate-pulse">
            {error}
          </p>
        )}

        {/* LOGIN BUTTON */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 rounded-xl text-white font-semibold tracking-wide
          bg-linear-to-r from-blue-600 to-blue-500
          hover:from-blue-700 hover:to-blue-600
          transition duration-200 shadow-lg disabled:opacity-50"
        >
          {loading ? "Logging in..." : "LOGIN"}
        </button>
      </div>
    </div>
  );
}