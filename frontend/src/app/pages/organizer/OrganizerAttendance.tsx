import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Play, StopCircle, Clock, Users, Loader2, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { client } from "../../lib/api/client";

interface ScanEntry { name: string; scannedAt: string }
interface AttendanceStatus {
  active: boolean;
  token?: string;
  expiresAt?: string;
  scans?: ScanEntry[];
}

export function OrganizerAttendance() {
  const [status, setStatus] = useState<AttendanceStatus>({ active: false });
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await client.get<AttendanceStatus>("/organizer/camp/attendance");
      setStatus(res);
      if (res.active && res.expiresAt) {
        setTimeLeft(Math.max(0, Math.floor((new Date(res.expiresAt).getTime() - Date.now()) / 1000)));
      } else {
        setTimeLeft(0);
      }
    } catch {
      // Endpoint may not exist yet — fail silently
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (status.active && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setStatus({ active: false });
            toast.info("Attendance window closed automatically.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status.active, timeLeft]);

  // Periodic refresh of scan log when active
  useEffect(() => {
    if (!status.active) return;
    const id = setInterval(() => fetchStatus(true), 10_000);
    return () => clearInterval(id);
  }, [status.active]);

  const activateWindow = async () => {
    setActing(true);
    try {
      const res = await client.post<AttendanceStatus>("/organizer/camp/activate-attendance");
      setStatus(res);
      if (res.expiresAt) {
        setTimeLeft(Math.max(0, Math.floor((new Date(res.expiresAt).getTime() - Date.now()) / 1000)));
      }
      toast.success("Attendance window opened for 10 minutes.");
    } catch (err: any) {
      toast.error(err.message || "Failed to activate attendance window.");
    } finally {
      setActing(false);
    }
  };

  const closeWindow = async () => {
    setActing(true);
    try {
      await client.post("/organizer/camp/close-attendance");
      setStatus({ active: false });
      setTimeLeft(0);
      if (timerRef.current) clearInterval(timerRef.current);
      toast.success("Attendance window closed.");
    } catch (err: any) {
      toast.error(err.message || "Failed to close window.");
    } finally {
      setActing(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const qrValue =
    status.active && status.token
      ? `${window.location.origin}/scan?token=${status.token}`
      : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">Open a QR window for volunteers to mark their attendance.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchStatus()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Window control card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-900">Attendance Window</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {status.active ? "ACTIVE" : "CLOSED"}
              </span>
            </div>

            {status.active ? (
              <div className="space-y-6">
                {/* Timer + QR layout */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* QR Code */}
                  {qrValue && (
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="p-4 border-2 border-emerald-200 rounded-2xl bg-white shadow-sm">
                        <QRCodeSVG value={qrValue} size={160} level="M" includeMargin={false} />
                      </div>
                      <p className="text-xs text-slate-400 font-medium">Volunteers scan this QR code</p>
                    </div>
                  )}

                  {/* Timer + actions */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                      <span className={`text-4xl font-black tabular-nums ${timeLeft < 60 ? "text-red-600" : "text-slate-900"}`}>
                        {formatTime(timeLeft)}
                      </span>
                      <span className="text-sm text-slate-500 font-medium">remaining</span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Show this QR code to volunteers. The window will auto-close after 10 minutes.
                    </p>
                    <Button
                      onClick={closeWindow}
                      disabled={acting}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <StopCircle className="h-4 w-4 mr-2" />}
                      Close Window Early
                    </Button>
                  </div>
                </div>

                {/* Scan Log */}
                {status.scans && status.scans.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-bold text-slate-700">Scanned: {status.scans.length}</span>
                    </div>
                    <div className="space-y-2 max-h-52 overflow-y-auto rounded-xl border border-slate-100 p-2">
                      {status.scans.map((scan, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 rounded-xl">
                          <span className="text-sm font-semibold text-slate-900">{scan.name}</span>
                          <span className="text-xs text-slate-500 font-medium">
                            {new Date(scan.scannedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
                  <QRCodeSVG value="placeholder" size={40} level="L" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">No active attendance window</p>
                  <p className="text-sm text-slate-400">
                    Go to <span className="font-semibold text-slate-600">Volunteers</span>, select at least one approved volunteer, then open the window.
                  </p>
                </div>
                <Button
                  onClick={activateWindow}
                  disabled={acting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8"
                >
                  {acting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Activate Attendance (10 min)
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
