export type Role = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_DEVELOPER';
export type ProjectStatus = 'ACTIF' | 'ARCHIVE' | 'TERMINE';

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

/** Liste utilisateurs (GET /users) */
export interface UserListItem {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string | null;
  active: boolean | null;
  lastLogin: string | null;
}

export interface TeamMembership {
  teamId: number;
  teamName: string;
}

/** Détail utilisateur (GET /users/:id) */
export interface UserDetail extends UserListItem {
  teams: TeamMembership[];
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  password: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: Role;
  active?: boolean;
  /** Nouveau mot de passe (optionnel, admin uniquement côté UI) */
  password?: string;
}

/** Liste équipes */
export interface TeamListItem {
  id: number;
  name: string;
  description: string | null;
  managerId: number;
  managerName: string;
  memberCount: number;
  createdAt: string | null;
}

export interface TeamMemberRow {
  user: UserListItem;
  joinedAt: string | null;
}

export interface TeamDetail {
  id: number;
  name: string;
  description: string | null;
  createdAt: string | null;
  manager: UserListItem;
  members: TeamMemberRow[];
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  managerId: number;
}

export interface UpdateTeamPayload {
  name: string;
  description?: string;
}

export interface ProjectListItem {
  id: number;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
  managerId: number | null;
  managerName: string | null;
  sprintCount: number;
  taskCount: number;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: ProjectStatus;
  managerId: number;
}

export interface UpdateProjectPayload extends CreateProjectPayload {}

export interface DashboardStats {
  role: Role;
  totalUsers: number;
  activeUsers: number;
  totalTeams: number;
  managedTeams: number;
  totalProjects: number;
  managedProjects: number;
  activeProjects: number;
  activeSprints: number;
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
}
