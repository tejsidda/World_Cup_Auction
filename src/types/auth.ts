export type Profile = {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
};

export type AuthUserState = {
  userId: string;
  email: string;
};
