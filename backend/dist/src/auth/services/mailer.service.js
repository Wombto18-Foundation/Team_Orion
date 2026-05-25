"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const https = __importStar(require("https"));
let MailerService = class MailerService {
    configService;
    isEmailDisabled;
    constructor(configService) {
        this.configService = configService;
        this.isEmailDisabled = this.configService.get('DISABLE_EMAIL') === 'true';
    }
    makeHttpsRequest(url, method, headers, body) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || 443,
                path: parsedUrl.pathname + (parsedUrl.search || ''),
                method: method,
                headers: headers,
            };
            const req = https.request(options, (res) => {
                let rawData = '';
                res.on('data', (chunk) => {
                    rawData += chunk;
                });
                res.on('end', () => {
                    resolve({ status: res.statusCode || 500, data: rawData });
                });
            });
            req.on('error', (e) => {
                reject(e);
            });
            if (body) {
                req.write(typeof body === 'string' ? body : JSON.stringify(body));
            }
            req.end();
        });
    }
    async sendEmail(to, subject, html, text) {
        console.log(`[MailerService.sendEmail] CALLED — To: ${to} | Subject: ${subject} | HTML length: ${html?.length || 0}`);
        if (this.isEmailDisabled) {
            console.log(`[EMAIL DISABLED] To: ${to} | Subject: ${subject}`);
            return;
        }
        const serviceId = this.configService.get('EMAILJS_SERVICE_ID');
        const templateId = this.configService.get('EMAILJS_TEMPLATE_ID');
        const publicKey = this.configService.get('EMAILJS_PUBLIC_KEY');
        const privateKey = this.configService.get('EMAILJS_PRIVATE_KEY');
        console.log(`[MailerService.sendEmail] Config — serviceId: ${serviceId ? 'SET' : 'MISSING'} | templateId: ${templateId ? 'SET' : 'MISSING'} | publicKey: ${publicKey ? 'SET' : 'MISSING'} | privateKey: ${privateKey ? 'SET' : 'MISSING'}`);
        if (!serviceId || !templateId || !publicKey) {
            if (this.configService.get('NODE_ENV') !== 'production') {
                console.log(`[EMAIL DEV LOG] (Missing config) To: ${to} | Subject: ${subject}`);
                console.log(`Text preview: ${text.substring(0, 50)}...`);
            }
            else {
                throw new Error('Email configuration missing (EMAILJS_SERVICE_ID, etc.)');
            }
            return;
        }
        try {
            console.log(`[MailerService.sendEmail] Making HTTPS request to EmailJS for: ${to}`);
            const response = await this.makeHttpsRequest('https://api.emailjs.com/api/v1.0/email/send', 'POST', {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }, {
                service_id: serviceId,
                template_id: templateId,
                user_id: publicKey,
                accessToken: privateKey,
                template_params: {
                    to_email: to,
                    to_name: 'WombTo18 User',
                    from_name: 'WombTo18 Foundation',
                    subject: subject,
                    message: html,
                    reply_to: 'no-reply@wombto18.org',
                },
            });
            console.log(`[MailerService.sendEmail] EmailJS Response — Status: ${response.status} | Data: ${response.data.substring(0, 200)}`);
            if (response.status === 200 || response.status === 201) {
                console.log(`[EMAIL SENT SUCCESS] To: ${to} | Subject: ${subject}`);
            }
            else {
                throw new Error(`EmailJS Error (${response.status}): ${response.data}`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('[EMAIL ERROR] Failed to send email.', {
                to,
                subject,
                error: errorMessage
            });
            if (this.configService.get('NODE_ENV') === 'production') {
                throw error;
            }
        }
    }
    async sendOtpEmail(email, code) {
        const subject = 'Your WombTo18 login OTP';
        const text = `Your one-time login code is: ${code}\n\nThis code is valid for 10 minutes. Do not share it with anyone.`;
        const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:1.5rem;font-weight:800;color:#10b981;">WombTo18</span>
          <span style="font-size:1rem;color:#64748b;display:block;margin-top:4px;">Foundation Platform</span>
        </div>
        <div style="background:white;border-radius:10px;padding:28px;text-align:center;">
          <p style="color:#1e293b;font-size:1rem;margin-bottom:20px;">Your one-time login code:</p>
          <div style="display:inline-block;background:#ecfdf5;border:2px solid #6ee7b7;border-radius:10px;padding:16px 40px;">
            <span style="font-size:2.5rem;font-weight:800;letter-spacing:0.2em;color:#059669;">${code}</span>
          </div>
          <p style="color:#64748b;font-size:0.9rem;margin-top:20px;">Valid for <strong>10 minutes</strong>. Do not share this code.</p>
        </div>
        <p style="color:#94a3b8;font-size:0.8rem;text-align:center;margin-top:20px;">If you didn't request this, please ignore this email.</p>
      </div>
    `;
        await this.sendEmail(email, subject, html, text);
    }
    async sendCampNotificationEmail(params) {
        const subject = params.selected
            ? `Your camp attendance link is ready for ${params.campName}`
            : `More camps are coming soon`;
        const text = params.selected
            ? `${params.volunteerName}, your attendance link for ${params.campName} is ready.\n\n${params.message}\n${params.link ? `\nOpen link: ${params.link}` : ''}`
            : `${params.volunteerName}, you were not selected for the current camp window.\n\n${params.message}`;
        const html = this.buildCampEmail({
            eyebrow: params.selected ? "Attendance ready" : "Camp update",
            title: params.selected ? `Your link for ${params.campName} is ready` : "A new camp update for you",
            volunteerName: params.volunteerName,
            campName: params.campName,
            message: params.message,
            link: params.link,
            ctaLabel: params.link ? "Open Attendance Link" : undefined,
            accent: params.selected ? "#16a34a" : "#0f766e",
        });
        await this.sendEmail(params.email, subject, html, text);
    }
    async sendCampReminderEmail(params) {
        const subject = `Your camp is tomorrow: ${params.campName}`;
        const text = `${params.volunteerName}, your camp "${params.campName}" is tomorrow on ${params.campDate}.\n\n${params.message}${params.link ? `\n\nOpen camp link: ${params.link}` : ''}`;
        const html = this.buildCampEmail({
            eyebrow: "Tomorrow reminder",
            title: `Your camp is tomorrow`,
            volunteerName: params.volunteerName,
            campName: params.campName,
            message: params.message,
            link: params.link,
            ctaLabel: params.link ? "Open Camp Details" : undefined,
            accent: "#ea580c",
            metaLine: params.campDate,
        });
        await this.sendEmail(params.email, subject, html, text);
    }
    async sendCampFollowUpEmail(params) {
        const subject = `Thank you for staying in touch with ${params.campName}`;
        const text = `${params.volunteerName}, ${params.campName} has concluded on ${params.campDate}.\n\n${params.message}`;
        const html = this.buildCampEmail({
            eyebrow: "Post-camp note",
            title: `A warm note after ${params.campName}`,
            volunteerName: params.volunteerName,
            campName: params.campName,
            message: params.message,
            accent: "#7c3aed",
            metaLine: params.campDate,
        });
        await this.sendEmail(params.email, subject, html, text);
    }
    buildCampEmail(params) {
        const safeLink = params.link && params.ctaLabel
            ? `<a href="${params.link}" style="display:inline-block;background:${params.accent};color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:800;">${params.ctaLabel}</a>`
            : '';
        return `
      <div style="font-family:Inter,Arial,sans-serif;max-width:620px;margin:0 auto;padding:24px;background:linear-gradient(180deg,#f8fafc 0%,#eff6ff 100%);border-radius:24px;">
        <div style="padding:8px 4px 18px;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,0.8);border:1px solid rgba(148,163,184,0.2);color:#0f172a;font-weight:800;font-size:0.82rem;letter-spacing:0.08em;text-transform:uppercase;">${params.eyebrow}</div>
        </div>
        <div style="background:#ffffff;border:1px solid rgba(148,163,184,0.18);border-radius:22px;padding:28px 26px;box-shadow:0 20px 50px rgba(15,23,42,0.08);">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px;flex-wrap:wrap;">
            <div>
              <p style="margin:0 0 6px;color:#64748b;font-size:0.86rem;font-weight:700;">Hello ${params.volunteerName}</p>
              <h2 style="margin:0;color:#0f172a;font-size:1.55rem;line-height:1.25;font-weight:900;">${params.title}</h2>
            </div>
            <div style="padding:10px 14px;border-radius:16px;background:linear-gradient(135deg,rgba(16,185,129,0.12),rgba(14,165,233,0.12));color:${params.accent};font-weight:900;font-size:0.9rem;">
              ${params.campName}
            </div>
          </div>
          ${params.metaLine ? `<p style="margin:0 0 14px;color:#64748b;font-size:0.9rem;font-weight:700;">${params.metaLine}</p>` : ''}
          <p style="margin:0 0 20px;color:#334155;font-size:0.98rem;line-height:1.8;">${params.message}</p>
          ${safeLink ? `<div style="text-align:center;margin:26px 0 10px;">${safeLink}</div>` : ''}
        </div>
        <p style="margin:18px 0 0;text-align:center;color:#94a3b8;font-size:0.8rem;">WombTo18 Foundation</p>
      </div>
    `;
    }
    async sendCampRequestAcknowledgmentEmail(params) {
        const subject = 'Camp Request Received — WombTo18';
        const text = `Hi ${params.name}, we received your request for a ${params.campType} camp in ${params.district}, ${params.state}. Our regional coordinator will review it within 3–5 working days.`;
        const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:540px;margin:0 auto;padding:28px;background:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:20px;">
          <span style="font-size:1.2rem;font-weight:900;color:#0f172a;">Womb<span style="color:#10b981;">To18</span></span>
          <span style="display:block;font-size:0.75rem;color:#64748b;margin-top:2px;text-transform:uppercase;letter-spacing:0.08em;">Foundation · Camp Programme</span>
        </div>
        <div style="background:#fff;border-radius:14px;padding:28px;border:1px solid #e2e8f0;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:#ecfdf5;color:#166534;font-size:0.72rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:14px;">Request Received</span>
          <h2 style="margin:0 0 12px;color:#0f172a;font-size:1.2rem;font-weight:800;">We've received your camp request!</h2>
          <p style="margin:0 0 16px;color:#475569;line-height:1.7;">Hi ${params.name}, thank you for applying to host a <strong>${params.campType}</strong> camp in <strong>${params.district}, ${params.state}</strong>.</p>
          <div style="background:#f1f5f9;border-radius:10px;padding:14px 18px;margin-bottom:16px;">
            <p style="margin:0;color:#334155;font-size:0.9rem;line-height:1.6;">Our regional coordinator will review your request within <strong>3–5 working days</strong> and reach out to you via email.</p>
          </div>
          <p style="margin:0;color:#64748b;font-size:0.85rem;">If you have any questions, contact us at <a href="mailto:support@wombto18.org" style="color:#10b981;">support@wombto18.org</a></p>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:0.75rem;margin-top:16px;">WombTo18 Foundation · Automated message, do not reply.</p>
      </div>`;
        await this.sendEmail(params.email, subject, html, text);
    }
    async sendCampRequestApprovedEmail(params) {
        const subject = 'Your Camp Request is Approved! — WombTo18';
        const text = `Congratulations ${params.name}! Your camp request has been approved.\n\nCamp: ${params.campName}\nDates: ${params.campDate} to ${params.campEndDate}\n\nDashboard Login:\nURL: ${params.loginUrl}\nEmail: ${params.email}\nPassword: ${params.password}\n\nAccess valid until: ${params.accessExpiresAt}\nPlease change your password after first login.`;
        const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:540px;margin:0 auto;padding:28px;background:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:20px;">
          <span style="font-size:1.2rem;font-weight:900;color:#0f172a;">Womb<span style="color:#10b981;">To18</span></span>
          <span style="display:block;font-size:0.75rem;color:#64748b;margin-top:2px;text-transform:uppercase;letter-spacing:0.08em;">Foundation · Camp Programme</span>
        </div>
        <div style="background:#fff;border-radius:14px;padding:28px;border:1px solid #e2e8f0;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:#dcfce7;color:#166534;font-size:0.72rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:14px;">🎉 Approved!</span>
          <h2 style="margin:0 0 12px;color:#0f172a;font-size:1.2rem;font-weight:800;">Your camp request is approved!</h2>
          <p style="margin:0 0 16px;color:#475569;line-height:1.7;">Congratulations, ${params.name}! We're excited to have you organise a camp with us.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin-bottom:16px;">
            <p style="margin:0 0 6px;font-size:0.78rem;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.06em;">Camp Details</p>
            <p style="margin:0 0 4px;color:#0f172a;font-weight:700;">${params.campName}</p>
            <p style="margin:0;color:#475569;font-size:0.9rem;">${params.campDate} → ${params.campEndDate}</p>
          </div>
          <div style="background:#f1f5f9;border-radius:10px;padding:16px 18px;margin-bottom:16px;">
            <p style="margin:0 0 8px;font-size:0.78rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Your Dashboard Login</p>
            <p style="margin:0 0 4px;color:#0f172a;"><strong>URL:</strong> <a href="${params.loginUrl}" style="color:#10b981;">${params.loginUrl}</a></p>
            <p style="margin:0 0 4px;color:#0f172a;"><strong>Email:</strong> ${params.email}</p>
            <p style="margin:0 0 8px;color:#0f172a;"><strong>Password:</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;font-family:monospace;">${params.password}</code></p>
            <p style="margin:0;font-size:0.8rem;color:#ef4444;font-weight:600;">⚠ Change your password after your first login.</p>
          </div>
          <p style="margin:0 0 16px;color:#64748b;font-size:0.85rem;">Your dashboard access is valid until <strong>${params.accessExpiresAt}</strong>.</p>
          <div style="text-align:center;">
            <a href="${params.loginUrl}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:12px 32px;border-radius:999px;font-weight:800;font-size:0.95rem;">Open My Dashboard →</a>
          </div>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:0.75rem;margin-top:16px;">WombTo18 Foundation · Automated message, do not reply.</p>
      </div>`;
        await this.sendEmail(params.email, subject, html, text);
    }
    async sendCampRequestRejectedEmail(params) {
        const subject = 'Update on Your Camp Request — WombTo18';
        const text = `Hi ${params.name}, we reviewed your request for a camp in ${params.district}, ${params.state}. Unfortunately we cannot approve it at this time.\n\nReason: ${params.adminNotes}\n\nYou are welcome to submit a new request at any time.`;
        const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:540px;margin:0 auto;padding:28px;background:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:20px;">
          <span style="font-size:1.2rem;font-weight:900;color:#0f172a;">Womb<span style="color:#10b981;">To18</span></span>
          <span style="display:block;font-size:0.75rem;color:#64748b;margin-top:2px;text-transform:uppercase;letter-spacing:0.08em;">Foundation · Camp Programme</span>
        </div>
        <div style="background:#fff;border-radius:14px;padding:28px;border:1px solid #e2e8f0;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:#fee2e2;color:#991b1b;font-size:0.72rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:14px;">Update on your request</span>
          <h2 style="margin:0 0 12px;color:#0f172a;font-size:1.2rem;font-weight:800;">We could not approve your request</h2>
          <p style="margin:0 0 16px;color:#475569;line-height:1.7;">Hi ${params.name}, we reviewed your request for a camp in <strong>${params.district}, ${params.state}</strong>. Unfortunately we cannot approve it at this time.</p>
          <div style="background:#fef9c3;border:1px solid #fde047;border-radius:10px;padding:14px 18px;margin-bottom:16px;">
            <p style="margin:0 0 4px;font-size:0.78rem;font-weight:700;color:#854d0e;text-transform:uppercase;letter-spacing:0.06em;">Reason</p>
            <p style="margin:0;color:#78350f;font-size:0.9rem;line-height:1.6;">${params.adminNotes}</p>
          </div>
          <p style="margin:0;color:#475569;font-size:0.9rem;line-height:1.7;">You are welcome to submit a new request after addressing the above. Visit our website to apply again.</p>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:0.75rem;margin-top:16px;">WombTo18 Foundation · Automated message, do not reply.</p>
      </div>`;
        await this.sendEmail(params.email, subject, html, text);
    }
    async sendWithdrawalApprovedEmail(params) {
        const subject = 'Withdrawal Request Approved — WombTo18';
        const text = `Hi ${params.name}, your withdrawal request of ₹${params.amountInr.toLocaleString('en-IN')} has been approved. It will be processed within 3 working days.${params.adminNotes ? `\n\nNote from admin: ${params.adminNotes}` : ''}`;
        const html = this.buildWithdrawalEmail({
            title: 'Withdrawal Approved!',
            greeting: `Hi ${params.name},`,
            bodyLine: `Your withdrawal request of <strong>₹${params.amountInr.toLocaleString('en-IN')}</strong> has been <strong style="color:#16a34a;">approved</strong>. It will be processed to your registered bank account within <strong>3 working days</strong>.`,
            note: params.adminNotes,
            accent: '#16a34a',
            icon: '✅',
            badge: 'APPROVED',
            badgeBg: '#dcfce7',
            badgeColor: '#166534',
        });
        await this.sendEmail(params.email, subject, html, text);
    }
    async sendWithdrawalRejectedEmail(params) {
        const subject = 'Withdrawal Request Update — WombTo18';
        const text = `Hi ${params.name}, your withdrawal request of ₹${params.amountInr.toLocaleString('en-IN')} could not be approved.\n\nReason: ${params.adminNotes}\n\nPlease update your details and try again.`;
        const html = this.buildWithdrawalEmail({
            title: 'Withdrawal Not Approved',
            greeting: `Hi ${params.name},`,
            bodyLine: `Your withdrawal request of <strong>₹${params.amountInr.toLocaleString('en-IN')}</strong> could not be approved at this time. Please update your details and submit a new request.`,
            note: params.adminNotes,
            accent: '#dc2626',
            icon: '❌',
            badge: 'REJECTED',
            badgeBg: '#fee2e2',
            badgeColor: '#991b1b',
        });
        await this.sendEmail(params.email, subject, html, text);
    }
    async sendWithdrawalPaidEmail(params) {
        const subject = 'Payment Transferred — WombTo18';
        const text = `Hi ${params.name}, ₹${params.amountInr.toLocaleString('en-IN')} has been transferred to your bank account.\n\nTransaction Reference: ${params.transactionRef}${params.adminNotes ? `\nNote: ${params.adminNotes}` : ''}`;
        const html = this.buildWithdrawalEmail({
            title: 'Payment Transferred!',
            greeting: `Hi ${params.name},`,
            bodyLine: `<strong>₹${params.amountInr.toLocaleString('en-IN')}</strong> has been transferred to your registered bank account.`,
            note: params.adminNotes,
            accent: '#0284c7',
            icon: '💸',
            badge: 'PAID',
            badgeBg: '#e0f2fe',
            badgeColor: '#075985',
            extraBlock: `<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:14px 18px;margin:16px 0;">
        <p style="margin:0 0 4px;font-size:0.8rem;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:0.06em;">Transaction Reference</p>
        <p style="margin:0;font-size:1rem;font-weight:900;color:#0f172a;font-family:monospace;">${params.transactionRef}</p>
      </div>`,
        });
        await this.sendEmail(params.email, subject, html, text);
    }
    buildWithdrawalEmail(params) {
        return `
      <div style="font-family:Inter,Arial,sans-serif;max-width:540px;margin:0 auto;padding:28px;background:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:20px;">
          <span style="font-size:1.2rem;font-weight:900;color:#0f172a;">Womb<span style="color:#10b981;">To18</span></span>
          <span style="display:block;font-size:0.75rem;color:#64748b;margin-top:2px;text-transform:uppercase;letter-spacing:0.08em;">Foundation · Volunteer Earnings</span>
        </div>
        <div style="background:#fff;border-radius:14px;padding:28px;border:1px solid #e2e8f0;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <span style="font-size:1.8rem;">${params.icon}</span>
            <div>
              <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${params.badgeBg};color:${params.badgeColor};font-size:0.72rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;">${params.badge}</span>
              <h2 style="margin:4px 0 0;color:#0f172a;font-size:1.2rem;font-weight:800;">${params.title}</h2>
            </div>
          </div>
          <p style="margin:0 0 14px;color:#64748b;font-size:0.88rem;">${params.greeting}</p>
          <p style="margin:0 0 16px;color:#334155;font-size:0.96rem;line-height:1.7;">${params.bodyLine}</p>
          ${params.extraBlock || ''}
          ${params.note ? `<div style="background:#fef9c3;border:1px solid #fde047;border-radius:10px;padding:12px 16px;margin-top:12px;"><p style="margin:0 0 4px;font-size:0.78rem;font-weight:700;color:#854d0e;text-transform:uppercase;">Note from Admin</p><p style="margin:0;color:#78350f;font-size:0.9rem;line-height:1.6;">${params.note}</p></div>` : ''}
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:0.75rem;margin-top:16px;">WombTo18 Foundation · Automated message, do not reply.</p>
      </div>`;
    }
    async sendStateAdminWelcomeEmail(params) {
        const subject = 'Your WombTo18 State Admin Account';
        const text = `Hi ${params.name}, you have been added as State Admin for ${params.state}.\nEmail: ${params.email}\nPassword: ${params.password}\nLogin at: ${params.loginUrl}`;
        const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:540px;margin:0 auto;padding:28px;background:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:20px;">
          <span style="font-size:1.2rem;font-weight:900;color:#0f172a;">Womb<span style="color:#10b981;">To18</span></span>
          <span style="display:block;font-size:0.75rem;color:#64748b;margin-top:2px;text-transform:uppercase;letter-spacing:0.08em;">Foundation · Admin Portal</span>
        </div>
        <div style="background:#fff;border-radius:14px;padding:28px;border:1px solid #e2e8f0;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <p style="margin:0 0 6px;color:#64748b;font-size:0.85rem;">Hello ${params.name},</p>
          <h2 style="margin:0 0 16px;color:#0f172a;font-size:1.3rem;font-weight:800;">You are now a State Admin</h2>
          <p style="color:#475569;margin:0 0 20px;line-height:1.7;">You have been provisioned as the <strong>${params.state}</strong> State Admin on the WombTo18 platform.</p>
          <div style="background:#f1f5f9;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
            <p style="margin:0 0 8px;font-size:0.8rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Your Login Credentials</p>
            <p style="margin:0 0 4px;color:#0f172a;"><strong>Email:</strong> ${params.email}</p>
            <p style="margin:0 0 4px;color:#0f172a;"><strong>Password:</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;font-family:monospace;">${params.password}</code></p>
            <p style="margin:8px 0 0;font-size:0.8rem;color:#ef4444;">Please change your password immediately after logging in.</p>
          </div>
          <div style="text-align:center;">
            <a href="${params.loginUrl}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:12px 32px;border-radius:999px;font-weight:800;font-size:0.95rem;">Login to Dashboard →</a>
          </div>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:0.75rem;margin-top:16px;">WombTo18 Foundation · Automated message, do not reply.</p>
      </div>`;
        await this.sendEmail(params.email, subject, html, text);
    }
    async sendStateAdminPasswordResetEmail(params) {
        const subject = 'Your WombTo18 Admin Password Has Been Reset';
        const text = `Hi ${params.name}, your admin account password has been reset.\nNew Password: ${params.newPassword}\nLogin at: ${params.loginUrl}`;
        const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:540px;margin:0 auto;padding:28px;background:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:20px;">
          <span style="font-size:1.2rem;font-weight:900;color:#0f172a;">Womb<span style="color:#10b981;">To18</span></span>
          <span style="display:block;font-size:0.75rem;color:#64748b;margin-top:2px;text-transform:uppercase;letter-spacing:0.08em;">Foundation · Admin Portal</span>
        </div>
        <div style="background:#fff;border-radius:14px;padding:28px;border:1px solid #e2e8f0;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <p style="margin:0 0 6px;color:#64748b;font-size:0.85rem;">Hello ${params.name},</p>
          <h2 style="margin:0 0 16px;color:#0f172a;font-size:1.3rem;font-weight:800;">Your Password Has Been Reset</h2>
          <p style="color:#475569;margin:0 0 20px;line-height:1.7;">A Super Admin has reset your login password. Use the credentials below to log back in.</p>
          <div style="background:#fef9c3;border:1px solid #fde047;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
            <p style="margin:0 0 8px;font-size:0.8rem;font-weight:700;color:#854d0e;text-transform:uppercase;letter-spacing:0.06em;">New Credentials</p>
            <p style="margin:0 0 4px;color:#0f172a;"><strong>Email:</strong> ${params.email}</p>
            <p style="margin:0;color:#0f172a;"><strong>New Password:</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;font-family:monospace;">${params.newPassword}</code></p>
          </div>
          <div style="text-align:center;">
            <a href="${params.loginUrl}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:12px 32px;border-radius:999px;font-weight:800;font-size:0.95rem;">Login Now →</a>
          </div>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:0.75rem;margin-top:16px;">WombTo18 Foundation · Automated message, do not reply.</p>
      </div>`;
        await this.sendEmail(params.email, subject, html, text);
    }
    async sendWelcomeDonorEmail(params) {
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
        const loginUrl = `${frontendUrl}/login`;
        const subject = '🎉 Welcome to WombTo18 Foundation — You Make the Difference!';
        const text = `Dear ${params.name}, welcome to WombTo18 Foundation! Your Donor ID is ${params.donorId}. Login at ${loginUrl}`;
        const html = this.buildWelcomeEmail({
            userName: params.name,
            role: 'DONOR',
            identityId: params.donorId,
            identityLabel: 'Donor ID',
            loginUrl,
            accentColor: '#10b981',
            accentGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            accentLight: '#ecfdf5',
            accentBorder: '#6ee7b7',
            roleIcon: '💚',
            roleTitle: 'Valued Donor',
            roleTagline: 'Your generosity transforms lives from womb to 18.',
            founderMessage: `Thank you for believing in the power of change. At WombTo18, every rupee you contribute directly nurtures a child's journey — from healthcare in the womb to education at 18. You're not just donating; you're building futures. Welcome to a family that turns compassion into action.`,
            dashboardFeatures: [
                { icon: '📊', title: 'Track Your Impact', desc: 'See exactly how your donations create change' },
                { icon: '🧾', title: 'Tax Receipts', desc: 'Download 80G certificates instantly' },
                { icon: '🤝', title: 'Refer & Multiply', desc: 'Invite others and amplify your impact' },
            ],
        });
        await this.sendEmail(params.email, subject, html, text);
    }
    async sendWelcomeVolunteerEmail(params) {
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
        const loginUrl = `${frontendUrl}/login`;
        const subject = '🌟 Welcome Aboard, Changemaker — WombTo18 Foundation';
        const text = `Dear ${params.name}, welcome to WombTo18 Foundation as a Volunteer! Your ID is ${params.volunteerId || params.donorId}. Login at ${loginUrl}`;
        const html = this.buildWelcomeEmail({
            userName: params.name,
            role: 'VOLUNTEER',
            identityId: params.volunteerId || params.donorId,
            identityLabel: 'Volunteer ID',
            loginUrl,
            accentColor: '#8b5cf6',
            accentGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            accentLight: '#f5f3ff',
            accentBorder: '#c4b5fd',
            roleIcon: '🌟',
            roleTitle: 'Impact Volunteer',
            roleTagline: 'Your time and heart are the greatest gifts.',
            founderMessage: `Welcome to the frontline of change! As a WombTo18 volunteer, you become the bridge between hope and action. You'll lead camps, mentor young minds, and light up communities. Every hour you give ripples into a lifetime of opportunity for a child. I'm personally grateful you chose to stand with us.`,
            dashboardFeatures: [
                { icon: '🏕️', title: 'Impact Camps', desc: 'Join and lead community service camps' },
                { icon: '🪙', title: 'Earn Credits', desc: 'Get rewarded for your volunteer hours' },
                { icon: '📜', title: 'Certificates', desc: 'Download verified impact certificates' },
            ],
        });
        await this.sendEmail(params.email, subject, html, text);
    }
    async sendWelcomePartnerEmail(params) {
        console.log(`[MailerService.sendWelcomePartnerEmail] ENTERED — email: ${params.email} | partner: ${params.partnerId} | contact: ${params.contactPerson} | org: ${params.organizationName}`);
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
        const loginUrl = `${frontendUrl}/login`;
        console.log(`[MailerService.sendWelcomePartnerEmail] loginUrl: ${loginUrl}`);
        const subject = '🤝 Welcome to the WombTo18 Partner Network';
        const text = `Dear ${params.contactPerson} (${params.organizationName}), welcome to WombTo18 Partner Network! Your Partner ID is ${params.partnerId}. Login at ${loginUrl}`;
        const html = this.buildWelcomeEmail({
            userName: params.contactPerson,
            role: 'PARTNER',
            identityId: params.partnerId,
            identityLabel: 'Partner ID',
            loginUrl,
            accentColor: '#0ea5e9',
            accentGradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            accentLight: '#f0f9ff',
            accentBorder: '#7dd3fc',
            roleIcon: '🤝',
            roleTitle: 'Strategic Partner',
            roleTagline: `${params.organizationName} is now part of the mission.`,
            founderMessage: `On behalf of the entire WombTo18 family, welcome aboard! Your partnership amplifies what one person or one donation alone cannot achieve. Together, we're building a scalable model of care — from prenatal support to educational empowerment. Your CSR impact, ESG metrics, and referral network are now live on your dashboard.`,
            dashboardFeatures: [
                { icon: '📈', title: 'Impact Analytics', desc: 'Real-time ESG scores and CSR dashboards' },
                { icon: '🔗', title: 'Referral Network', desc: 'Track and grow your referral impact' },
                { icon: '🏆', title: 'Partner Score', desc: 'Monitor your status: Bronze → Platinum' },
            ],
        });
        console.log(`[MailerService.sendWelcomePartnerEmail] HTML template built — length: ${html.length}. Calling sendEmail...`);
        await this.sendEmail(params.email, subject, html, text);
        console.log(`[MailerService.sendWelcomePartnerEmail] sendEmail completed for ${params.email}`);
    }
    buildWelcomeEmail(params) {
        const featuresHtml = params.dashboardFeatures
            .map((f) => `
        <tr>
          <td style="padding:10px 16px 10px 0;vertical-align:top;width:40px;">
            <div style="width:40px;height:40px;border-radius:12px;background:${params.accentLight};border:1px solid ${params.accentBorder};text-align:center;line-height:40px;font-size:1.2rem;">${f.icon}</div>
          </td>
          <td style="padding:10px 0;vertical-align:top;">
            <p style="margin:0 0 2px;font-weight:800;font-size:0.92rem;color:#0f172a;">${f.title}</p>
            <p style="margin:0;font-size:0.84rem;color:#64748b;line-height:1.4;">${f.desc}</p>
          </td>
        </tr>`)
            .join('');
        return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to WombTo18</title>
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse:collapse;border-spacing:0;margin:0;}
    div, td {padding:0;}
    div {margin:0 !important;}
  </style>
  <noinert>
  <![endif]-->
  <style type="text/css">
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; border:0; height:auto; line-height:100%; outline:none; text-decoration:none; }
    body { margin:0; padding:0; width:100% !important; height:100% !important; background-color:#f1f5f9; }

    /* Mobile */
    @media only screen and (max-width: 620px) {
      .email-container { width:100% !important; padding:12px !important; }
      .card { padding:20px 16px !important; border-radius:16px !important; }
      .hero-title { font-size:1.4rem !important; }
      .id-badge { padding:10px 16px !important; font-size:0.78rem !important; }
      .founder-section { padding:18px 14px !important; }
      .cta-button { padding:14px 28px !important; font-size:0.95rem !important; }
      .feature-table { width:100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Inter','Segoe UI',Roboto,Arial,sans-serif;">
  <!-- Preheader (hidden text for email clients) -->
  <div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Welcome to WombTo18 Foundation, ${params.userName}! Your ${params.identityLabel}: ${params.identityId}
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:24px 12px;">

        <!-- Email container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="email-container" style="max-width:600px;width:100%;margin:0 auto;">
          
          <!-- Logo bar -->
          <tr>
            <td align="center" style="padding:0 0 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:10px 18px;background:rgba(255,255,255,0.9);border-radius:999px;border:1px solid rgba(148,163,184,0.15);box-shadow:0 2px 8px rgba(15,23,42,0.04);">
                    <span style="font-size:1.15rem;font-weight:900;color:${params.accentColor};letter-spacing:-0.02em;">Womb</span><span style="font-size:1.15rem;font-weight:900;color:#0f172a;letter-spacing:-0.02em;">To18</span>
                    <span style="display:inline;color:#94a3b8;font-size:0.7rem;font-weight:600;margin-left:6px;text-transform:uppercase;letter-spacing:0.1em;">Foundation</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="card" style="background:#ffffff;border-radius:24px;padding:36px 32px 28px;border:1px solid rgba(148,163,184,0.12);box-shadow:0 25px 60px rgba(15,23,42,0.08);">
                
                <!-- Role badge -->
                <tr>
                  <td align="center" style="padding:0 0 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:6px 16px;border-radius:999px;background:${params.accentLight};border:1px solid ${params.accentBorder};color:${params.accentColor};font-size:0.78rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">
                          ${params.roleIcon}&nbsp; ${params.roleTitle}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Hero title -->
                <tr>
                  <td align="center" style="padding:0 0 8px;">
                    <h1 class="hero-title" style="margin:0;font-size:1.65rem;font-weight:900;color:#0f172a;line-height:1.25;letter-spacing:-0.02em;">
                      Welcome, ${params.userName}! ${params.roleIcon}
                    </h1>
                  </td>
                </tr>

                <!-- Tagline -->
                <tr>
                  <td align="center" style="padding:0 0 22px;">
                    <p style="margin:0;font-size:0.95rem;color:#64748b;line-height:1.5;font-weight:500;">
                      ${params.roleTagline}
                    </p>
                  </td>
                </tr>

                <!-- ID Badge -->
                <tr>
                  <td align="center" style="padding:0 0 28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td class="id-badge" style="padding:12px 24px;border-radius:14px;background:linear-gradient(135deg,${params.accentLight},rgba(241,245,249,0.8));border:1.5px dashed ${params.accentBorder};">
                          <span style="font-size:0.75rem;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:4px;">Your ${params.identityLabel}</span>
                          <span style="font-size:1.15rem;font-weight:900;color:${params.accentColor};letter-spacing:0.06em;">${params.identityId}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:0 0 24px;">
                    <div style="height:1px;background:linear-gradient(90deg,transparent,${params.accentBorder},transparent);"></div>
                  </td>
                </tr>

                <!-- Founder's message -->
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="founder-section" style="background:linear-gradient(135deg,#fefce8,#fffbeb);border:1px solid #fde68a;border-radius:18px;padding:24px 22px;">
                      <tr>
                        <td>
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding-right:10px;vertical-align:top;">
                                <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);text-align:center;line-height:36px;font-size:1rem;color:#fff;font-weight:900;">✉</div>
                              </td>
                              <td style="vertical-align:top;">
                                <p style="margin:0 0 2px;font-weight:900;font-size:0.88rem;color:#92400e;text-transform:uppercase;letter-spacing:0.06em;">A Message from Our Founder</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:14px;">
                          <p style="margin:0;font-size:0.92rem;color:#78350f;line-height:1.8;font-style:italic;">
                            "${params.founderMessage}"
                          </p>
                          <p style="margin:16px 0 0;font-size:0.84rem;color:#92400e;font-weight:800;">
                            — With gratitude,<br>
                            <span style="font-weight:900;color:#78350f;">The WombTo18 Team</span>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Spacing -->
                <tr><td style="height:28px;"></td></tr>

                <!-- Dashboard features -->
                <tr>
                  <td>
                    <p style="margin:0 0 14px;font-weight:900;font-size:0.88rem;color:#0f172a;text-transform:uppercase;letter-spacing:0.06em;">What's on your Dashboard</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="feature-table">
                      ${featuresHtml}
                    </table>
                  </td>
                </tr>

                <!-- Spacing -->
                <tr><td style="height:28px;"></td></tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding:0 0 10px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border-radius:999px;background:${params.accentGradient};">
                          <a href="${params.loginUrl}" target="_blank" class="cta-button" style="display:inline-block;padding:16px 40px;font-size:1rem;font-weight:800;color:#ffffff;text-decoration:none;border-radius:999px;letter-spacing:0.02em;">
                            Login to Your Dashboard →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Micro-link fallback -->
                <tr>
                  <td align="center" style="padding:4px 0 0;">
                    <p style="margin:0;font-size:0.76rem;color:#94a3b8;">
                      Or copy this link: <a href="${params.loginUrl}" style="color:${params.accentColor};text-decoration:underline;word-break:break-all;">${params.loginUrl}</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0 0;">
              <p style="margin:0 0 4px;font-size:0.78rem;color:#94a3b8;font-weight:600;">WombTo18 Foundation</p>
              <p style="margin:0;font-size:0.72rem;color:#cbd5e1;line-height:1.6;">
                Nurturing every child's journey from womb to 18.<br>
                This is an automated welcome message. Please do not reply.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Email container -->

      </td>
    </tr>
  </table>
</body>
</html>`;
    }
};
exports.MailerService = MailerService;
exports.MailerService = MailerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailerService);
//# sourceMappingURL=mailer.service.js.map