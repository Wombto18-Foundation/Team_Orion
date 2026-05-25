export interface OrganizerSession {
  name: string;
  email: string;
  campId: string;
  hasChangedPassword: boolean;
  firstLogin: boolean;
  accessExpiresAt: string;
}

const KEY = 'organizer_session';

export const organizerSession = {
  save(data: OrganizerSession) {
    localStorage.setItem(KEY, JSON.stringify(data));
  },

  get(): OrganizerSession | null {
    try {
      const s = localStorage.getItem(KEY);
      return s ? (JSON.parse(s) as OrganizerSession) : null;
    } catch {
      return null;
    }
  },

  update(partial: Partial<OrganizerSession>) {
    const current = organizerSession.get();
    if (current) organizerSession.save({ ...current, ...partial });
  },

  clear() {
    localStorage.removeItem(KEY);
  },

  daysLeft(session: OrganizerSession): number {
    return Math.ceil((new Date(session.accessExpiresAt).getTime() - Date.now()) / 86_400_000);
  },

  isExpired(session: OrganizerSession): boolean {
    return new Date() > new Date(session.accessExpiresAt);
  },
};
