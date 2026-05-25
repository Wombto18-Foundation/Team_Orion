import { createBrowserRouter } from "react-router";
import { PublicLayout } from "./components/layout/PublicLayout";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { PartnerLayout } from "./components/layout/PartnerLayout";
import { VolunteerDashboardLayout } from "./components/layout/VolunteerDashboardLayout";
import { OrganizerLayout } from "./components/layout/OrganizerLayout";

// Public Pages
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { ServicesPage } from "./pages/ServicesPage";
import { BlogPage } from "./pages/BlogPage";
import { PressPage } from "./pages/PressPage";
import { ImpactPage } from "./pages/ImpactPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { TransparencyPage } from "./pages/TransparencyPage";
import { VerifyCertificatePage } from "./pages/VerifyCertificatePage";
import { GetInvolvedPage } from "./pages/GetInvolvedPage";
import { CompliancePage } from "./pages/CompliancePage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsOfUsePage } from "./pages/TermsOfUsePage";
import { DonatePage } from "./pages/DonatePage";
import { DonationSuccessPage } from "./pages/DonationSuccessPage";
import WallOfFamePage from "./pages/donate/WallOfFamePage";
import { RequestCampPage } from "./pages/RequestCampPage";

// Other
import { DashboardPreviewPage } from "./pages/DashboardPreviewPage";
import { LoginSelectionPage } from "./pages/LoginSelectionPage";
import { VolunteerOnboardingPage } from "./pages/VolunteerOnboardingPage";
import { VolunteerBenefitsPage } from "./pages/VolunteerBenefitsPage";
import { VolunteerSuccessPage } from "./pages/VolunteerSuccessPage";
import { AdvisoryBoardApplicationPage } from "./pages/AdvisoryBoardApplicationPage";
import { AdvisoryBoardApplyPage } from "./pages/AdvisoryBoardApplyPage";
import { EmailVerificationPage } from "./pages/EmailVerificationPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";

// Login & Auth
import { DonorLogin } from "./pages/donor/DonorLogin";
import { DonorVerifyOtp } from "./pages/donor/DonorVerifyOtp";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { PartnerLogin } from "./pages/partner/PartnerLogin";
import { VolunteerLogin } from "./pages/volunteer/VolunteerLogin";
import { VolunteerScan } from "./pages/volunteer/VolunteerScan";

// Donor Dashboard
import { DonorDashboard } from "./pages/donor/DonorDashboard";
import { DonorDonations } from "./pages/donor/DonorDonations";
import { DonorReports } from "./pages/donor/DonorReports";
import { DonorCertificates } from "./pages/donor/DonorCertificates";
import { DonorEvents } from "./pages/donor/DonorEvents";
import { DonorProfile } from "./pages/donor/DonorProfile";
import { DonorStats } from "./pages/donor/DonorStats";
import { DonorLeaderboard } from "./pages/donor/DonorLeaderboard";

// Volunteer Dashboard
import { VolunteerDashboardHome } from "./pages/volunteer/VolunteerDashboardHome";
import { VolunteerCoins } from "./pages/volunteer/VolunteerCoins";
import { VolunteerReferrals } from "./pages/volunteer/VolunteerReferrals";
import { VolunteerCamps } from "./pages/volunteer/VolunteerCamps";
import { VolunteerLeaderboard } from "./pages/volunteer/VolunteerLeaderboard";
import { VolunteerCertificates } from "./pages/volunteer/VolunteerCertificates";
import { VolunteerStats } from "./pages/volunteer/VolunteerStats";
import { VolunteerProfile } from "./pages/volunteer/VolunteerProfile";
import { VolunteerCommissions } from "./pages/volunteer/VolunteerCommissions";

// Partner Dashboard
import { PartnerDashboard } from "./pages/partner/PartnerDashboard";
import { PartnerReferrals } from "./pages/partner/PartnerReferrals";
import { PartnerCertificates } from "./pages/partner/PartnerCertificates";
import { PartnerStats } from "./pages/partner/PartnerStats";
import { PartnerSignup } from "./pages/partner/PartnerSignup";
import { PartnerProfile } from "./pages/partner/PartnerProfile";

// Organizer
import { OrganizerLogin } from "./pages/organizer/OrganizerLogin";
import { OrganizerSetPassword } from "./pages/organizer/OrganizerSetPassword";
import { OrganizerExpired } from "./pages/organizer/OrganizerExpired";
import { OrganizerDashboard } from "./pages/organizer/OrganizerDashboard";
import { OrganizerVolunteers } from "./pages/organizer/OrganizerVolunteers";
import { OrganizerAttendance } from "./pages/organizer/OrganizerAttendance";

