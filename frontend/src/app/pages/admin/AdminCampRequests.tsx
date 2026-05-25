import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, RefreshCw, Eye, CheckCircle2, XCircle, MapPin, User, CalendarDays, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent } from "../../components/ui/dialog";
import { toast } from "sonner";
import { client } from "../../lib/api/client";
import { useStateParam } from "../../context/AdminStateContext";
import { INDIA_STATES } from "../../lib/india-states";

type CRStatus = "PENDING" | "APPROVED" | "REJECTED";

interface CampRequest {
  id: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  organizationName?: string;
  state: string;
  district: string;
  address: string;
  campType: string;
  expectedDate: string;
  durationDays: number;
  expectedParticipants: number;
  description?: string;
  status: CRStatus;
  reviewedBy?: string;
  adminNotes?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<CRStatus, { badge: string; dot: string; label: string }> = {
  PENDING:  { badge: "bg-amber-50 text-amber-700 border border-amber-200",    dot: "bg-amber-400",   label: "Pending Review" },
  APPROVED: { badge: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500", label: "Approved" },
  REJECTED: { badge: "bg-red-50 text-red-600 border border-red-200",          dot: "bg-red-500",     label: "Rejected" },
};

const TYPE_COLOR: Record<string, string> = {
  HEALTH:      "bg-rose-100 text-rose-700",
  EDUCATION:   "bg-blue-100 text-blue-700",
  ENVIRONMENT: "bg-green-100 text-green-700",
  COMMUNITY:   "bg-purple-100 text-purple-700",
  YOUTH:       "bg-orange-100 text-orange-700",
};

const CAMP_TYPES = ["HEALTH", "EDUCATION", "ENVIRONMENT", "COMMUNITY", "YOUTH"];

const TABS: Array<{ key: string; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

export function AdminCampRequests() {
  const stateParam = useStateParam();
  const [requests, setRequests] = useState<CampRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const [reviewTarget, setReviewTarget] = useState<CampRequest | null>(null);
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState(false);
  const [actingAction, setActingAction] = useState<"approve" | "reject" | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab !== "ALL") params.set("status", tab);
      if (typeFilter) params.set("campType", typeFilter);
      if (stateFilter) params.set("state", stateFilter);
      else if (stateParam) {
        const sp = new URLSearchParams(stateParam.slice(1));
        sp.forEach((v, k) => params.set(k, v));
      }
      const qs = params.toString() ? `?${params.toString()}` : "";
      const data = await client.get<any>(`/admin/camp-requests${qs}`);
      setRequests(data?.requests ?? data ?? []);
    } catch {
      toast.error("Failed to load camp requests.");
    } finally {
      setLoading(false);
    }
  }, [tab, typeFilter, stateFilter, stateParam]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = requests.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.requesterName.toLowerCase().includes(q) || r.requesterEmail.toLowerCase().includes(q) || r.district.toLowerCase().includes(q);
  });

  const approveRequest = async () => {
    if (!reviewTarget) return;
    setActingAction("approve");
    setActing(true);
    try {
      await client.put(`/admin/camp-requests/${reviewTarget.id}/approve`, {});
      toast.success(`Camp approved. Credentials sent to ${reviewTarget.requesterEmail}`);
      setReviewTarget(null); setNotes(""); fetchData();
    } catch (e: any) {
      toast.error(e.message || "Approval failed.");
    } finally { setActing(false); setActingAction(null); }
  };

  const rejectRequest = async () => {
    if (!reviewTarget || !notes.trim()) return;
    setActingAction("reject");
    setActing(true);
    try {
      await client.put(`/admin/camp-requests/${reviewTarget.id}/reject`, { adminNotes: notes });
      toast.success("Request rejected. Notification sent to requester.");
      setReviewTarget(null); setNotes(""); fetchData();
    } catch (e: any) {
      toast.error(e.message || "Rejection failed.");
    } finally { setActing(false); setActingAction(null); }
  };

  const tabCounts: Record<string, number> = {
    ALL: requests.length,
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    APPROVED: requests.filter((r) => r.status === "APPROVED").length,
    REJECTED: requests.filter((r) => r.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Camp Requests</h1>
          <p className="text-sm text-slate-500 mt-1">Review and action public camp hosting applications.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${tab === t.key ? "bg-black text-white" : "text-slate-500 hover:bg-slate-100"}`}
          >
            {t.label} ({tabCounts[t.key] ?? 0})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search requester, district…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
        </div>
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-700">
          <option value="">All States</option>
          {INDIA_STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-700">
          <option value="">All Types</option>
          {CAMP_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">No camp requests found.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  {["Requester", "State / District", "Type", "Expected Date", "People", "Submitted", "Status", ""].map((h, i) => (
                    <th key={i} className={`px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider ${i === 7 ? "text-right" : "text-left"} ${i === 3 ? "hidden lg:table-cell" : ""} ${i === 4 ? "hidden sm:table-cell" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const sc = STATUS_CONFIG[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900">{r.requesterName}</p>
                        <p className="text-[11px] text-slate-400">{r.requesterEmail}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-700">{r.state}</p>
                        <p className="text-[11px] text-slate-400">{r.district}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${TYPE_COLOR[r.campType] ?? "bg-slate-100 text-slate-600"}`}>{r.campType}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs hidden lg:table-cell">
                        {new Date(r.expectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 hidden sm:table-cell">{r.expectedParticipants}</td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${sc.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant={r.status === "PENDING" ? "default" : "outline"}
                          className={`text-xs h-7 px-3 rounded-lg ${r.status === "PENDING" ? "bg-black hover:bg-slate-800 text-white" : ""}`}
                          onClick={() => { setReviewTarget(r); setNotes(""); }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          {r.status === "PENDING" ? "Review" : "View"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
            Showing {filtered.length} of {requests.length} requests
          </div>
        </div>
      )}

      {/* ── Review Modal ── */}
      <Dialog open={!!reviewTarget} onOpenChange={(o) => !o && setReviewTarget(null)}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl">
          {reviewTarget && (() => {
            const sc = STATUS_CONFIG[reviewTarget.status];
            return (
              <>
                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Camp Request</p>
                    <h2 className="text-xl font-black text-slate-900">{reviewTarget.requesterName}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{reviewTarget.requesterEmail}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${sc.badge}`}>
                      <span className={`h-2 w-2 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                    <button
                      onClick={() => setReviewTarget(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[60vh]">

                  {/* Info cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Requester */}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requester</p>
                      </div>
                      <InfoRow label="Phone" value={reviewTarget.requesterPhone} />
                      {reviewTarget.organizationName && <InfoRow label="Org" value={reviewTarget.organizationName} />}
                      <InfoRow label="Submitted" value={new Date(reviewTarget.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
                    </div>

                    {/* Location */}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                      </div>
                      <InfoRow label="State" value={reviewTarget.state} />
                      <InfoRow label="District" value={reviewTarget.district} />
                      <InfoRow label="Address" value={reviewTarget.address} />
                    </div>

                    {/* Camp Details */}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Camp Details</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${TYPE_COLOR[reviewTarget.campType] ?? "bg-slate-100 text-slate-600"}`}>
                          {reviewTarget.campType}
                        </span>
                      </div>
                      <InfoRow label="Date" value={new Date(reviewTarget.expectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
                      <InfoRow label="Duration" value={`${reviewTarget.durationDays} day${reviewTarget.durationDays > 1 ? "s" : ""}`} />
                      <InfoRow label="People" value={String(reviewTarget.expectedParticipants)} />
                    </div>
                  </div>

                  {/* Description */}
                  {reviewTarget.description && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Additional Notes from Requester</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{reviewTarget.description}</p>
                    </div>
                  )}

                  {/* Existing admin notes (non-pending) */}
                  {reviewTarget.adminNotes && reviewTarget.status !== "PENDING" && (
                    <div className={`rounded-xl p-4 ${reviewTarget.status === "APPROVED" ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {reviewTarget.status === "APPROVED"
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          : <XCircle className="h-4 w-4 text-red-500" />
                        }
                        <p className={`text-[10px] font-black uppercase tracking-widest ${reviewTarget.status === "APPROVED" ? "text-emerald-700" : "text-red-600"}`}>Admin Notes</p>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{reviewTarget.adminNotes}</p>
                    </div>
                  )}

                  {/* Action area — PENDING only */}
                  {reviewTarget.status === "PENDING" && (
                    <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</p>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes (required for rejection, optional for approval)…"
                        rows={3}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white placeholder:text-slate-400"
                      />
                      <div className="flex gap-2.5">
                        <Button
                          variant="outline"
                          className="flex-1 h-10 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold"
                          onClick={rejectRequest}
                          disabled={acting || !notes.trim()}
                        >
                          {acting && actingAction === "reject"
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <><XCircle className="h-4 w-4 mr-2" />Reject</>
                          }
                        </Button>
                        <Button
                          className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          onClick={approveRequest}
                          disabled={acting}
                        >
                          {acting && actingAction === "approve"
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <><CheckCircle2 className="h-4 w-4 mr-2" />Approve Camp</>
                          }
                        </Button>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Approving will create a camp and email organizer credentials. Rejection requires a reason which is sent to the requester.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer — for non-pending only */}
                {reviewTarget.status !== "PENDING" && (
                  <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                    <Button variant="outline" className="h-9 px-5" onClick={() => setReviewTarget(null)}>
                      Close
                    </Button>
                  </div>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-xs font-semibold text-slate-700 leading-snug">{value}</span>
    </div>
  );
}
