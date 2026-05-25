import { useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { client } from "../lib/api/client";
import { INDIA_STATES } from "../lib/india-states";

const CAMP_TYPES = [
  { value: "HEALTH", label: "Health" },
  { value: "EDUCATION", label: "Education" },
  { value: "ENVIRONMENT", label: "Environment" },
  { value: "COMMUNITY", label: "Community" },
  { value: "YOUTH", label: "Youth Development" },
] as const;

type CampType = (typeof CAMP_TYPES)[number]["value"];

interface FormData {
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  organizationName: string;
  state: string;
  district: string;
  address: string;
  campType: CampType | "";
  expectedDate: string;
  durationDays: string;
  expectedParticipants: string;
  description: string;
}

interface FormErrors {
  [key: string]: string;
}

const EMPTY: FormData = {
  requesterName: "",
  requesterEmail: "",
  requesterPhone: "",
  organizationName: "",
  state: "",
  district: "",
  address: "",
  campType: "",
  expectedDate: "",
  durationDays: "1",
  expectedParticipants: "",
  description: "",
};

function minDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

function validate(form: FormData): FormErrors {
  const e: FormErrors = {};
  if (!form.requesterName.trim()) e.requesterName = "Full name is required.";
  if (!form.requesterEmail.trim()) {
    e.requesterEmail = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.requesterEmail)) {
    e.requesterEmail = "Enter a valid email address.";
  }
  if (!form.requesterPhone.trim()) {
    e.requesterPhone = "Phone number is required.";
  } else if (!/^\d{10}$/.test(form.requesterPhone.replace(/\s/g, ""))) {
    e.requesterPhone = "Enter a valid 10-digit phone number.";
  }
  if (!form.state) e.state = "Please select a state.";
  if (!form.district.trim()) e.district = "District is required.";
  if (!form.address.trim()) e.address = "Venue address is required.";
  if (!form.campType) e.campType = "Please select a camp type.";
  if (!form.expectedDate) {
    e.expectedDate = "Expected date is required.";
  } else if (form.expectedDate < minDate()) {
    e.expectedDate = "Date must be at least 7 days from today.";
  }
  const dur = parseInt(form.durationDays, 10);
  if (!form.durationDays || isNaN(dur) || dur < 1) e.durationDays = "Duration must be at least 1 day.";
  const parts = parseInt(form.expectedParticipants, 10);
  if (!form.expectedParticipants || isNaN(parts) || parts < 1) {
    e.expectedParticipants = "Enter expected number of participants.";
  }
  return e;
}

interface SuccessData {
  name: string;
  campType: string;
  district: string;
  state: string;
  email: string;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1.5 text-red-500 text-xs font-medium mt-1.5">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {msg}
    </p>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="mb-6">
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.18em]">{title}</p>
      <div className="mt-2 h-px bg-slate-100" />
    </div>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      <FieldError msg={error} />
    </div>
  );
}

