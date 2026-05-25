import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Tent, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { client } from "../../lib/api/client";
import { organizerSession } from "../../lib/organizer-session";

export function OrganizerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await client.post<any>("/organizer/login", { email, password });

      if (res.success && res.token) {
        organizerSession.save({
          name: res.name || "Organizer",
          email,
          campId: res.campId || "",
          hasChangedPassword: res.hasChangedPassword ?? false,
          firstLogin: res.firstLogin ?? !res.hasChangedPassword,
          accessExpiresAt: res.accessExpiresAt || new Date(Date.now() + 30 * 86_400_000).toISOString(),
        });

        if (res.firstLogin) {
          navigate("/organizer/set-password");
        } else {
          toast.success(`Welcome back, ${res.name || "Organizer"}!`);
          navigate("/organizer/dashboard");
        }
      } else {
        toast.error(res.error || "Login failed. Please check your credentials.");
      }
    } catch (err: any) {
      const msg: string = err.message || "Login failed.";
      if (msg.toLowerCase().includes("expired")) {
        navigate("/organizer/expired");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
              <Tent className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">WombTo18</h1>
            <p className="text-sm font-bold text-emerald-600 mt-1 tracking-wide">Camp Organizer Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold text-sm">Email Address</Label>
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="h-11 rounded-xl border-slate-200 focus-visible:ring-emerald-200 focus-visible:border-emerald-400"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold text-sm">Password</Label>
              <div className="relative">
                <Input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 rounded-xl border-slate-200 focus-visible:ring-emerald-200 focus-visible:border-emerald-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm shadow-emerald-500/20 transition-colors mt-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Login to My Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-7 text-xs text-slate-400 text-center leading-relaxed">
            Your credentials were sent to your email when your request was approved.
            <br />
            Need help?{" "}
            <a href="mailto:support@wombto18.org" className="text-emerald-600 hover:text-emerald-700 font-medium">
              support@wombto18.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