// Admin Dashboard
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminDonors } from "./pages/admin/AdminDonors";
import { AdminVolunteers } from "./pages/admin/AdminVolunteers";
import { AdminPrograms } from "./pages/admin/AdminPrograms";
import { AdminReports } from "./pages/admin/AdminReports";
import { AdminBlog } from "./pages/admin/AdminBlog";
import { AdminCaseStudies } from "./pages/admin/AdminCaseStudies";
import { AdminCamps } from "./pages/admin/AdminCamps";
import { AdminCampCreate } from "./pages/admin/AdminCampCreate";
import { AdminCampDetail } from "./pages/admin/AdminCampDetail";
import { AdminLedger } from "./pages/admin/AdminLedger";
import { AdminSubAdmins } from "./pages/admin/AdminSubAdmins";
import { AdminWithdrawals } from "./pages/admin/AdminWithdrawals";
import { AdminCampRequests } from "./pages/admin/AdminCampRequests";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: PublicLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "about", Component: AboutPage },
      { path: "services", Component: ServicesPage },
      { path: "blog", Component: BlogPage },
      { path: "press", Component: PressPage },
      { path: "impact", Component: ImpactPage },
      { path: "transparency", Component: TransparencyPage },
      { path: "verify", Component: VerifyCertificatePage },
      { path: "get-involved", Component: GetInvolvedPage },
      { path: "compliance", Component: CompliancePage },
      { path: "privacy-policy", Component: PrivacyPolicyPage },
      { path: "terms-of-use", Component: TermsOfUsePage },
      { path: "coming-soon", Component: ComingSoonPage },
      { path: "donate", Component: DonatePage },
      { path: "donation-success", Component: DonationSuccessPage },
      { path: "wall-of-fame", Component: WallOfFamePage },
      { path: "request-camp", Component: RequestCampPage },
      { path: "volunteer-onboarding", Component: VolunteerOnboardingPage },
      { path: "volunteer-policy", Component: VolunteerBenefitsPage },
      { path: "volunteer-success", Component: VolunteerSuccessPage },
      { path: "dashboard-preview", Component: DashboardPreviewPage },
      { path: "advisory-board", Component: AdvisoryBoardApplicationPage },
      { path: "advisory-board/apply", Component: AdvisoryBoardApplyPage },
      { path: "verify-email", Component: EmailVerificationPage },
      { path: "forgot-password", Component: ForgotPasswordPage },
      { path: "reset-password", Component: ResetPasswordPage },
      { path: "donor/login", Component: DonorLogin },
      { path: "donor/verify-otp", Component: DonorVerifyOtp },
      { path: "volunteer/login", Component: VolunteerLogin },
      { path: "scan", Component: VolunteerScan },
    ],
  },
  {
    path: "/login",
    Component: LoginSelectionPage,
  },
  {
    path: "/admin/login",
    Component: AdminLoginPage,
  },
  {
    path: "/partner/login",
    Component: PartnerLogin,
  },
  {
    path: "/partner/signup",
    Component: PartnerSignup,
  },
  {
    path: "/donor/:id",
    Component: DashboardLayout,
    children: [
      { path: "dashboard", Component: DonorDashboard },
      { path: "donations", Component: DonorDonations },
      { path: "reports", Component: DonorReports },
      { path: "certificates", Component: DonorCertificates },
      { path: "events", Component: DonorEvents },
      { path: "profile", Component: DonorProfile },
      { path: "stats", Component: DonorStats },
      { path: "leaderboard", Component: DonorLeaderboard },
      { index: true, Component: DonorDashboard },
    ],
  },
  {
    path: "/volunteer/:id",
    Component: VolunteerDashboardLayout,
    children: [
      { path: "dashboard", Component: VolunteerDashboardHome },
      { path: "coins", Component: VolunteerCoins },
      { path: "referrals", Component: VolunteerReferrals },
      { path: "camps", Component: VolunteerCamps },
      { path: "leaderboard", Component: VolunteerLeaderboard },
      { path: "certificates", Component: VolunteerCertificates },
      { path: "commissions", Component: VolunteerCommissions },
      { path: "stats", Component: VolunteerStats },
      { path: "profile", Component: VolunteerProfile },
      { index: true, Component: VolunteerDashboardHome },
    ],
  },
  {
    path: "/partner/:id",
    Component: PartnerLayout,
    children: [
      { path: "dashboard", Component: PartnerDashboard },
      { path: "referrals", Component: PartnerReferrals },
      { path: "certificates", Component: PartnerCertificates },
      { path: "stats", Component: PartnerStats },
      { path: "profile", Component: PartnerProfile },
      { index: true, Component: PartnerDashboard },
    ],
  },
  // Organizer standalone pages (no layout guard)
  { path: "/organizer/login", Component: OrganizerLogin },
  { path: "/organizer/set-password", Component: OrganizerSetPassword },
  { path: "/organizer/expired", Component: OrganizerExpired },

  // Organizer protected pages (layout handles auth)
  {
    path: "/organizer",
    Component: OrganizerLayout,
    children: [
      { index: true, Component: OrganizerDashboard },
      { path: "dashboard", Component: OrganizerDashboard },
      { path: "volunteers", Component: OrganizerVolunteers },
      { path: "attendance", Component: OrganizerAttendance },
    ],
  },

  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "dashboard", Component: AdminDashboard },
      { path: "donors", Component: AdminDonors },
      { path: "volunteers", Component: AdminVolunteers },
      { path: "sub-admins", Component: AdminSubAdmins },
      { path: "withdrawals", Component: AdminWithdrawals },
      { path: "camp-requests", Component: AdminCampRequests },
      { path: "programs", Component: AdminPrograms },
      { path: "reports", Component: AdminReports },
      { path: "blog", Component: AdminBlog },
      { path: "case-studies", Component: AdminCaseStudies },
      { path: "camps", Component: AdminCamps },
      { path: "camps/create", Component: AdminCampCreate },
      { path: "camps/:id", Component: AdminCampDetail },
      { path: "ledger", Component: AdminLedger },
    ],
  },
]);