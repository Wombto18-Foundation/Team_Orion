import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Key, PowerOff, Power, Trash2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import { client } from "../../lib/api/client";
import { INDIA_STATES } from "../../lib/india-states";

interface SubAdmin {
  id: string;
  name: string;
  email: string;
  phone?: string;
  state?: string;
  isActive: boolean;
  createdAt: string;
}

const EMPTY_FORM = { name: "", email: "", phone: "", state: "", password: "auto-generate" };

export function AdminSubAdmins() {
  const [admins, setAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubAdmin | null>(null);
  const [resetTarget, setResetTarget] = useState<SubAdmin | null>(null);
  const [toggleTarget, setToggleTarget] = useState<SubAdmin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubAdmin | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Form
  const [form, setForm] = useState(EMPTY_FORM);
  const [autoGen, setAutoGen] = useState(true);
  const [acting, setActing] = useState(false);

  const fetch = () => {
    setLoading(true);
    client.get<any>("/admin/sub-admins")
      .then((r: any) => setAdmins(r?.admins ?? r ?? []))
      .catch(() => toast.error("Failed to load sub-admins."))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const filtered = admins.filter((a) => {
    const q = search.toLowerCase();
    const matchQ = !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    const matchState = !stateFilter || a.state === stateFilter;
    const matchStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? a.isActive : !a.isActive);
    return matchQ && matchState && matchStatus;
  });

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.state) { toast.error("Name, email and state are required."); return; }
    setActing(true);
    try {
      await client.post("/admin/sub-admins", { ...form, password: autoGen ? "auto-generate" : form.password });
      toast.success("Sub-admin created. Credentials emailed.");
      setCreateOpen(false); setForm(EMPTY_FORM); setAutoGen(true); fetch();
    } catch (e: any) { toast.error(e.message || "Failed to create."); }
    finally { setActing(false); }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setActing(true);
    try {
      await client.put(`/admin/sub-admins/${editTarget.id}`, { name: form.name, phone: form.phone, state: form.state });
      toast.success("Sub-admin updated.");
      setEditTarget(null); fetch();
    } catch (e: any) { toast.error(e.message || "Failed to update."); }
    finally { setActing(false); }
  };

  const handleReset = async () => {
    if (!resetTarget) return;
    setActing(true);
    try {
      await client.post(`/admin/sub-admins/${resetTarget.id}/reset-password`, {});
      toast.success("New password emailed.");
      setResetTarget(null);
    } catch (e: any) { toast.error(e.message || "Failed to reset."); }
    finally { setActing(false); }
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    setActing(true);
    try {
      await client.put(`/admin/sub-admins/${toggleTarget.id}/toggle`, {});
      toast.success(toggleTarget.isActive ? "Admin deactivated." : "Admin activated.");
      setToggleTarget(null); fetch();
    } catch (e: any) { toast.error(e.message || "Failed."); }
    finally { setActing(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirm !== "DELETE") return;
    setActing(true);
    try {
      await client.delete(`/admin/sub-admins/${deleteTarget.id}?confirm=DELETE`);
      toast.success("Admin permanently deleted.");
      setDeleteTarget(null); setDeleteConfirm(""); fetch();
    } catch (e: any) { toast.error(e.message || "Failed."); }
    finally { setActing(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sub-Admins</h1>
          <p className="text-sm text-slate-500 mt-1">Manage state administrators for each region.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
          </Button>
          <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setAutoGen(true); setCreateOpen(true); }} className="bg-black hover:bg-slate-800 text-white rounded-xl">
            <Plus className="h-4 w-4 mr-2" />Add Sub Admin
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
        </div>
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white">
          <option value="">All States</option>
          {INDIA_STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white">
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">No sub-admins found.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  {["Name", "Email", "State", "Phone", "Status", "Created", "Actions"].map((h, i) => (
                    <th key={h} className={`px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider ${i === 6 ? "text-right" : "text-left"} ${i === 3 ? "hidden md:table-cell" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{a.name}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{a.email}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">{a.state ?? "—"}</td>
                    <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell">{a.phone ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${a.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {a.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionBtn title="Edit" onClick={() => { setForm({ name: a.name, email: a.email, phone: a.phone ?? "", state: a.state ?? "", password: "" }); setEditTarget(a); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </ActionBtn>
                        <ActionBtn title="Reset Password" onClick={() => setResetTarget(a)} color="amber">
                          <Key className="h-3.5 w-3.5" />
                        </ActionBtn>
                        <ActionBtn title={a.isActive ? "Deactivate" : "Activate"} onClick={() => setToggleTarget(a)} color={a.isActive ? "red" : "emerald"}>
                          {a.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                        </ActionBtn>
                        <ActionBtn title="Delete" onClick={() => { setDeleteTarget(a); setDeleteConfirm(""); }} color="red">
                          <Trash2 className="h-3.5 w-3.5" />
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Create Modal ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add State Admin</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Full Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rajesh Kumar" /></Field>
            <Field label="Email Address *"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="rajesh@wombto18.org" /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" /></Field>
            <Field label="Assign State *">
              <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm">
                <option value="">Select state…</option>
                {INDIA_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Password</Label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={autoGen} onChange={(e) => setAutoGen(e.target.checked)} className="rounded" />
                <span className="text-sm text-slate-600">Auto-generate and email password</span>
              </label>
              {!autoGen && <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Set manual password" />}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleCreate} disabled={acting} className="bg-black hover:bg-slate-800 text-white">
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Sub Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Modal ── */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Sub-Admin</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Full Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="State">
              <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm">
                {INDIA_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleEdit} disabled={acting} className="bg-black hover:bg-slate-800 text-white">
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reset Password Modal ── */}
      <Dialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Reset Password</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 py-2">
            Generate a new password for <strong>{resetTarget?.name}</strong> and email it to <strong>{resetTarget?.email}</strong>?
          </p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleReset} disabled={acting} className="bg-amber-500 hover:bg-amber-600 text-white">
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset & Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Toggle Modal ── */}
      <Dialog open={!!toggleTarget} onOpenChange={(o) => !o && setToggleTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{toggleTarget?.isActive ? "Deactivate" : "Activate"} State Admin</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 py-2">
            {toggleTarget?.isActive
              ? <>You are about to deactivate <strong>{toggleTarget?.name}</strong>. They will lose access immediately.</>
              : <>You are about to reactivate <strong>{toggleTarget?.name}</strong>. They will regain login access.</>}
          </p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button
              onClick={handleToggle}
              disabled={acting}
              className={toggleTarget?.isActive ? "bg-red-500 hover:bg-red-600 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
            >
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : (toggleTarget?.isActive ? "Confirm Deactivate" : "Confirm Activate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Modal ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Permanently Delete Admin</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-600">
              You are about to permanently delete <strong>{deleteTarget?.name}</strong>. This cannot be undone.
            </p>
            <Field label='Type "DELETE" to confirm'>
              <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
            </Field>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button
              onClick={handleDelete}
              disabled={acting || deleteConfirm !== "DELETE"}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
            >
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      {children}
    </div>
  );
}

function ActionBtn({
  children, title, onClick, color = "slate",
}: {
  children: React.ReactNode; title: string; onClick: () => void; color?: "slate" | "amber" | "red" | "emerald";
}) {
  const colors = { slate: "text-slate-500 hover:bg-slate-100", amber: "text-amber-600 hover:bg-amber-50", red: "text-red-500 hover:bg-red-50", emerald: "text-emerald-600 hover:bg-emerald-50" };
  return (
    <button title={title} onClick={onClick} className={`p-1.5 rounded-lg transition-colors ${colors[color]}`}>{children}</button>
  );
}
