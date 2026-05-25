import { useState, useEffect } from "react";
import { 
  Users, 
  Target, 
  Coins, 
  Sparkles, 
  Activity, 
  ArrowRight,
  Heart,
  TrendingUp
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { motion } from "motion/react";

// Placeholder data for the chart, since the backend doesn't aggregate donations by month in stats yet.
const monthlyRevenue = [
  { month: "Jan", amount: 45 },
  { month: "Feb", amount: 52 },
  { month: "Mar", amount: 48 },
  { month: "Apr", amount: 61 },
  { month: "May", amount: 55 },
  { month: "Jun", amount: 67 },
  { month: "Jul", amount: 72 },
];

const activityStyles: any = {
  Donation: { bg: "bg-emerald-50", text: "text-emerald-500", icon: Coins },
  Program: { bg: "bg-blue-50", text: "text-blue-500", icon: Target },
  System: { bg: "bg-slate-100", text: "text-slate-500", icon: Activity },
};

import { Link } from "react-router";
import { client } from "../../lib/api/client";
import { useStateParam } from "../../context/AdminStateContext";

export function AdminDashboard() {
  const stateParam = useStateParam();
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalDonors: 0,
    totalPrograms: 0,
    recentDonations: [] as any[],
    chartData: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState<'7D' | '30D' | '1Y'>('30D');

  useEffect(() => {
    setIsLoading(true);
    const stateQuery = stateParam ? `&${stateParam.slice(1)}` : "";
    client.get<any>(`/admin/stats?range=${range}${stateQuery}`)
      .then(data => {
        if (data) {
          setStats({
            totalDonations: data.totalDonations || 0,
            totalDonors: data.totalDonors || 0,
            totalPrograms: data.totalPrograms || 0,
            recentDonations: data.recentDonations || [],
            chartData: data.chartData || []
          });
        }
      })
      .catch(err => console.error("Error fetching admin stats:", err))
      .finally(() => setIsLoading(false));
  }, [range, stateParam]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10 pb-10 font-sans"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-slate-200/50 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">
             <Sparkles className="w-3 h-3 text-slate-500" /> Platform Overview
           </div>
           <h1 className="text-4xl lg:text-5xl font-black text-black tracking-tighter">
             Command <span className="text-slate-400">Center</span>
           </h1>
        </div>
        <div className="flex items-center gap-4">
           <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                 <Target className="text-emerald-500" size={18} />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                 <p className="text-sm font-black text-black uppercase">All Systems Normal</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Contributors", value: stats.totalDonors, icon: Users, color: "blue", suffix: "" },
          { label: "Active Programs", value: stats.totalPrograms, icon: Target, color: "rose", suffix: "" },
          { label: "Total Capital", value: stats.totalDonations, icon: Coins, color: "emerald", prefix: "₹", format: (v: number) => v.toLocaleString() },
          { label: "System Uptime", value: "99.9%", icon: Activity, color: "slate", suffix: "" }
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants}>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden group hover:border-black transition-colors duration-300 shadow-sm">
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className={`w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                  <stat.icon size={20} className={`text-slate-700`} />
                </div>
              </div>
              <div className="relative z-10">
                <h4 className="text-3xl font-black text-black tracking-tighter mb-1">
                  {isLoading ? "..." : (
                    <>
                      {stat.prefix}{stat.format ? stat.format(stat.value as number) : stat.value}{stat.suffix}
                    </>
                  )}
                </h4>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              </div>
              <div className="absolute -bottom-4 -right-4 text-slate-50 opacity-[0.35] pointer-events-none group-hover:scale-110 transition-transform duration-500">
                <stat.icon size={120} strokeWidth={1} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] p-8 lg:p-10 relative shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
            <div>
              <h3 className="text-lg font-black text-black tracking-tighter uppercase mb-1">Collection Trends</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{range === '1Y' ? 'Last 12 Months' : `Last ${range === '7D' ? '7 Days' : '30 Days'} Collection`}</p>
            </div>
            <div className="flex gap-2">
              <span 
                onClick={() => setRange('7D')}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${range === '7D' ? 'bg-black text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >7D</span>
              <span 
                onClick={() => setRange('30D')}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${range === '30D' ? 'bg-black text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >30D</span>
              <span 
                onClick={() => setRange('1Y')}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${range === '1Y' ? 'bg-black text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >1Y</span>
            </div>
          </div>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmountModern" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} 
                  dy={10}
                />
                <YAxis 
                  hide={true}
                />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px 20px',
                    fontFamily: 'inherit'
                  }} 
                  cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#0f172a" 
                  strokeWidth={3} 
                  fill="url(#colorAmountModern)" 
                  activeDot={{ r: 6, fill: '#0f172a', stroke: '#fff', strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-4 bg-white border border-slate-200 rounded-[2.5rem] p-8 lg:p-10 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-black tracking-tighter uppercase">Live Activity</h3>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          </div>
          
          <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar max-h-[320px]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                 <div className="w-6 h-6 border-2 border-slate-200 border-t-black rounded-full animate-spin" />
              </div>
            ) : stats.recentDonations.length > 0 ? (
              stats.recentDonations.slice(0, 3).map((donation: any) => {
                const donorName = donation.donor?.name || donation.donor?.email || "Anonymous";
                const amount = donation.amount.toLocaleString();
                const progName = donation.program?.name || "General Fund";
                const date = new Date(donation.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                
                return (
                  <div key={donation.id} className="flex gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Heart size={16} className="text-slate-800" />
                    </div>
                    <div className="flex-1 border-b border-slate-100 pb-5 opacity-90 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[13px] font-bold text-black">{donorName}</p>
                        <p className="text-[10px] font-bold text-slate-400">{date}</p>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        Donated <span className="font-bold text-emerald-600">₹{amount}</span> to <span className="text-black font-bold">{progName}</span>
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                <Activity size={32} strokeWidth={1.5} />
                <p className="text-xs font-bold uppercase tracking-widest">No recent activity</p>
              </div>
            )}
          </div>
          
          <Link 
            to="/admin/ledger"
            className="mt-6 w-full pt-6 border-t border-slate-100 text-[11px] font-bold uppercase tracking-[0.15em] hover:text-black text-slate-400 transition-colors flex items-center justify-center gap-2 group"
          >
            View Ledger <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}