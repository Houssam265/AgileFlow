export type Role = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_DEVELOPER';
export type ProjectStatus = 'ACTIF' | 'ARCHIVE' | 'TERMINE';
export type StoryPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatut = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriorite = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

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

export interface UserStoryItem {
  id: number;
  title: string;
  description: string | null;
  priority: StoryPriority;
  storyPoints: number | null;
  acceptanceCriteria: string | null;
  backlogId: number;
  projectId: number;
  sprintId: number | null;
  sprintLabel: string | null;
  createdAt: string | null;
}

export interface BacklogData {
  id: number;
  projectId: number;
  projectName: string;
  stories: UserStoryItem[];
}

export interface CreateUserStoryPayload {
  title: string;
  description?: string;
  priority: StoryPriority;
  storyPoints?: number | null;
  acceptanceCriteria?: string;
}

export interface UpdateUserStoryPayload extends CreateUserStoryPayload {}

export interface TaskItem {
  id: number;
  titre: string;
  description: string | null;
  statut: TaskStatut;
  priorite: TaskPriorite;
  assignedToId: number | null;
  assignedToName: string | null;
  sprintId: number | null;
  sprintLabel: string | null;
  storyId: number | null;
  dateEcheance: string | null;
  labels: string[];
}

export interface CreateTaskPayload {
  titre: string;
  description?: string;
  priorite: TaskPriorite;
  assignedToId?: number | null;
  sprintId?: number | null;
  storyId?: number | null;
  dateEcheance?: string | null;
  labels?: string[];
}

export interface UpdateTaskPayload {
  titre: string;
  description?: string;
  priorite?: TaskPriorite;
  assignedToId?: number | null;
  dateEcheance?: string | null;
  labels?: string[];
}
