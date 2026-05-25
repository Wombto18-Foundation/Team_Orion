import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Tent, Loader2, Eye, EyeOff, CheckCircle2, Coins, Info } from "lucide-react";
import { toast } from "sonner";
import { client } from "../../lib/api/client";
import { organizerSession } from "../../lib/organizer-session";

export function OrganizerSetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [totalCoinPool, setTotalCoinPool] = useState<number | "">("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const session = organizerSession.get();
    if (!session) { navigate("/organizer/login", { replace: true }); return; }
    if (session.hasChangedPassword) { navigate("/organizer/dashboard", { replace: true }); return; }
    setOrgName(session.name);
  }, [navigate]);

  const strengthChecks = [
    { label: "8+ characters", pass: newPassword.length >= 8 },
    { label: "One uppercase letter", pass: /[A-Z]/.test(newPassword) },
    { label: "One number", pass: /\d/.test(newPassword) },
  ];

  const getLocalError = (): string | null => {
    if (newPassword.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(newPassword)) return "Must include at least one uppercase letter.";
    if (!/\d/.test(newPassword)) return "Must include at least one number.";
    if (newPassword !== confirmPassword) return "Passwords do not match.";
    if (!totalCoinPool || Number(totalCoinPool) < 100) return "Coin prize pool must be at least 100 coins.";
    return null;
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const localErr = getLocalError();
    if (localErr) { toast.error(localErr); return; }

    setLoading(true);
    try {
      const res = await client.post<any>("/organizer/set-password", {
        newPassword,
        confirmPassword,
        totalCoinPool: Number(totalCoinPool),
      });
      if (res.success) {
        organizerSession.update({ hasChangedPassword: true, firstLogin: false });
        toast.success("Account set up! Welcome to your dashboard.");
        navigate("/organizer/dashboard", { replace: true });
      } else {
        toast.error(res.error || "Failed to complete setup.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to complete setup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
              <Tent className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900">Welcome, {orgName || "Organizer"}!</h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Set your password and define the coin prize pool volunteers will earn at your camp.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Coin Prize Pool */}
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold text-sm">
                Coin Prize Pool *
              </Label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                <Input
                  required
                  type="number"
                  min={100}
                  step={50}
                  value={totalCoinPool}
                  onChange={(e) => setTotalCoinPool(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 1000"
                  className="h-11 rounded-xl border-slate-200 pl-9"
                />
              </div>
              <div className="flex items-start gap-2 mt-1.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                <Info className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  This pool is divided equally among attending volunteers. E.g. 1000 coins ÷ 10 volunteers = <strong>100 coins each</strong>. Shown publicly on the camp card. Minimum 100 coins.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-1" />

            {/* New Password */}
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold text-sm">New Password *</Label>
              <div className="relative">
                <Input
                  required
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 rounded-xl border-slate-200 pr-10"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2 space-y-1.5">
                  {strengthChecks.map((c) => (
                    <div key={c.label} className={`flex items-center gap-2 text-xs font-medium transition-colors ${c.pass ? "text-emerald-600" : "text-slate-400"}`}>
                      <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${c.pass ? "text-emerald-500" : "text-slate-300"}`} />
                      {c.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold text-sm">Confirm Password *</Label>
              <div className="relative">
                <Input
                  required
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`h-11 rounded-xl pr-10 ${confirmPassword && confirmPassword !== newPassword ? "border-red-300 focus-visible:border-red-400" : "border-slate-200"}`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-red-500 font-medium mt-1">Passwords do not match.</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Complete Setup"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
