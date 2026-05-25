import { useState, useEffect } from "react";
import { Search, Check, X, Loader2, RefreshCw, Users, Zap, ZapOff } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { client } from "../../lib/api/client";

type ParticipationStatus = "PENDING" | "APPROVED" | "REJECTED" | "ATTENDED";

interface Volunteer { id: string; volunteerId: string; name: string; email: string; mobile: string; city?: string }
interface Participant { id: string; status: ParticipationStatus; volunteerResponse: string; shareSelected: boolean; createdAt: string; volunteer: Volunteer }

const STATUS_BADGE: Record<ParticipationStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
  ATTENDED: "bg-violet-100 text-violet-700",
};

const RSVP_LABEL: Record<string, string> = {
  JOINING: "Joining",
  NOT_JOINING: "Not Joining",
  UNRESPONDED: "No Response",
};

export function OrganizerVolunteers() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updating, setUpdating] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);

  const fetchParticipants = () => {
    setLoading(true);
    client.get<any>("/organizer/camp/participants")
      .then((res) => { if (res.success) setParticipants(res.participants ?? []); })
      .catch(() => toast.error("Failed to load participants."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchParticipants(); }, []);

  const updateStatus = async (volunteerId: string, status: "APPROVED" | "REJECTED") => {
    setUpdating(volunteerId);
    try {
      await client.put<any>(`/organizer/camp/registrations/${volunteerId}/status`, { status });
      toast.success(`Registration ${status.toLowerCase()}.`);
      fetchParticipants();
    } catch (err: any) {
      toast.error(err.message || "Update failed.");
    } finally {
      setUpdating(null);
    }
  };

  const toggleSelection = async (volunteerId: string, selected: boolean) => {
    setSelecting(volunteerId);
    try {
      await client.put<any>(`/organizer/camp/volunteers/${volunteerId}/select`, { selected });
      setParticipants((prev) =>
        prev.map((p) => p.volunteer.volunteerId === volunteerId ? { ...p, shareSelected: selected } : p)
      );
      toast.success(selected ? "Volunteer selected for attendance." : "Selection removed.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update selection.");
    } finally {
      setSelecting(null);
    }
  };

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.volunteer.name.toLowerCase().includes(q) ||
      (p.volunteer.volunteerId || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    ALL: participants.length,
    PENDING: participants.filter((p) => p.status === "PENDING").length,
    APPROVED: participants.filter((p) => p.status === "APPROVED").length,
    ATTENDED: participants.filter((p) => p.status === "ATTENDED").length,
    REJECTED: participants.filter((p) => p.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Volunteers</h1>
          <p className="text-sm text-slate-500 mt-1">{participants.length} registered for this camp</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchParticipants} disabled={loading} className="self-start sm:self-auto">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "PENDING", "APPROVED", "ATTENDED", "REJECTED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              statusFilter === s ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by name or volunteer ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">No volunteers found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left">Name</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left">Volunteer ID</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left hidden md:table-cell">Phone</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left">Status</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left hidden sm:table-cell">RSVP</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center hidden sm:table-cell">Selected</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const canSelect = (p.status === "APPROVED" || p.status === "ATTENDED") && p.volunteerResponse !== "NOT_JOINING";
                  const isBusy = selecting === p.volunteer.volunteerId || updating === p.volunteer.volunteerId;
                  return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{p.volunteer.name}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{p.volunteer.volunteerId || "—"}</td>
                    <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell">{p.volunteer.mobile || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_BADGE[p.status] ?? "bg-slate-100 text-slate-500"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs hidden sm:table-cell">
                      {RSVP_LABEL[p.volunteerResponse] ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-center hidden sm:table-cell">
                      {canSelect ? (
                        <button
                          onClick={() => toggleSelection(p.volunteer.volunteerId, !p.shareSelected)}
                          disabled={isBusy}
                          title={p.shareSelected ? "Remove from attendance window" : "Add to attendance window"}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50 ${
                            p.shareSelected
                              ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                              : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          {isBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : p.shareSelected ? (
                            <><Zap className="h-3.5 w-3.5" /> Selected</>
                          ) : (
                            <><ZapOff className="h-3.5 w-3.5" /> Select</>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-200">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {p.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => updateStatus(p.volunteer.volunteerId, "APPROVED")}
                            disabled={isBusy}
                            title="Approve"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                          >
                            {updating === p.volunteer.volunteerId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => updateStatus(p.volunteer.volunteerId, "REJECTED")}
                            disabled={isBusy}
                            title="Reject"
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
