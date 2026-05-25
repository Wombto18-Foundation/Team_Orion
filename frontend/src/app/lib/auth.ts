import { authApi, LoginResponse, RegisterResponse } from "./api/auth";

export interface DonorSession {
  identifier: string;
  eligible: boolean;
  token: string;
  tier?: string;
  name?: string;
  mobile?: string;
  donorId?: string;
  volunteerId?: string;
  partnerId?: string;
  organizationName?: string;
  role: 'DONOR' | 'VOLUNTEER' | 'PARTNER' | 'ADMIN' | 'SUPER_ADMIN' | 'STATE_ADMIN';
  adminState?: string | null;
  profileCompleted?: boolean;
}

const SESSION_KEY = "donor_session";

export const auth = {
  async adminLogin(email: string, password: string): Promise<LoginResponse> {
    const res = await authApi.adminLogin(email, password);
    if (res.token) {
      const role = 'ADMIN';
      const session: DonorSession = {
        identifier: email,
        eligible: true,
        token: res.token,
        name: res.name || 'Super Admin',
        role: role as any,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    return res;
  },

  async login(identifier: string, password: string): Promise<LoginResponse> {
    const res = await authApi.login(identifier, password);
    if (res.devOtp) sessionStorage.setItem("dev_otp", res.devOtp);
    if (res.devMobileOtp) sessionStorage.setItem("dev_mobile_otp", res.devMobileOtp);
    return res;
  },

  async register(data: {
    email: string;
    password: string;
    name: string;
    mobile?: string;
    isVolunteer?: boolean;
    isNonDonor?: boolean;
    referredById?: string;
  }): Promise<RegisterResponse> {
    const res = await authApi.register(data);
    if (res.devOtp) sessionStorage.setItem("dev_otp", res.devOtp);
    if (res.devMobileOtp) sessionStorage.setItem("dev_mobile_otp", res.devMobileOtp);
    return res;
  },

  async verifyOtp(identifier: string, otp: string): Promise<{ success: boolean; token?: string; name?: string; donorId?: string; volunteerId?: string; role?: string; profileCompleted?: boolean }> {
    const response = await authApi.verifyOtp(identifier, otp);
    if (response.success && response.token) {
      const role = response.role || 'DONOR';
      const session: DonorSession = {
        identifier,
        eligible: response.eligible ?? true,
        token: response.token,
        name: response.name,
        mobile: (response as any).mobile,
        donorId: response.donorId,
        volunteerId: response.volunteerId,
        tier: (response as any).tier,
        partnerId: response.partnerId,
        profileCompleted: response.profileCompleted,
        role: role as any,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { success: true, token: response.token, name: response.name, donorId: response.donorId, volunteerId: response.volunteerId, role };
    }
    return { success: false };
  },

  async verifyDualOtp(identifier: string, emailOtp: string, mobileOtp?: string): Promise<{ success: boolean; token?: string; name?: string; donorId?: string; volunteerId?: string; role?: string; profileCompleted?: boolean }> {
    const response = await authApi.verifyDualOtp(identifier, emailOtp, mobileOtp);
    if (response.success && response.token) {
      const role = response.role || 'DONOR';
      const session: DonorSession = {
        identifier,
        eligible: response.eligible ?? true,
        token: response.token,
        name: response.name,
        mobile: (response as any).mobile,
        donorId: response.donorId,
        volunteerId: response.volunteerId,
        tier: (response as any).tier,
        partnerId: response.partnerId,
        profileCompleted: response.profileCompleted,
        role: role as any,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { success: true, token: response.token, name: response.name, donorId: response.donorId, volunteerId: response.volunteerId, role };
    }
    return { success: false };
  },

  async resendOtp(identifier: string): Promise<{ success: boolean; devOtp?: string; devMobileOtp?: string }> {
    const response = await authApi.resendOtp(identifier);
    if (response.devOtp) {
      sessionStorage.setItem("dev_otp", response.devOtp);
    }
    if (response.devMobileOtp) {
      sessionStorage.setItem("dev_mobile_otp", response.devMobileOtp);
    }
    return response;
  },

  /** Save volunteer session after upgrade */
  saveVolunteerSession(data: { identifier: string; volunteerId?: string; name: string; mobile?: string; donorId: string; profileCompleted?: boolean }) {
    const existing = auth.getSession();
    const session: DonorSession = {
      identifier: data.identifier,
      name: data.name,
      mobile: data.mobile,
      donorId: data.donorId,
      volunteerId: data.volunteerId,
      role: 'VOLUNTEER',
      token: existing?.token || '',
      eligible: existing?.eligible ?? true,
      tier: existing?.tier,
      profileCompleted: data.profileCompleted ?? false,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  /** Save partner session */
  savePartnerSession(data: { email: string; partnerId: string; name: string; organizationName: string }) {
    const session: DonorSession = {
      identifier: data.email,
      eligible: true,
      token: `partner-${Date.now()}`,
      name: data.name,
      partnerId: data.partnerId,
      organizationName: data.organizationName,
      role: 'PARTNER',
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  setReceiptOnlySession(identifier: string) {
    const session: DonorSession = {
      identifier,
      eligible: false,
      token: `mock-receipt-token-${Date.now()}`,
      role: 'DONOR',
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  forgotPassword(email: string, type: 'DONOR' | 'PARTNER' | 'VOLUNTEER') {
    return authApi.forgotPassword(email, type);
  },

  resetPassword(data: { email: string; token: string; type: string; newPassword: string }) {
    return authApi.resetPassword(data);
  },

  getSession(): DonorSession | null {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;
    try {
      return JSON.parse(sessionStr) as DonorSession;
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("dev_otp");
    sessionStorage.removeItem("dev_mobile_otp");
  },
};
