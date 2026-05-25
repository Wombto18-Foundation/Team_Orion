import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { LayoutDashboard, Users, QrCode, HelpCircle, LogOut, Menu, X, Tent } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { organizerSession } from "../../lib/organizer-session";
import { client } from "../../lib/api/client";

const navLinks = [
  { href: "/organizer/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/organizer/volunteers", label: "Volunteers", icon: Users },
  { href: "/organizer/attendance", label: "Attendance", icon: QrCode },
  { href: "/organizer/help", label: "Help", icon: HelpCircle },
];

function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
  const label = `Valid until ${new Date(expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;

  if (daysLeft > 7) {
    return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">{label}</span>;
  }
  if (daysLeft >= 3) {
    return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">{daysLeft} days left</span>;
  }
  return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700 animate-pulse">{daysLeft} day{daysLeft === 1 ? "" : "s"} left</span>;
}

export function OrganizerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [campName, setCampName] = useState("My Camp");
  const [session, setSession] = useState(organizerSession.get());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const s = organizerSession.get();
    if (!s) { navigate("/organizer/login", { replace: true }); return; }
    if (!s.hasChangedPassword) { navigate("/organizer/set-password", { replace: true }); return; }
    if (organizerSession.isExpired(s)) { navigate("/organizer/expired", { replace: true }); return; }
    setSession(s);

    client.get<any>("/organizer/camp").then((res) => {
      if (res.camp?.name) setCampName(res.camp.name);
    }).catch(() => {});
  }, [navigate]);

  const handleLogout = async () => {
    await client.post("/organizer/logout").catch(() => {});
    organizerSession.clear();
    navigate("/organizer/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans selection:bg-emerald-900 selection:text-white">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-slate-200/60 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen lg:shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <Tent className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Camp Organizer</p>
              <h1 className="text-sm font-black text-slate-900 truncate">{campName}</h1>
            </div>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-black transition-colors ml-2 shrink-0" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`relative flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                  isActive ? "text-emerald-700 bg-emerald-50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <link.icon className={`h-4 w-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-100">
          <div className="px-2 mb-3">
            <p className="text-xs font-bold text-slate-900 leading-tight truncate">{session?.name || "Organizer"}</p>
            <p className="text-[11px] text-slate-400 font-medium truncate">{session?.email || ""}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden p-1.5 -ml-1 text-slate-500 hover:text-black transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold text-slate-900 hidden sm:block truncate">{campName}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {session?.accessExpiresAt && <ExpiryBadge expiresAt={session.accessExpiresAt} />}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400 hover:text-rose-500 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8 max-w-[1400px] mx-auto min-h-full">
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
