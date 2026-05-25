import { Link } from "react-router";
import { Clock, Mail, Heart } from "lucide-react";

export function OrganizerExpired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center mb-5">
            <Clock className="h-8 w-8 text-slate-400" />
          </div>

          <h1 className="text-xl font-black text-slate-900 mb-2">
            Your Dashboard Access Has Ended
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            The access period for your camp organizer dashboard has ended. We hope the camp was a great success!
          </p>

          {/* Thank you card */}
          <div className="bg-emerald-50 rounded-xl p-4 mb-6 border border-emerald-100">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Heart className="h-4 w-4 text-emerald-500 fill-current" />
              <span className="text-sm font-bold text-emerald-700">Thank you for making a difference!</span>
            </div>
            <p className="text-xs text-emerald-600">
              Your camp helped WombTo18 Foundation reach more people in your community.
            </p>
          </div>

          {/* Support */}
          <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3 text-left border border-slate-100">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-slate-200 shrink-0">
              <Mail className="h-4 w-4 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-0.5">Need help?</p>
              <a
                href="mailto:support@wombto18.org"
                className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                support@wombto18.org
              </a>
            </div>
          </div>

          <Link
            to="/"
            className="mt-6 block text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Back to WombTo18.org →
          </Link>
        </div>
      </div>
    </div>
  );
}
