import { useEffect, useState, useCallback } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../components/ui/pagination";
import { Tent, Plus, MapPin, Calendar, Users, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { client } from "../../lib/api/client";
import { motion, AnimatePresence } from "motion/react";
import { useStateParam } from "../../context/AdminStateContext";

export function AdminCamps() {
  const stateParam = useStateParam();
  const [camps, setCamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCamps, setTotalCamps] = useState(0);
  const navigate = useNavigate();
  const pageSize = 10;

  const fetchCamps = useCallback(() => {
    setLoading(true);
    const stateQuery = stateParam ? `&${stateParam.slice(1)}` : "";
    client.get<any>(`/camps/list?page=${page}&limit=${pageSize}${stateQuery}`)
      .then(res => {
        const items = Array.isArray(res) ? res : res?.items || [];
        setCamps(items);
        setTotalPages(Array.isArray(res) ? Math.max(1, Math.ceil(items.length / pageSize)) : (res?.totalPages || 1));
        setTotalCamps(Array.isArray(res) ? items.length : (res?.total || 0));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, stateParam]);

  useEffect(() => { fetchCamps(); }, [fetchCamps]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const pageNumbers = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
    const pages = [1];
    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    if (left > 2) pages.push(-1);
    for (let p = left; p <= right; p += 1) pages.push(p);
    if (right < totalPages - 1) pages.push(-1);
    pages.push(totalPages);
    return pages;
  })();

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10 pb-10 font-sans"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
           <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-slate-200/50 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">
             <Sparkles className="w-3 h-3 text-slate-500" /> Operational Matrix
           </div>
           <h1 className="text-4xl lg:text-5xl font-black text-black tracking-tighter">
             Health <span className="text-slate-400">Camps</span>
           </h1>
           <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-3 break-words max-w-sm">
             Total {totalCamps} field operations scheduled and managed
           </p>
        </div>
        <button 
          onClick={() => navigate("/admin/camps/create")} 
          className="h-12 px-8 rounded-2xl bg-black hover:bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider transition-all flex items-center shadow-lg shadow-black/10 active:scale-95"
        >
          <Plus size={16} className="mr-2" /> Schedule Deployment
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm border-dashed">
           <Loader2 className="h-10 w-10 animate-spin text-black mb-4" />
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Operational Data...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {camps.map((camp) => (
              <motion.div key={camp.id} variants={itemVariants} layout>
                <div 
                  className="bg-white border border-slate-200 shadow-sm rounded-[2rem] overflow-hidden hover:border-black transition-colors cursor-pointer group p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
                  onClick={() => navigate(`/admin/camps/${camp.id}`)}
                >
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                        <Tent className="h-8 w-8 text-black" />
                      </div>
                      <div className="text-center md:text-left">
                        <h3 className="text-xl font-black text-black tracking-tight group-hover:text-slate-600 transition-colors uppercase leading-none mb-3">{camp.name}</h3>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-2 text-slate-600"><MapPin size={12} className="text-slate-300" /> {camp.location}</span>
                          <span className="flex items-center gap-2 text-slate-600"><Calendar size={12} className="text-slate-300" /> {new Date(camp.date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-2 text-slate-600"><Users size={12} className="text-slate-300" /> {camp._count?.participations || 0} Volunteers</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-slate-200 ${camp.status === 'ACTIVE' ? 'bg-amber-50 text-amber-600 border-amber-200' : camp.status === 'COMPLETED' ? 'bg-slate-50 text-slate-500' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                           {camp.status}
                        </div>
                        <button className="w-12 h-12 rounded-xl border border-slate-200 hover:border-black flex items-center justify-center text-slate-400 hover:text-black transition-all group-hover:bg-black group-hover:text-white">
                           <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {camps.length === 0 && (
             <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-200 border-dashed shadow-sm">
               <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Tent className="h-8 w-8 text-slate-400" />
               </div>
               <p className="text-lg font-black text-black tracking-tight mb-2">No Deployments Found</p>
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No camps have been scheduled yet</p>
               <button onClick={() => navigate("/admin/camps/create")} className="mt-8 rounded-xl h-12 px-8 border border-slate-200 text-slate-600 text-xs font-bold uppercase hover:bg-black hover:text-white hover:border-black transition-all">
                  Initialize Operations
               </button>
             </div>
          )}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex justify-end pt-8">
           <Pagination className="justify-end w-auto mx-0 bg-white p-2 text-slate-600 rounded-2xl shadow-sm border border-slate-200">
             <PaginationContent>
               <PaginationItem>
                 <PaginationPrevious
                   href="#"
                   onClick={(e) => { e.preventDefault(); if (page > 1) setPage(p => p - 1); }}
                   className={`rounded-xl border-none font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 ${page === 1 ? "opacity-30 pointer-events-none" : ""}`}
                 />
               </PaginationItem>

               {pageNumbers.map((v, i) =>
                 v === -1 ? (
                   <PaginationItem key={i}><PaginationEllipsis className="text-slate-300" /></PaginationItem>
                 ) : (
                   <PaginationItem key={i}>
                     <PaginationLink
                       href="#"
                       isActive={v === page}
                       onClick={(e) => { e.preventDefault(); setPage(v); }}
                       className={`w-9 h-9 rounded-xl border-none font-black text-xs ${v === page ? 'bg-black text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                     >
                       {v}
                     </PaginationLink>
                   </PaginationItem>
                 ),
               )}

               <PaginationItem>
                 <PaginationNext
                   href="#"
                   onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(p => p + 1); }}
                   className={`rounded-xl border-none font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 ${page === totalPages ? "opacity-30 pointer-events-none" : ""}`}
                 />
               </PaginationItem>
             </PaginationContent>
           </Pagination>
        </div>
      )}
    </motion.div>
  );
}
