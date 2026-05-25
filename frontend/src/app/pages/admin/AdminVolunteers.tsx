import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, RefreshCw, Download } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import { client } from "../../lib/api/client";
import { useStateParam } from "../../context/AdminStateContext";
import { INDIA_STATES } from "../../lib/india-states";

interface Volunteer {
  id: string;
  volunteerId: string;
  name: string;
  email: string;
  mobile?: string;
  state?: string;
  totalCoins: number;
  isActive: boolean;
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-500",
};

export function AdminVolunteers() {
  const stateParam = useStateParam();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (stateFilter) params.set("state", stateFilter);
      else if (stateParam) {
        const sp = new URLSearchParams(stateParam.slice(1));
        sp.forEach((v, k) => params.set(k, v));
      }
      if (statusFilter) params.set("status", statusFilter === "active" ? "ACTIVE" : "INACTIVE");
      const qs = params.toString() ? `?${params.toString()}` : "";
      const data = await client.get<any>(`/admin/volunteers${qs}`);
      setVolunteers(data?.volunteers ?? data ?? []);
    } catch {
      toast.error("Failed to load volunteers.");
    } finally {
      setLoading(false);
    }
  }, [stateFilter, statusFilter, stateParam]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = volunteers.filter((v) => {
    const q = search.toLowerCase();
    return !q || v.name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q) || v.volunteerId.toLowerCase().includes(q);
  });

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ["Name", "Email", "Volunteer ID", "State", "Coins", "Status", "Joined"];
    const rows = filtered.map((v) => [
      `"${v.name}"`,
      `"${v.email}"`,
      `"${v.volunteerId}"`,
      `"${v.state ?? ""}"`,
      v.totalCoins,
      v.isActive ? "Active" : "Inactive",
      `"${new Date(v.createdAt).toLocaleDateString("en-IN")}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `volunteers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Volunteers</h1>
          <p className="text-sm text-slate-500 mt-1">Browse and manage all registered volunteers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={loading || filtered.length === 0}>
            <Download className="h-4 w-4 mr-2" />CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
          </Button>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Total", count: volunteers.length, color: "bg-slate-100 text-slate-700" },
          { label: "Active", count: volunteers.filter((v) => v.isActive).length, color: "bg-emerald-100 text-emerald-700" },
          { label: "Inactive", count: volunteers.filter((v) => !v.isActive).length, color: "bg-red-100 text-red-600" },
        ].map((chip) => (
          <span key={chip.label} className={`px-3 py-1.5 rounded-full text-xs font-bold ${chip.color}`}>
            {chip.label}: {chip.count}
          </span>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search name, email, volunteer ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
        </div>
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-700">
          <option value="">All States</option>
          {INDIA_STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-700">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">No volunteers found.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  {["Volunteer", "ID", "State", "Coins", "Joined", "Status"].map((h, i) => (
                    <th key={h} className={`px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left ${i === 2 ? "hidden sm:table-cell" : ""} ${i === 3 ? "hidden md:table-cell" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{v.name}</p>
                      <p className="text-[11px] text-slate-400">{v.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-mono font-bold">{v.volunteerId}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs hidden sm:table-cell">{v.state ?? "—"}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-semibold hidden md:table-cell">{v.totalCoins.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {new Date(v.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${v.isActive ? STATUS_BADGE.active : STATUS_BADGE.inactive}`}>
                        {v.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
            Showing {filtered.length} of {volunteers.length} volunteers
          </div>
        </div>
      )}
    </div>
  );
}
