export type SessionStatus = 'lobby' | 'live' | 'ended';

export type SessionMember = {
  userId: string;
  displayName: string;
  slot: number;
};

export type SessionTeam = {
  id: string;
  name: string;
  createdBy: string | null;
  members: SessionMember[];
  full: boolean;
};

export type SessionState = {
  status: SessionStatus;
  startedAt: string | null;
  teams: SessionTeam[];
  myTeamId: string | null;
};
