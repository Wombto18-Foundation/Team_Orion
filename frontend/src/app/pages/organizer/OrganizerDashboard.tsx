import { useState, useEffect } from "react";
import { Users, CheckCircle2, Activity, Clock, MapPin, Calendar, Loader2, Tent, Coins, Pencil, Check, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { client } from "../../lib/api/client";
import { toast } from "sonner";

interface CampStats { total: number; joining: number; attended: number; pending: number }
interface Camp {
  id: string; name: string; date: string; endDate?: string;
  location?: string; purpose?: string; campType?: string; status?: string; state?: string;
  totalCoinPool: number;
}
interface CampData { success: boolean; camp: Camp; stats: CampStats }

const STATUS_STYLES: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-700",
  ONGOING: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-slate-100 text-slate-500",
  CANCELLED: "bg-red-100 text-red-600",
};

export function OrganizerDashboard() {
  const [data, setData] = useState<CampData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPool, setEditingPool] = useState(false);
  const [poolInput, setPoolInput] = useState<number | "">("");
  const [savingPool, setSavingPool] = useState(false);

  useEffect(() => {
    client.get<CampData>("/organizer/camp")
      .then((res) => {
        if (res.success) {
          setData(res);
          setPoolInput(res.camp.totalCoinPool || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const savePool = async () => {
    const val = Number(poolInput);
    if (!val || val < 100) { toast.error("Minimum coin pool is 100."); return; }
    setSavingPool(true);
    try {
      await client.put<any>("/organizer/camp/coin-pool", { totalCoinPool: val });
      setData((prev) => prev ? { ...prev, camp: { ...prev.camp, totalCoinPool: val } } : prev);
      setEditingPool(false);
      toast.success("Coin prize pool updated.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update.");
    } finally {
      setSavingPool(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-slate-400">
        <Tent className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">Failed to load camp data. Please refresh the page.</p>
      </div>
    );
  }

  const { camp, stats } = data;

  const statCards = [
    { label: "Registered", value: stats.total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Joining", value: stats.joining, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Attended", value: stats.attended, icon: Activity, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Pending RSVP", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const dateDisplay = camp.endDate
    ? `${formatDate(camp.date)} — ${formatDate(camp.endDate)}`
    : formatDate(camp.date);

  const joiningCount = stats.joining > 0 ? stats.joining : (stats.total > 0 ? stats.total : 1);
  const coinsPerVolunteer = camp.totalCoinPool > 0 ? Math.floor(camp.totalCoinPool / joiningCount) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">{camp.name}</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your camp's registrations and status.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-black text-slate-900">{card.value.toLocaleString("en-IN")}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Coin Prize Pool */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-200/60 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
              <Coins className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Coin Prize Pool</p>
              <p className="text-[11px] text-amber-600/70">Divided equally among attending volunteers</p>
            </div>
          </div>
          {!editingPool && camp.status !== "COMPLETED" && (
            <button
              onClick={() => { setEditingPool(true); setPoolInput(camp.totalCoinPool || ""); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-white/70 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          )}
        </div>

        {editingPool ? (
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={100}
              step={50}
              value={poolInput}
              onChange={(e) => setPoolInput(e.target.value === "" ? "" : Number(e.target.value))}
              className="h-10 rounded-xl border-amber-200 bg-white w-40 font-bold text-slate-900"
              autoFocus
            />
            <Button size="sm" onClick={savePool} disabled={savingPool} className="h-10 bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-4">
              {savingPool ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditingPool(false)} disabled={savingPool} className="h-10 rounded-xl px-3">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-end gap-6 mt-1">
            <div>
              <p className="text-4xl font-black text-amber-700 tracking-tight">
                {camp.totalCoinPool > 0 ? camp.totalCoinPool.toLocaleString("en-IN") : "—"}
              </p>
              <p className="text-xs font-semibold text-amber-600/80 mt-0.5">total coins</p>
            </div>
            {camp.totalCoinPool > 0 && (
              <div className="pb-1">
                <p className="text-xl font-black text-emerald-700">≈ {coinsPerVolunteer.toLocaleString("en-IN")}</p>
                <p className="text-xs font-semibold text-emerald-600/80">per volunteer ({joiningCount} joining)</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Camp Details */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Camp Details</h2>
          {camp.status && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[camp.status] ?? "bg-slate-100 text-slate-500"}`}>
              {camp.status}
            </span>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <DetailRow label="Camp Name" value={camp.name} />
          <DetailRow label="Camp Type" value={camp.purpose ?? camp.campType} />
          <DetailRow
            label="Date"
            value={dateDisplay}
            icon={<Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
          />
          {camp.location && (
            <DetailRow
              label="Location"
              value={camp.location}
              icon={<MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
            />
          )}
          {camp.state && <DetailRow label="State" value={camp.state} />}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-start gap-1.5">
        {icon}
        <p className="text-sm font-semibold text-slate-700 leading-snug">{value ?? "—"}</p>
      </div>
    </div>
  );
}
