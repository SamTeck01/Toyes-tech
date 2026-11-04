import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Lock, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock Authentication Logic
    setTimeout(() => {
      if (username === "admin" && password === (import.meta.env.VITE_ADMIN_PASSWORD || "toyes2026")) {
        localStorage.setItem("toyes_admin_session", "active");
        toast.success("Welcome back, Admin.");
        navigate("/admin/dashboard");
      } else {
        toast.error("Invalid credentials.");
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col uppercase-none font-sans">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-black/50 mb-3 block">Admin Login</span>
            <h1 className="text-4xl font-bold tracking-tight">Welcome Back</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-black/40 px-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 group-focus-within:text-black transition-colors" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent focus:border-black focus:bg-white px-12 py-4 text-sm outline-none transition-all rounded-2xl"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-black/40 px-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 group-focus-within:text-black transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent focus:border-black focus:bg-white px-12 py-4 text-sm outline-none transition-all rounded-2xl"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-5 px-8 rounded-2xl text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-primary/10"
            >
              {isLoading ? "Checking..." : "Login"}
            </button>
          </form>

        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminLogin;
