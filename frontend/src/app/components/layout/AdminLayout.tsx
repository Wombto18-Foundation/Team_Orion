import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard, Users, FileBarChart, LogOut, Menu, X, ChevronLeft,
  Newspaper, BookOpen, Tent, Bell, Shield, Wallet, FileStack, ChevronDown, MapPin,
} from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../../lib/auth";
import { getAdminSession } from "../../lib/admin-session";
import { AdminStateProvider, useAdminState } from "../../context/AdminStateContext";
import { INDIA_STATES } from "../../lib/india-states";
import { toast } from "sonner";

const SUPER_ADMIN_LINKS = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/sub-admins", label: "Sub-Admins", icon: Shield },
  { href: "/admin/donors", label: "Supporters", icon: Users },
  { href: "/admin/volunteers", label: "Volunteers", icon: Users },
  { href: "/admin/camps", label: "Health Camps", icon: Tent },
  { href: "/admin/camp-requests", label: "Camp Requests", icon: FileStack },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: Wallet },
  { href: "/admin/reports", label: "Analytics", icon: FileBarChart },
  { href: "/admin/blog", label: "Journal", icon: Newspaper },
  { href: "/admin/case-studies", label: "Impact Stories", icon: BookOpen },
];

const STATE_ADMIN_LINKS = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/donors", label: "Supporters", icon: Users },
  { href: "/admin/volunteers", label: "Volunteers", icon: Users },
  { href: "/admin/camps", label: "Health Camps", icon: Tent },
  { href: "/admin/camp-requests", label: "Camp Requests", icon: FileStack },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: Wallet },
  { href: "/admin/reports", label: "Analytics", icon: FileBarChart },
  { href: "/admin/blog", label: "Journal", icon: Newspaper },
  { href: "/admin/case-studies", label: "Impact Stories", icon: BookOpen },
];

function RegionSelector() {
  const { selectedState, setSelectedState } = useAdminState();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
      >
        <MapPin className="h-3.5 w-3.5 text-slate-500" />
        <span>{selectedState ?? "All States"}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 max-h-72 overflow-y-auto"
          >
            <button
              onClick={() => { setSelectedState(null); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${!selectedState ? "text-black bg-slate-50" : "text-slate-600 hover:bg-slate-50"}`}
            >
              All States
            </button>
            <div className="h-px bg-slate-100 my-1" />
            {INDIA_STATES.map((s) => (
              <button
                key={s}
                onClick={() => { setSelectedState(s); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${selectedState === s ? "text-black font-bold bg-slate-50" : "text-slate-600 hover:bg-slate-50"}`}
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminLayoutInner({
  isSuperAdmin,
  adminName,
  adminEmail,
}: {
  isSuperAdmin: boolean;
  adminName: string;
  adminEmail: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { selectedState, setSelectedState, isStateAdmin, lockedState } = useAdminState();

  const navLinks = isSuperAdmin ? SUPER_ADMIN_LINKS : STATE_ADMIN_LINKS;
  const roleLabel = isSuperAdmin ? "Super Admin" : `${lockedState ?? ""} Admin`;

  const handleLogout = () => {
    logout();
    auth.logout();
    navigate("/donor/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans selection:bg-black selection:text-white">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-white transform transition-transform duration-500 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 flex flex-col border-r border-slate-200/60 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-24 px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xl leading-none tracking-tighter">W.</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none mb-1">Foundation</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {roleLabel}
              </p>
            </div>
          </Link>
          <button className="lg:hidden text-slate-400 hover:text-black transition-colors" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-0.5 overflow-y-auto">
          <p className="px-4 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Menu</p>
          {navLinks.map((link) => {
            const isActive =
              location.pathname === link.href ||
              (link.href === "/admin/dashboard" && location.pathname === "/admin");
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`group relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                  isActive ? "text-black" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activePillAdmin"
                    className="absolute inset-0 bg-slate-100/80 rounded-xl mix-blend-multiply"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <link.icon className={`h-4 w-4 relative z-10 ${isActive ? "text-black" : "text-slate-400 group-hover:text-slate-600"}`} />
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 mx-4 mb-4 border border-slate-200 rounded-2xl bg-white relative overflow-hidden group hover:border-slate-300 transition-colors">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 bg-black rounded-lg">
                <AvatarFallback className="bg-black text-white text-[11px] font-bold">
                  {adminName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">{adminName}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate max-w-[120px]">{adminEmail}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center px-1">
            <Link to="/" className="text-[11px] font-semibold text-slate-500 hover:text-black flex-1 flex items-center gap-1.5 transition-colors">
              <ChevronLeft className="h-3 w-3" /> Back
            </Link>
            <button
              onClick={handleLogout}
              className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-20 px-6 lg:px-8 flex items-center justify-between gap-4">
          <button className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-black transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:flex items-center gap-2">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Platform Operational</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {isSuperAdmin && <RegionSelector />}
            {isStateAdmin && lockedState && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-xs font-bold text-blue-700">
                <MapPin className="h-3 w-3" /> {lockedState}
              </span>
            )}
            <button className="relative p-2 text-slate-400 hover:text-black transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <button
              onClick={() => navigate("/admin/camps/create")}
              className="bg-black hover:bg-slate-800 text-white text-[13px] font-bold px-5 py-2.5 rounded-full transition-all active:scale-95 shadow-md shadow-black/10"
            >
              Create Campaign
            </button>
          </div>
        </header>

        {/* State context banner (Super Admin only when state selected) */}
        {isSuperAdmin && selectedState && (
          <div className="bg-amber-50 border-b border-amber-100 px-6 lg:px-8 py-2.5 flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-800">
              Viewing and acting as: <span className="font-black">{selectedState}</span> region
            </p>
            <button
              onClick={() => setSelectedState(null)}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 transition-colors"
            >
              Clear <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="p-8 lg:p-12 max-w-[1600px] mx-auto min-h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState<{
    isSuperAdmin: boolean;
    isStateAdmin: boolean;
    adminName: string;
    adminEmail: string;
    lockedState: string | null;
  } | null>(null);

  useEffect(() => {
    const session = getAdminSession();
    if (!session) {
      toast.error("Please log in to access the admin panel.");
      navigate("/donor/login", { replace: true });
      return;
    }
    const superAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
    const stateAdmin = session.role === "STATE_ADMIN";
    setSessionData({
      isSuperAdmin: superAdmin,
      isStateAdmin: stateAdmin,
      adminName: session.name || "Admin",
      adminEmail: session.identifier,
      lockedState: session.adminState ?? null,
    });
  }, [navigate]);

  if (!sessionData) return null;

  return (
    <AdminStateProvider
      isSuperAdmin={sessionData.isSuperAdmin}
      isStateAdmin={sessionData.isStateAdmin}
      adminName={sessionData.adminName}
      lockedState={sessionData.lockedState}
    >
      <AdminLayoutInner
        isSuperAdmin={sessionData.isSuperAdmin}
        adminName={sessionData.adminName}
        adminEmail={sessionData.adminEmail}
      />
    </AdminStateProvider>
  );
}
