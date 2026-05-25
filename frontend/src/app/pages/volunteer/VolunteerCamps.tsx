import { useEffect, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../components/ui/pagination";
import { Tent, MapPin, Calendar, Loader2, Coins, Star, CheckCircle2, XCircle, Clock3, Sparkles, Rocket, History, ChevronRight, Activity, ArrowUpRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { client } from "../../lib/api/client";
import { toast } from "sonner";
import { motion, AnimatePresence, Variants } from "motion/react";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getDaysUntil(campDate: string | Date) {
  const start = new Date(campDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((start.getTime() - today.getTime()) / MS_PER_DAY);
}

function getCountdownLabel(days: number, isCampDay: boolean) {
  if (isCampDay || days <= 0) return "TODAY";
  return `${days} day${days === 1 ? "" : "s"} to go`;
}

export function VolunteerCamps() {
  const { state } = useAuth();
  const [myCamps, setMyCamps] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);
  const [rsvpLoadingId, setRsvpLoadingId] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const volId = state.user?.volunteerId || state.user?.identifier || "";
  const historyPageSize = 4;

  const loadCamps = () => {
    if (!volId) return;
    Promise.all([
      client.get<any[]>(`/volunteers/camps/${encodeURIComponent(volId)}`),
      client.get<any[]>("/camps/upcoming"),
    ])
      .then(([my, up]) => {
        setMyCamps(my || []);
        setUpcoming(up || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCamps();
  }, [volId]);

  const sortedHistory = [...myCamps].sort((a, b) => {
    const aTime = new Date(a.createdAt || a.camp?.date || 0).getTime();
    const bTime = new Date(b.createdAt || b.camp?.date || 0).getTime();
    return bTime - aTime;
  });

  const registeredCamps = upcoming.filter(camp => myCamps.some(p => p.campId === camp.id));
  const availableCamps = upcoming.filter(camp => !myCamps.some(p => p.campId === camp.id));

  const totalHistoryPages = Math.max(1, Math.ceil(sortedHistory.length / historyPageSize));
  const pagedHistory = sortedHistory.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);

  const handleScanDigital = async (campId: string) => {
    try {
      setLocalLoading(true);
      const res: any = await client.post(`/camps/${campId}/scan-digital`, { volunteerId: volId });
      toast.success(res?.awarded ? `Attendance marked! +${res.awarded} credits` : "Attendance successful!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process attendance");
      setLocalLoading(false);
    }
  };

  const handleRsvp = async (campId: string, response: "JOINING" | "NOT_JOINING") => {
    try {
      setRsvpLoadingId(campId);
      await client.post(`/camps/${campId}/response`, { volunteerId: volId, response });
      setMyCamps(prev => prev.map(entry => entry.campId === campId ? { ...entry, volunteerResponse: response } : entry));
      toast.success(response === "JOINING" ? "Joining Confirmed!" : "Update Saved.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save response");
    } finally {
      setRsvpLoadingId(null);
    }
  };

  const handleRegister = async (campId: string) => {
    try {
      await client.post(`/camps/${campId}/register`, { volunteerId: volId });
      toast.success("Successfully registered!");
      loadCamps();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to register");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="h-12 w-12 animate-spin text-amber-500 mb-4" />
        <p className="text-amber-900/40 text-xs font-black uppercase tracking-widest animate-pulse">Syncing Mission Data...</p>
      </div>
    );
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants: Variants = {
    hidden: { x: -20, opacity: 0 },
    show: { x: 0, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 400 } }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 md:space-y-16 animate-in fade-in duration-1000 pb-32 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-8">
        <header className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-3 bg-amber-50 w-fit px-4 py-1.5 rounded-full border border-amber-100/50">
             <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
             <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Volunteer Hub</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter leading-none">My Volunteering Journey</h1>
          <p className="text-slate-500 text-sm font-bold max-w-lg leading-relaxed">
            Monitor active registrations, discover new volunteering opportunities, and review your historical impact journey.
          </p>
        </header>
        
        <div className="flex items-center gap-4 md:gap-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 w-full md:w-auto">
           <div className="text-right">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Camps Joined</p>
             <p className="text-3xl font-black text-amber-600 leading-none">{myCamps.filter((c: any) => c.status === 'ATTENDED').length}</p>
           </div>
           <div className="h-12 w-[1px] bg-slate-200" />
           <div className="text-right">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Impact Level</p>
             <p className="text-3xl font-black text-emerald-600 leading-none">MASTER</p>
           </div>
        </div>
      </div>

      {/* 1. Active Operations*/}
      <section className="space-y-6 md:space-y-8 relative">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 md:gap-4">
             <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Activity className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
               <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                 Active Camps
               </p>
               <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>Registered Camps</h2>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {registeredCamps.length > 0 ? (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-6">
              {registeredCamps.map((camp) => {
                const participation = myCamps.find((p: any) => p.campId === camp.id);
                const campDate = new Date(camp.date);
                const today = new Date();
                const isCampDay = campDate.toDateString() === today.toDateString();
                const diffDays = getDaysUntil(campDate);
                const countdownLabel = getCountdownLabel(diffDays, isCampDay);
                const responseState = participation?.volunteerResponse || "UNRESPONDED";

                return (
                  <motion.div key={camp.id} variants={itemVariants} className="group w-full perspective-1000">
                    <div className="relative rounded-3xl md:rounded-[2.5rem] bg-white p-[1px] shadow-[0_20px_60px_-15px_rgba(251,191,36,0.3)] hover:shadow-[0_30px_80px_-20px_rgba(244,63,94,0.3)] transition-all duration-700 overflow-hidden group hover:-translate-y-1">
                      
                      {/* Background */}
                      <div className="absolute inset-0 z-0 overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity duration-1000">
                        <div className="absolute top-[-50%] left-[-10%] w-[120%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(254,205,211,0.6)_360deg)] animate-[spin_6s_linear_infinite]" />
                        <div className="absolute -bottom-[50%] -right-[10%] w-[80%] h-[150%] bg-rose-200/60 blur-[100px] rounded-full mix-blend-multiply" />
                        <div className="absolute top-[20%] left-[20%] w-[50%] h-[50%] bg-orange-200/50 blur-[80px] rounded-full mix-blend-multiply animate-pulse" />
                        <div className="absolute bottom-[10%] right-[30%] w-[40%] h-[40%] bg-emerald-100/60 blur-[90px] rounded-full mix-blend-multiply" />
                      </div>
                      
                      <div className="relative z-10 flex flex-col md:flex-row bg-white/70 backdrop-blur-3xl rounded-3xl md:rounded-[2.5rem] h-full overflow-hidden border border-white/50">
                        
                        {/* Left Side: Mission Ticket Stub */}
                        <div className="w-full md:w-[320px] p-4 sm:p-5 md:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200/50 relative">
                          {/* Ticket Cutout & Laser Separator (Desktop) */}
                          <div className="absolute top-0 right-0 bottom-0 w-[1px] hidden md:block overflow-hidden z-20 pointer-events-none">
                             {/* Beam shooting UP */}
                             <motion.div 
                               className="absolute w-full top-0 bottom-1/2 bg-gradient-to-t from-rose-500 to-transparent"
                               style={{ originY: 1 }}
                               animate={{ scaleY: [0, 1, 0], opacity: [0.2, 1, 0.2] }} 
                               transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
                             />
                             {/* Beam shooting DOWN */}
                             <motion.div 
                               className="absolute w-full top-1/2 bottom-0 bg-gradient-to-b from-rose-500 to-transparent"
                               style={{ originY: 0 }}
                               animate={{ scaleY: [0, 1, 0], opacity: [0.2, 1, 0.2] }} 
                               transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
                             />
                          </div>
                          <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50 border-l border-rose-200/80 shadow-inner z-20 items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-rose-400/20 blur-md animate-pulse" />
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                          </div>

                          {/* Ticket Cutout & Laser Separator (Mobile) */}
                          <div className="absolute bottom-0 left-0 right-0 h-[1px] md:hidden overflow-hidden z-20 pointer-events-none">
                             {/* Beam shooting LEFT */}
                             <motion.div 
                               className="absolute h-full left-0 right-1/2 bg-gradient-to-l from-rose-500 to-transparent"
                               style={{ originX: 1 }}
                               animate={{ scaleX: [0, 1, 0], opacity: [0.2, 1, 0.2] }} 
                               transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
                             />
                             {/* Beam shooting RIGHT */}
                             <motion.div 
                               className="absolute h-full left-1/2 right-0 bg-gradient-to-r from-rose-500 to-transparent"
                               style={{ originX: 0 }}
                               animate={{ scaleX: [0, 1, 0], opacity: [0.2, 1, 0.2] }} 
                               transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
                             />
                          </div>
                          <div className="flex md:hidden absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-50 border-t border-rose-200/80 shadow-inner z-20 items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-rose-400/20 blur-md animate-pulse" />
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                          </div>

                          <div className="flex items-start justify-between relative z-10">
                               <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-white border border-slate-200 shadow-xl flex items-center justify-center group-hover:bg-rose-50 transition-all duration-500 backdrop-blur-md">
                                 <Tent className="h-4 w-4 md:h-6 md:w-6 text-rose-500" />
                               </div>
                               <Badge className={`border border-slate-200 shadow-sm text-[7px] md:text-[10px] font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-full uppercase tracking-widest ${isCampDay ? "bg-rose-500 text-white animate-pulse" : "bg-white/80 text-slate-600 backdrop-blur-md"}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                                 {isCampDay ? "CAMP TODAY" : `${diffDays} DAYS TO GO`}
                               </Badge>
                          </div>
                          <div className="mt-4 md:mt-8 mb-3 md:mb-6 relative z-10">
                               <p className="text-[8px] md:text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 uppercase tracking-[0.3em] mb-1.5 md:mb-3 flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                                 <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-amber-500"></span>
                                 </span>
                                 Camp Title
                               </p>
                               <h3 className="text-xl md:text-3xl font-extrabold text-slate-900 leading-none mb-2 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>{camp.name}</h3>
                               {camp.totalCoinPool > 0 && (
                                 <div className="inline-flex items-center gap-1.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white px-2.5 py-1 rounded-full text-[9px] font-black shadow-md shadow-orange-500/20 border border-white/30">
                                   <Coins className="h-3 w-3" />
                                   {camp.totalCoinPool.toLocaleString("en-IN")} coin pool
                                 </div>
                               )}
                          </div>
                          <div className="flex items-center gap-2 md:gap-3 pt-3 md:pt-6 border-t border-slate-200/50 mt-auto relative z-10">
                               <MapPin className="h-3 w-3 md:h-4 md:w-4 text-rose-400" />
                               <p className="text-[10px] md:text-[11px] font-medium text-slate-600 truncate tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>{camp.location}</p>
                          </div>
                        </div>

                        {/* Center/Right Content: Details & Actions */}
                        <div className="flex-1 p-4 sm:p-5 md:p-10 flex flex-col justify-between relative z-10 md:pl-12">
                          <div className="flex flex-col md:flex-row items-start justify-between mb-4 md:mb-8 gap-3 md:gap-6">

                             <div className="space-y-2 md:space-y-4">
                               <div className="flex items-center gap-2 md:gap-3">
                                 <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                                   <Calendar className="h-3 w-3 md:h-4 md:w-4 text-amber-500" />
                                 </div>
                                 <span className="text-sm md:text-base font-medium text-slate-900 tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>{campDate.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                               </div>
                               <p className="text-xs md:text-sm text-slate-600 leading-relaxed max-w-lg pr-2 md:pr-4" style={{ fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>{camp.description}</p>
                             </div>
                             <div className="flex flex-col items-start sm:items-end gap-2 md:gap-3 shrink-0">
                               <div className={`inline-flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-4 md:py-1.5 rounded-full border shadow-sm backdrop-blur-sm ${
                                 participation?.status === 'PENDING' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                 participation?.status === 'APPROVED' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                                 participation?.status === 'REJECTED' ? 'border-rose-200 bg-rose-50 text-rose-700' :
                                 participation?.status === 'ATTENDED' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' :
                                 'border-slate-200 bg-white/80 text-slate-600'
                               }`}>
                                  <span className={`h-1.5 w-1.5 md:h-2 md:w-2 rounded-full ${
                                    participation?.status === 'PENDING' ? 'bg-amber-400' :
                                    participation?.status === 'APPROVED' ? 'bg-emerald-400' :
                                    participation?.status === 'REJECTED' ? 'bg-rose-400' :
                                    participation?.status === 'ATTENDED' ? 'bg-indigo-400' :
                                    'bg-slate-400'
                                  }`} />
                                  <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: "'Inter', sans-serif" }}>
                                    {participation?.status === 'PENDING' ? 'Pending Approval' : 
                                     participation?.status === 'REJECTED' ? 'Registration Rejected' :
                                     participation?.status === 'ATTENDED' ? 'Attendance Marked' :
                                     'Registration Approved'}
                                  </span>
                               </div>
                               {responseState === "JOINING" && (
                                 <div className="inline-flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-4 md:py-1.5 rounded-full border border-emerald-200 bg-emerald-50 backdrop-blur-sm shadow-sm">
                                   <CheckCircle2 className="h-3 w-3 md:h-3.5 md:w-3.5 text-emerald-500" />
                                   <span className="text-[8px] md:text-[10px] font-bold text-emerald-700 uppercase tracking-widest" style={{ fontFamily: "'Inter', sans-serif" }}>Attendance Confirmed</span>
                                 </div>
                               )}
                             </div>
                          </div>

                          {/* Action Logic Area */}
                          <div className="mt-auto border-t border-slate-200/50 pt-4 md:pt-6">
                            {(() => {
                              const now = new Date();
                              const activeExpiry = camp.activeQrExpiry ? new Date(camp.activeQrExpiry) : null;
                              const isShared = !!participation?.shareSelected;
                              const isEngineActiveForMe = isShared && activeExpiry && activeExpiry > now;
                              const canRsvp = participation?.status === "APPROVED" && diffDays >= 0;

                              if (participation?.status === "PENDING") {
                                return (
                                  <div className="h-10 md:h-14 bg-amber-50 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 text-amber-600 border border-amber-200/50 backdrop-blur-sm">
                                    <Clock3 className="h-3 w-3 md:h-4 md:w-4 animate-spin-slow" />
                                    <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest italic" style={{ fontFamily: "'Inter', sans-serif" }}>Waiting for Admin</span>
                                  </div>
                                );
                              }

                              if (participation?.status === "APPROVED") {
                                if (canRsvp && responseState === "UNRESPONDED") {
                                  return (
                                      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5 pt-1">
                                        <p className="text-[8px] md:text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] text-center flex-shrink-0" style={{ fontFamily: "'Inter', sans-serif" }}>Confirm Participation</p>
                                        <div className="grid grid-cols-2 gap-2 md:gap-3 w-full max-w-xs sm:w-auto">
                                          <button onClick={() => handleRsvp(camp.id, "JOINING")} disabled={rsvpLoadingId === camp.id} className="h-9 md:h-12 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] md:text-xs rounded-lg md:rounded-xl transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] active:scale-95 flex items-center justify-center gap-1.5 px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                                            {rsvpLoadingId === camp.id ? <Loader2 className="h-3 w-3 animate-spin text-white" /> : <CheckCircle2 className="h-3 w-3" />} YES
                                          </button>
                                          <button onClick={() => handleRsvp(camp.id, "NOT_JOINING")} disabled={rsvpLoadingId === camp.id} className="h-9 md:h-12 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-[10px] md:text-xs rounded-lg md:rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 px-4 backdrop-blur-md shadow-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                                            {rsvpLoadingId === camp.id ? <Loader2 className="h-3 w-3 animate-spin text-slate-400" /> : <XCircle className="h-3 w-3" />} NO
                                          </button>
                                        </div>
                                      </div>
                                  );
                                }

                                if (responseState === "NOT_JOINING") {
                                  return <div className="h-14 bg-rose-50/50 rounded-2xl flex items-center justify-center gap-3 text-rose-500 border border-rose-100 italic font-bold text-xs uppercase tracking-widest backdrop-blur-sm" style={{ fontFamily: "'Inter', sans-serif" }}>You marked as Not Joining</div>;
                                }

                                if (isEngineActiveForMe) {
                                  return (
                                    <button onClick={() => handleScanDigital(camp.id)} disabled={localLoading} className="w-full h-14 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-extrabold tracking-[0.2em] text-xs uppercase rounded-xl shadow-[0_4px_20px_0_rgba(0,0,0,0.15)] flex items-center justify-center gap-3 relative overflow-hidden transition-all active:scale-95 mt-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                                      <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                                      <Rocket className="h-4 w-4" />
                                      {localLoading ? "LOGGING..." : "MARK ATTENDANCE"}
                                    </button>
                                  );
                                }

                                if (!isShared) {
                                  return (
                                    <div className="h-14 bg-slate-50/80 backdrop-blur-md rounded-2xl flex items-center justify-center gap-3 text-slate-500 border border-slate-200 italic font-bold text-xs uppercase tracking-widest shadow-sm">
                                      <Clock3 className="h-4 w-4" /> Awaiting Attendance Link
                                    </div>
                                  );
                                }

                                return (
                                  <div className="h-14 bg-[#FF9900]/10 backdrop-blur-md rounded-2xl flex items-center justify-center gap-3 text-[#FF9900] border border-[#FF9900]/20 font-bold text-xs uppercase tracking-widest transition-all shadow-sm">
                                    <Sparkles className="h-4 w-4" /> Ready for Volunteering
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="py-24 text-center space-y-6 bg-slate-50/50 rounded-[4rem] border border-dashed border-slate-200">
               <div className="h-16 w-16 bg-white rounded-3xl shadow-xl mx-auto flex items-center justify-center text-slate-200">
                  <Rocket className="h-8 w-8" />
               </div>
               <div className="space-y-1">
                 <p className="text-lg font-black text-slate-900">No active camps found.</p>
                 <p className="text-xs font-bold text-slate-500">Scan available opportunities below to join a camp.</p>
               </div>
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* 2. Available Missions */}
      <section className="space-y-6 md:space-y-8">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl md:rounded-2xl bg-amber-500 shadow-lg shadow-amber-200 flex items-center justify-center">
            <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">Available Opportunities</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {availableCamps.map((camp) => {
              const campDate = new Date(camp.date);
              const diffDays = getDaysUntil(campDate);
              return (
                <motion.div key={camp.id} variants={itemVariants} initial="hidden" animate="show" whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
                  <Card className="border-none shadow-xl bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group hover:shadow-2xl transition-all h-full flex flex-col">
                    <div className="h-32 md:h-36 bg-slate-50 relative flex items-center justify-center group-hover:bg-amber-50 transition-colors">
                       <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-amber-600 shadow-sm border border-amber-100">
                         {diffDays} DAYS UNTIL START
                       </div>
                       {camp.totalCoinPool > 0 && (
                         <div className="absolute top-4 left-4 bg-gradient-to-br from-amber-400 to-orange-500 text-white px-2.5 py-1 rounded-full text-[9px] font-black flex items-center gap-1 shadow-md shadow-orange-500/20 border border-white/40">
                           <Coins className="h-3 w-3" />
                           {camp.totalCoinPool >= 1000 ? (camp.totalCoinPool / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : camp.totalCoinPool}
                         </div>
                       )}
                       <Tent className="h-8 w-8 md:h-10 md:w-10 text-slate-200 group-hover:text-amber-400 group-hover:scale-110 transition-all duration-500" />
                    </div>
                    <CardContent className="p-6 md:p-8 flex flex-col flex-1">
                       <h3 className="text-lg font-black text-slate-900 mb-2 truncate group-hover:text-amber-600 transition-colors">{camp.name}</h3>
                       <div className="space-y-2 mb-6 md:mb-8 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <p className="flex items-center gap-2"><MapPin className="h-3 w-3 text-amber-500" /> {camp.location}</p>
                          <p className="flex items-center gap-2"><Calendar className="h-3 w-3 text-amber-500" /> {campDate.toLocaleDateString()}</p>
                          {camp.totalCoinPool > 0 && (
                            <p className="flex items-center gap-2 text-amber-600">
                              <Coins className="h-3 w-3" />
                              {camp.totalCoinPool.toLocaleString("en-IN")} coin prize pool
                            </p>
                          )}
                       </div>
                       <button onClick={() => handleRegister(camp.id)} className="mt-auto w-full h-10 md:h-12 bg-slate-950 hover:bg-black text-white font-black text-[10px] tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2">
                         REGISTER NOW <ChevronRight className="h-3 w-3" />
                       </button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      {/* 3. Deployment History */}
      <section className="space-y-6 md:space-y-8 pt-4 md:pt-8">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-slate-950 flex items-center justify-center shadow-lg shadow-slate-900/20">
            <History className="h-4 w-4 md:h-4 md:w-4 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>Volunteering History</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent blur-3xl pointer-events-none" />
          
          {pagedHistory.length > 0 ? (
            pagedHistory.map((cp: any, i: number) => (
              <motion.div key={i} whileHover={{ y: -5 }} transition={{ duration: 0.3 }} className="group relative z-10">
                <div className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] border border-slate-200/60 p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-[0_4px_20px_0_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_0_rgba(88,28,135,0.08)] hover:border-purple-200/50 transition-all duration-500 gap-4 group-hover:bg-white">
                  <div className="flex items-center gap-4 md:gap-5 w-full sm:w-auto">
                    <div className={`shrink-0 h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner ${cp.participationType === "ACTIVE" ? "bg-gradient-to-br from-amber-100 to-amber-50" : "bg-gradient-to-br from-slate-100 to-slate-50"}`}>
                      {cp.participationType === "ACTIVE" ? <Star className="h-4 w-4 md:h-5 md:w-5 text-amber-500 fill-current" /> : <Tent className="h-4 w-4 md:h-5 md:w-5 text-slate-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base md:text-lg font-bold tracking-tight text-slate-900 group-hover:text-purple-700 transition-colors truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>{cp.camp?.name}</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge className={`text-[9px] font-bold border-none px-2.5 py-0.5 rounded-full uppercase tracking-widest ${cp.participationType === "ACTIVE" ? "bg-amber-100 text-amber-700 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "bg-slate-100 text-slate-600 shadow-sm"}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                          {cp.participationType}
                        </Badge>
                        
                        {(() => {
                          const now = new Date();
                          const campDate = new Date(cp.camp?.date || cp.createdAt);
                          const isPassed = campDate < now;

                          if (cp.status === 'ATTENDED') {
                            return (
                              <Badge className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="h-2.5 w-2.5" /> ATTENDED
                              </Badge>
                            );
                          }
                          if (cp.status === 'REJECTED') {
                            return (
                              <Badge className="text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <XCircle className="h-2.5 w-2.5" /> REJECTED
                              </Badge>
                            );
                          }
                          if (cp.volunteerResponse === 'NOT_JOINING') {
                            return (
                              <Badge className="text-[9px] font-bold bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ArrowUpRight className="h-2.5 w-2.5 rotate-90" /> OPTED OUT
                              </Badge>
                            );
                          }
                          if (cp.volunteerResponse === 'JOINING' && cp.status === 'APPROVED' && isPassed) {
                            return (
                              <Badge className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Activity className="h-2.5 w-2.5 text-amber-500" /> MISSED
                              </Badge>
                            );
                          }
                          if (cp.status === 'PENDING') {
                            return (
                              <Badge className="text-[9px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Clock3 className="h-2.5 w-2.5" /> PENDING
                              </Badge>
                            );
                          }
                          if (cp.status === 'APPROVED') {
                            return (
                              <Badge className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Star className="h-2.5 w-2.5 fill-current" /> REGISTERED
                              </Badge>
                            );
                          }
                          return null;
                        })()}

                        <span className="text-[10px] font-semibold text-slate-400 tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {new Date(cp.camp?.date || cp.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white px-4 py-2 rounded-xl shadow-lg shadow-slate-900/20 group-hover:shadow-purple-500/20 transition-all duration-300 group-hover:-translate-y-0.5">
                      <span className="text-sm font-extrabold font-mono leading-none tracking-tight">+{cp.coinsAwarded}</span>
                      <Coins className="h-3.5 w-3.5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 py-32 text-center bg-slate-50/50 rounded-[4rem] border border-dashed border-slate-200">
              <History className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.25em]" style={{ fontFamily: "'Inter', sans-serif" }}>No Volunteering Records Found</p>
            </div>
          )}
        </div>
        
        {sortedHistory.length > historyPageSize && (
          <div className="flex items-center justify-between pt-4 bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {pagedHistory.length} of {sortedHistory.length} records</p>
            <div className="flex gap-2">
              <button onClick={() => historyPage > 1 && setHistoryPage(p => p - 1)} disabled={historyPage === 1} className="h-10 px-6 rounded-xl border border-slate-200 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-30 group flex items-center gap-2">
                Previous
              </button>
              <button onClick={() => historyPage < totalHistoryPages && setHistoryPage(p => p + 1)} disabled={historyPage === totalHistoryPages} className="h-10 px-6 rounded-xl border border-slate-200 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-30 flex items-center gap-2">
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
