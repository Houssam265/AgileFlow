export type Role = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_DEVELOPER';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}