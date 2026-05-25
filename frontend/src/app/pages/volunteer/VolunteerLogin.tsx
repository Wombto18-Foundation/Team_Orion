import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Heart, ArrowRight, ArrowLeft, Loader2, Zap, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { client } from "../../lib/api/client";

export function VolunteerLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnUrl') || "/volunteer/dashboard";

  // Login form state
  const [emailLogin, setEmailLogin] = useState(searchParams.get("email") || "");
  const [passwordLogin, setPasswordLogin] = useState("");

  // Register form state
  const [regData, setRegData] = useState({
    donorId: "", // Optional, to upgrade account 
    email: "",
    name: "",
    mobile: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Direct login simulation for now — will hit actual API
      const res = await client.post<any>("/donor/login", { email: emailLogin, password: passwordLogin });
      
      if (res.token) {
        // Direct login success - no OTP requested
        const session = {
          identifier: emailLogin,
          eligible: res.eligible ?? true,
          token: res.token,
          name: res.name,
          donorId: res.donorId,
          volunteerId: res.volunteerId,
          role: res.role || 'VOLUNTEER',
          adminState: res.state ?? null,
        };
        localStorage.setItem("donor_session", JSON.stringify(session));
        toast.success("Welcome back!");
        window.location.href = res.redirect || returnTo;
      } else if (res.success && res.otpSent) {
        if (res.devOtp) sessionStorage.setItem("dev_otp", res.devOtp);
        if (res.devMobileOtp) sessionStorage.setItem("dev_mobile_otp", res.devMobileOtp);
        
        // Send to OTP page locally
        navigate("/donor/verify-otp", { state: { identifier: emailLogin, role: 'VOLUNTEER', requiresMobileOtp: res.requiresMobileOtp, eligible: res.eligible ?? false } });
      } else {
        toast.error(res.message || "Invalid response from server");
      }
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (regData.donorId) {
        // Upgrade existing donor to volunteer
        await client.post("/volunteers/register", {
          donorId: regData.donorId,
          city: "New Delhi", // Placeholder for actual form fields
        });
        toast.success("Successfully upgraded to Volunteer!");
        // We'd typically log them in automatically here
        navigate("/login");
      } else {
        // New user registering directly as volunteer
        const res = await client.post<any>("/donor/register", {
          ...regData,
          isVolunteer: true
        });
        
        if (res.otpSent) {
          if (res.devOtp) sessionStorage.setItem("dev_otp", res.devOtp);
          if (res.devMobileOtp) sessionStorage.setItem("dev_mobile_otp", res.devMobileOtp);
          toast.success("Account created! Please verify your email and mobile.");
          navigate("/donor/verify-otp", { 
            state: { 
              identifier: regData.email, 
              role: 'VOLUNTEER',
              requiresMobileOtp: res.requiresMobileOtp,
              eligible: false
            } 
          });
        } else {
          toast.success("Registration success! Please login.");
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFAF0] p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500 opacity-5 blur-[120px]" />
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-amber-100/50 p-8 relative z-10 animate-in zoom-in-95 duration-500">
        <button onClick={() => navigate("/login")} className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="text-center mb-8 mt-6">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4">
            <Zap className="h-8 w-8 text-white fill-current" />
          </div>
          <h2 className="text-2xl font-black text-amber-950">Volunteer Hub</h2>
          <p className="text-sm font-bold text-amber-600/60 uppercase tracking-widest mt-1">
            {isLogin ? "Welcome Back" : "Join the Movement"}
          </p>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-amber-900 font-bold">Email Address</Label>
              <Input required type="email" value={emailLogin} onChange={e => setEmailLogin(e.target.value)} className="bg-amber-50/50 border-amber-100 placeholder:text-amber-200 h-12 rounded-xl" placeholder="volunteer@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-amber-900 font-bold">Password</Label>
              <div className="relative">
                <Input 
                  required 
                  type={showPassword ? "text" : "password"} 
                  value={passwordLogin} 
                  onChange={e => setPasswordLogin(e.target.value)} 
                  className="bg-amber-50/50 border-amber-100 h-12 rounded-xl pr-10" 
                  placeholder="••••••••" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end pr-1">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password?type=VOLUNTEER")}
                  className="text-[11px] font-bold text-amber-600/60 hover:text-amber-600 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </div>
            
            <Button disabled={loading} type="submit" className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-xl shadow-lg shadow-amber-500/25 mt-4">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In to Dashboard"}
              {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-xs text-amber-800 font-medium mb-4 flex items-start gap-3">
              <Heart className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p>Already a donor? Enter your Donor ID below to instantly upgrade your account to a Volunteer!</p>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-amber-900 font-bold">Donor ID (Optional)</Label>
              <Input value={regData.donorId} onChange={e => setRegData({...regData, donorId: e.target.value})} className="bg-amber-50/50 border-amber-100 h-11 rounded-xl" placeholder="e.g. DNR1234" />
            </div>
            {!regData.donorId && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-amber-900 font-bold">Full Name</Label>
                  <Input required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} className="bg-amber-50/50 border-amber-100 h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-amber-900 font-bold">Email</Label>
                  <Input required type="email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} className="bg-amber-50/50 border-amber-100 h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-amber-900 font-bold">Mobile</Label>
                  <Input required type="tel" value={regData.mobile} onChange={e => setRegData({...regData, mobile: e.target.value})} className="bg-amber-50/50 border-amber-100 h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-amber-900 font-bold">Create Password</Label>
                  <Input required type="password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} className="bg-amber-50/50 border-amber-100 h-11 rounded-xl" />
                </div>
              </>
            )}
            
            <Button disabled={loading} type="submit" className="w-full h-14 bg-amber-900 hover:bg-amber-800 text-white font-black text-sm rounded-xl mt-4">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : regData.donorId ? "Upgrade to Volunteer" : "Create Account"}
            </Button>
          </form>
        )}

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-500 font-medium">
            {isLogin ? "Want to join our ground forces?" : "Already a volunteer?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-amber-600 font-black hover:text-amber-800 hover:underline transition-colors focus:outline-none"
            >
              {isLogin ? "Register Now" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
