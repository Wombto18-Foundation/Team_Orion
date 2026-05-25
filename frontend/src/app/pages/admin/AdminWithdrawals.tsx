import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, RefreshCw, ChevronRight, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import { client } from "../../lib/api/client";
import { useStateParam } from "../../context/AdminStateContext";

type WStatus = "PENDING" | "APPROVED" | "PAID" | "REJECTED";

interface BankDetails {
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  upiId?: string;
}

interface Withdrawal {
  id: string;
  amountInr: number;
  amountCoins: number;
  status: WStatus;
  createdAt: string;
  adminNotes?: string;
  transactionRef?: string;
  volunteer: {
    name: string;
    volunteerId: string;
    email: string;
    mobile: string;
    state?: string;
    bankDetails?: string; // JSON string in DB
  };
}

function parseBankDetails(raw?: string): BankDetails | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

interface Stats { pending: number; approved: number; paid: number; rejected: number }

const STATUS_BADGE: Record<WStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
};

const TABS: Array<{ key: string; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "PAID", label: "Paid" },
  { key: "REJECTED", label: "Rejected" },
];

export function AdminWithdrawals() {
  const stateParam = useStateParam();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, paid: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");

  const [detail, setDetail] = useState<Withdrawal | null>(null);
  const [approveTarget, setApproveTarget] = useState<Withdrawal | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Withdrawal | null>(null);
  const [paidTarget, setPaidTarget] = useState<Withdrawal | null>(null);

  const [notes, setNotes] = useState("");
  const [txRef, setTxRef] = useState("");
  const [acting, setActing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const statusQ = tab !== "ALL" ? `&status=${tab}` : "";
      const [list, s] = await Promise.allSettled([
        client.get<Withdrawal[]>(`/admin/withdrawals${stateParam ? stateParam + "&" : "?"}${statusQ.slice(1)}`),
        client.get<Stats>(`/admin/withdrawals/stats${stateParam}`),
      ]);
      if (list.status === "fulfilled") setWithdrawals((list.value as any)?.withdrawals ?? list.value ?? []);
      if (s.status === "fulfilled") setStats((s.value as any)?.stats ?? s.value ?? stats);
    } catch {
      toast.error("Failed to load withdrawals.");
    } finally {
      setLoading(false);
    }
  }, [tab, stateParam]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = withdrawals.filter((w) => {
    const q = search.toLowerCase();
    return !q || w.volunteer.name.toLowerCase().includes(q) || w.volunteer.volunteerId.toLowerCase().includes(q);
  });

  const act = async (fn: () => Promise<any>, successMsg: string, onClose: () => void) => {
    setActing(true);
    try {
      await fn();
      toast.success(successMsg);
      onClose();
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Action failed.");
    } finally {
      setActing(false);
    }
  };

  const approve = () => act(
    () => client.put(`/admin/withdrawals/${approveTarget!.id}/approve`, { adminNotes: notes }),
    "Withdrawal approved.",
    () => { setApproveTarget(null); setNotes(""); },
  );

  const reject = () => act(
    () => client.put(`/admin/withdrawals/${rejectTarget!.id}/reject`, { adminNotes: notes }),
    "Withdrawal rejected.",
    () => { setRejectTarget(null); setNotes(""); },
  );

  const markPaid = () => act(
    () => client.put(`/admin/withdrawals/${paidTarget!.id}/mark-paid`, { transactionRef: txRef }),
    "Marked as paid.",
    () => { setPaidTarget(null); setTxRef(""); },
  );

  const tabCounts: Record<string, number> = {
    ALL: withdrawals.length,
    PENDING: stats.pending,
    APPROVED: stats.approved,
    PAID: stats.paid,
    REJECTED: stats.rejected,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Withdrawals</h1>
          <p className="text-sm text-slate-500 mt-1">Review and process volunteer withdrawal requests.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
        </Button>
      </div>

      {/* Tab Bar */}
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search volunteer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">No withdrawals found.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  {["Volunteer", "State", "Coins", "Amount ₹", "Requested", "Status", "Actions"].map((h, i) => (
                    <th key={h} className={`px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider ${i === 6 ? "text-right" : "text-left"} ${i === 1 ? "hidden md:table-cell" : ""} ${i === 2 ? "hidden sm:table-cell" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => setDetail(w)}>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{w.volunteer.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{w.volunteer.volunteerId}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell">{w.volunteer.state ?? "—"}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium hidden sm:table-cell">{w.amountCoins?.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">₹{w.amountInr?.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{new Date(w.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_BADGE[w.status]}`}>{w.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {w.status === "PENDING" && (
                          <>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3 rounded-lg" onClick={() => { setApproveTarget(w); setNotes(""); }}>Approve</Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7 px-3 rounded-lg" onClick={() => { setRejectTarget(w); setNotes(""); }}>Reject</Button>
                          </>
                        )}
                        {w.status === "APPROVED" && (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-3 rounded-lg" onClick={() => { setPaidTarget(w); setTxRef(""); }}>Mark Paid</Button>
                        )}
                        {(w.status === "PAID" || w.status === "REJECTED") && (
                          <button onClick={() => setDetail(w)} className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1">View <ChevronRight className="h-3 w-3" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Detail Drawer ── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-slate-900/20" />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Withdrawal Details</h2>
              <button onClick={() => setDetail(null)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-5">
              <Section title="Volunteer">
                <Row label="Name" val={detail.volunteer.name} />
                <Row label="ID" val={detail.volunteer.volunteerId} mono />
                <Row label="State" val={detail.volunteer.state} />
                <Row label="Email" val={detail.volunteer.email} />
                <Row label="Phone" val={detail.volunteer.mobile} />
              </Section>
              <Section title="Request">
                <Row label="Coins" val={detail.amountCoins?.toLocaleString("en-IN")} />
                <Row label="Amount" val={`₹${detail.amountInr?.toLocaleString("en-IN")}`} />
                <Row label="Requested" val={new Date(detail.createdAt).toLocaleDateString("en-IN")} />
                <Row label="Status">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_BADGE[detail.status]}`}>{detail.status}</span>
                </Row>
                {detail.adminNotes && <Row label="Admin Notes" val={detail.adminNotes} />}
                {detail.transactionRef && <Row label="Txn Ref" val={detail.transactionRef} mono />}
              </Section>
              {(() => {
                const bank = parseBankDetails(detail.volunteer.bankDetails);
                return bank ? (
                  <Section title="Bank Details">
                    <Row label="Account Holder" val={bank.accountHolderName} />
                    <Row label="Account No." val={bank.accountNumber} mono />
                    <Row label="IFSC" val={bank.ifscCode} mono />
                    <Row label="Bank" val={bank.bankName} />
                    {bank.upiId && <Row label="UPI" val={bank.upiId} />}
                  </Section>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Approve Modal ── */}
      <Dialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Approve Withdrawal</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 text-sm text-slate-600">
            <p>Volunteer: <strong>{approveTarget?.volunteer.name}</strong></p>
            <p>Amount: <strong>₹{approveTarget?.amountInr?.toLocaleString("en-IN")}</strong></p>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Admin Notes (optional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Will be processed by 25 May…" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={approve} disabled={acting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Modal ── */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Reject Withdrawal</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 text-sm text-slate-600">
            <p>Volunteer: <strong>{rejectTarget?.volunteer.name}</strong></p>
            <p>Amount: <strong>₹{rejectTarget?.amountInr?.toLocaleString("en-IN")}</strong></p>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Reason * <span className="font-normal text-slate-400">(sent to volunteer)</span></Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Bank IFSC code appears incorrect…" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={reject} disabled={acting || !notes.trim()} className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40">
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Mark Paid Modal ── */}
      <Dialog open={!!paidTarget} onOpenChange={(o) => !o && setPaidTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Mark as Paid</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 text-sm text-slate-600">
            <p>Volunteer: <strong>{paidTarget?.volunteer.name}</strong></p>
            <p>Amount: <strong>₹{paidTarget?.amountInr?.toLocaleString("en-IN")}</strong></p>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Transaction Reference # *</Label>
              <Input value={txRef} onChange={(e) => setTxRef(e.target.value)} placeholder="UTR202605241234567" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={markPaid} disabled={acting || !txRef.trim()} className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40">
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Paid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Row({ label, val, children, mono }: { label: string; val?: string; children?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-semibold text-slate-400 shrink-0">{label}</span>
      {children ?? <span className={`text-xs font-semibold text-slate-700 text-right ${mono ? "font-mono" : ""}`}>{val ?? "—"}</span>}
    </div>
  );
}