export function RequestCampPage() {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);

  const set = (key: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await client.post("/camp-requests", {
        requesterName: form.requesterName.trim(),
        requesterEmail: form.requesterEmail.toLowerCase().trim(),
        requesterPhone: form.requesterPhone.trim(),
        organizationName: form.organizationName.trim() || undefined,
        state: form.state,
        district: form.district.trim(),
        address: form.address.trim(),
        campType: form.campType,
        expectedDate: form.expectedDate,
        durationDays: parseInt(form.durationDays, 10),
        expectedParticipants: parseInt(form.expectedParticipants, 10),
        description: form.description.trim() || undefined,
      });
      setSuccess({
        name: form.requesterName.trim().split(" ")[0],
        campType: CAMP_TYPES.find((t) => t.value === form.campType)?.label ?? form.campType,
        district: form.district.trim(),
        state: form.state,
        email: form.requesterEmail.toLowerCase().trim(),
      });
    } catch (err: any) {
      setErrors({ _global: err?.message || "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (field: string) =>
    `w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-800 bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all ${
      errors[field] ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-slate-100 focus:border-slate-400"
    }`;

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-20">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Request Submitted!</h1>
          <p className="text-slate-500 text-base leading-relaxed mb-2">
            Thank you, <span className="font-bold text-slate-700">{success.name}</span>!
          </p>
          <p className="text-slate-500 text-base leading-relaxed mb-8">
            We've received your request for a <span className="font-semibold text-slate-700">{success.campType}</span> camp in{" "}
            <span className="font-semibold text-slate-700">{success.district}, {success.state}</span>.
            Our regional coordinator will review it and get back to you at{" "}
            <span className="font-semibold text-slate-700">{success.email}</span> within 3–5 working days.
          </p>
          <p className="text-sm text-slate-400 mb-8">Check your email for a confirmation message.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => { setForm(EMPTY); setErrors({}); setSuccess(null); }}
              className="px-6 py-3 rounded-full border border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-400 hover:text-slate-900 transition-all"
            >
              Submit Another Request
            </button>
            <Link
              to="/"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-sm font-bold hover:bg-slate-800 transition-all"
            >
              Back to Home <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-slate-950 text-white px-6 py-20 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Community Camps</p>
        <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4 leading-tight">
          Host a Camp with<br className="hidden sm:block" /> WombTo18 Foundation
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
          Partner with us to organize an impactful community camp in your area — health, education, or more.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <form onSubmit={handleSubmit} noValidate className="space-y-10">

          {/* Global error */}
          {errors._global && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {errors._global}
            </div>
          )}

          {/* ── Section 1: Your Details ── */}
          <div>
            <SectionHeading title="Your Details" />
            <div className="space-y-5">
              <Field label="Full Name" required error={errors.requesterName}>
                <input
                  type="text"
                  placeholder="Arjun Mehta"
                  value={form.requesterName}
                  onChange={(e) => set("requesterName", e.target.value)}
                  className={inputCls("requesterName")}
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Email Address" required error={errors.requesterEmail}>
                  <input
                    type="email"
                    placeholder="arjun@gmail.com"
                    value={form.requesterEmail}
                    onChange={(e) => set("requesterEmail", e.target.value)}
                    className={inputCls("requesterEmail")}
                  />
                </Field>
                <Field label="Phone Number" required error={errors.requesterPhone}>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={form.requesterPhone}
                    onChange={(e) => set("requesterPhone", e.target.value.replace(/\D/g, ""))}
                    className={inputCls("requesterPhone")}
                  />
                </Field>
              </div>
              <Field label="Organisation / Group Name" error={errors.organizationName}>
                <input
                  type="text"
                  placeholder="Green Earth NGO (optional)"
                  value={form.organizationName}
                  onChange={(e) => set("organizationName", e.target.value)}
                  className={inputCls("organizationName")}
                />
              </Field>
            </div>
          </div>

          {/* ── Section 2: Camp Location ── */}
          <div>
            <SectionHeading title="Camp Location" />
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="State" required error={errors.state}>
                  <select
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                    className={inputCls("state")}
                  >
                    <option value="">Select state…</option>
                    {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="District" required error={errors.district}>
                  <input
                    type="text"
                    placeholder="Surat"
                    value={form.district}
                    onChange={(e) => set("district", e.target.value)}
                    className={inputCls("district")}
                  />
                </Field>
              </div>
              <Field label="Full Venue Address" required error={errors.address}>
                <textarea
                  placeholder="Near Civil Hospital, Ring Road, Surat - 395001"
                  rows={3}
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  className={`${inputCls("address")} resize-none`}
                />
              </Field>
            </div>
          </div>

          {/* ── Section 3: Camp Details ── */}
          <div>
            <SectionHeading title="Camp Details" />
            <div className="space-y-5">
              <Field label="Camp Type" required error={errors.campType}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
                  {CAMP_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all text-sm font-semibold ${
                        form.campType === type.value
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="campType"
                        value={type.value}
                        checked={form.campType === type.value}
                        onChange={() => set("campType", type.value)}
                        className="sr-only"
                      />
                      {type.label}
                    </label>
                  ))}
                </div>
              </Field>

              <div className="grid sm:grid-cols-3 gap-5">
                <div className="sm:col-span-1">
                  <Field label="Expected Date" required error={errors.expectedDate}>
                    <input
                      type="date"
                      min={minDate()}
                      value={form.expectedDate}
                      onChange={(e) => set("expectedDate", e.target.value)}
                      className={inputCls("expectedDate")}
                    />
                  </Field>
                  <p className="text-xs text-slate-400 mt-1.5">Must be ≥ 7 days from today</p>
                </div>
                <Field label="Duration (days)" required error={errors.durationDays}>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={form.durationDays}
                    onChange={(e) => set("durationDays", e.target.value)}
                    className={inputCls("durationDays")}
                  />
                </Field>
                <Field label="Expected Participants" required error={errors.expectedParticipants}>
                  <input
                    type="number"
                    min={1}
                    placeholder="150"
                    value={form.expectedParticipants}
                    onChange={(e) => set("expectedParticipants", e.target.value)}
                    className={inputCls("expectedParticipants")}
                  />
                </Field>
              </div>

              <Field label="Additional Notes" error={errors.description}>
                <textarea
                  placeholder="Tell us about your plans, resources you have, communities you'll serve…"
                  rows={4}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className={`${inputCls("description")} resize-none`}
                />
              </Field>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              By submitting, you agree that WombTo18 Foundation may contact you at the provided email and phone number regarding your camp request.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-4 bg-black hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-black/10 active:scale-[0.99]"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
              ) : (
                <><span>Submit Camp Request</span><ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
