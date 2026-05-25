import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  Download,
  ArrowRight,
  Activity,
  Coins,
  Heart,
  Sparkles
} from "lucide-react";
import { motion } from "motion/react";
import { client } from "../../lib/api/client";
import { useStateParam } from "../../context/AdminStateContext";

export function AdminDonors() {
  const stateParam = useStateParam();
  const [donors, setDonors] = useState<any[]>([]);
  const [mappingStats, setMappingStats] = useState({ oneTime: 0, recurring: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  useEffect(() => {
    setIsLoading(true);
    const stateQuery = stateParam ? stateParam : "";
    Promise.all([
      client.get<any[]>(`/admin/donors${stateQuery}`),
      client.get<any>(`/admin/stats?range=30D${stateParam ? `&${stateParam.slice(1)}` : ""}`)
    ]).then(([donorsData, statsData]) => {
      setDonors(donorsData || []);
      if (statsData?.mappingStats) {
        setMappingStats(statsData.mappingStats);
      }
    })
    .catch(err => console.error("Error loading donors:", err))
    .finally(() => setIsLoading(false));
  }, [stateParam]);

  const filteredDonors = donors.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDonors.length / itemsPerPage);
  const paginatedDonors = filteredDonors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1); // Reset to first page on search
  }, [searchQuery]);

  const handleExportCSV = () => {
    if (filteredDonors.length === 0) return;
    
    const headers = ["Donor Name", "Email", "Classification", "Total Capital", "Last Audit"];
    const rows = filteredDonors.map(d => [
      `"${d.name}"`,
      `"${d.email}"`,
      `"${d.category}"`,
      `"₹${d.totalAmount}"`,
      `"${d.lastDonation}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    
    link.setAttribute("href", url);
    link.setAttribute("download", `donor-ledger-${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
             <Sparkles className="w-3 h-3 text-slate-500" /> Supporter Data
           </div>
           <h1 className="text-4xl lg:text-5xl font-black text-black tracking-tighter">
             Donor <span className="text-slate-400">Ledger</span>
           </h1>
        </div>
        <div className="flex items-center gap-3">
            <div className="relative group">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" />
                <input 
                    placeholder="Search by name or email..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 pl-11 pr-6 rounded-2xl bg-white border border-slate-200 outline-none focus:border-black text-xs font-bold text-slate-700 shadow-sm w-[280px] transition-all placeholder:text-slate-400"
                />
            </div>
            <button className="w-12 h-12 rounded-2xl bg-white border border-slate-200 hover:border-black flex items-center justify-center text-slate-600 hover:text-black shadow-sm transition-all group">
                <Filter size={18} className="group-hover:scale-110 transition-transform" />
            </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-1 bg-white border border-slate-200 shadow-sm rounded-[2.5rem] p-8 flex flex-col items-center text-center justify-center relative overflow-hidden group">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Download size={22} className="text-slate-700" />
            </div>
            <h4 className="text-sm font-black text-black uppercase tracking-widest mb-1.5">Export Ledger</h4>
            <p className="text-[11px] text-slate-400 font-bold leading-relaxed mb-6">Extract complete historical compliance records in CSV format.</p>
            <button 
              onClick={handleExportCSV}
              disabled={filteredDonors.length === 0}
              className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold uppercase tracking-wider text-black rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate CSV
            </button>
        </motion.div>
        
        <motion.div variants={itemVariants} className="lg:col-span-3 bg-black rounded-[2.5rem] p-10 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between shadow-md">
            <div className="absolute -top-10 -right-10 p-8 opacity-10">
                <Activity size={240} className="text-white" strokeWidth={1} />
            </div>
            <div className="relative z-10 mb-8 sm:mb-0">
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">Contribution Mapping</h3>
                <p className="text-slate-400 text-[11px] font-bold tracking-widest uppercase">Systematically categorizing donation typologies</p>
            </div>
            <div className="relative z-10 flex gap-12 sm:gap-16">
                {[
                    { label: "One-time Data", count: mappingStats.oneTime.toString(), icon: Coins },
                    { label: "Recurring Data", count: mappingStats.recurring.toString(), icon: Heart }
                ].map((m, i) => (
                    <div key={i} className="text-center group">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition-colors">
                            <m.icon size={20} className="text-white" />
                        </div>
                        <p className="text-3xl font-black text-white leading-none mb-2">{isLoading ? "..." : m.count}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{m.label}</p>
                    </div>
                ))}
            </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="bg-white border border-slate-200 shadow-sm rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-8 py-5 text-left font-bold text-[10px] text-slate-400 uppercase tracking-widest">Patron Identity</th>
                <th className="px-8 py-5 text-center font-bold text-[10px] text-slate-400 uppercase tracking-widest">Classification</th>
                <th className="px-8 py-5 text-center font-bold text-[10px] text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-right font-bold text-[10px] text-slate-400 uppercase tracking-widest">Total Capital</th>
                <th className="px-8 py-5 text-center font-bold text-[10px] text-slate-400 uppercase tracking-widest">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest">Loading Ledger...</td>
                </tr>
              ) : paginatedDonors.length > 0 ? (
                paginatedDonors.map((donor) => (
                  <tr key={donor.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-600 text-sm">
                             {donor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                             <p className="font-black text-black tracking-tight text-[15px] mb-0.5">{donor.name}</p>
                             <p className="text-[11px] font-bold text-slate-400">{donor.email}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="inline-flex items-center px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-bold text-[9px] uppercase tracking-widest">
                          {donor.category}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Active</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <p className="font-black text-black text-lg tracking-tighter">₹{donor.totalAmount}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-end gap-1"><Activity size={10} /> {donor.lastDonation}</p>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center justify-center">
                          <button className="w-10 h-10 rounded-xl hover:bg-black hover:text-white text-slate-400 transition-all flex items-center justify-center group-hover:scale-110">
                             <ArrowRight size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest">No donors found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination Controls */}
      {!isLoading && filteredDonors.length > 0 && (
        <motion.div variants={itemVariants} className="flex items-center justify-between px-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                Showing <span className="text-black">{Math.min(filteredDonors.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredDonors.length, currentPage * itemsPerPage)}</span> of <span className="text-black">{filteredDonors.length}</span> Supporters
            </p>
            <div className="flex items-center gap-2">
                <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="h-10 px-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:border-black disabled:opacity-30 disabled:hover:border-slate-200 transition-all"
                >
                    Previous
                </button>
                <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-black text-white' : 'hover:bg-slate-100 text-slate-400'}`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
                <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="h-10 px-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:border-black disabled:opacity-30 disabled:hover:border-slate-200 transition-all"
                >
                    Next
                </button>
            </div>
        </motion.div>
      )}
    </motion.div>
  );
}
