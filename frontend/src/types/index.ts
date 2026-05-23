export type Role = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_DEVELOPER';
export type ProjectStatus = 'ACTIF' | 'ARCHIVE' | 'TERMINE';
export type StoryPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatut = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriorite = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AnalyticsPeriod = 'WEEK' | 'MONTH' | 'SPRINT';
export type DiagramType =
  | 'FLOWCHART'
  | 'PROCESS'
  | 'DECISION'
  | 'UML'
  | 'BPMN'
  | 'ERD'
  | 'NETWORK'
  | 'MINDMAP'
  | 'USE_CASE'
  | 'CLASS'
  | 'SEQUENCE'
  | 'ACTIVITY'
  | 'COMPONENT'
  | 'DEPLOYMENT'
  | 'CUSTOM';
export type EmailNotificationType = 'SPRINT_START' | 'TASK_ASSIGNED' | 'DEADLINE' | 'MENTION';

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

export interface EmailPreferences {
  userId: number;
  sprintStartEnabled: boolean;
  taskAssignedEnabled: boolean;
  deadlineEnabled: boolean;
  mentionEnabled: boolean;
}

export interface UpdateEmailPreferencesPayload {
  sprintStartEnabled?: boolean;
  taskAssignedEnabled?: boolean;
  deadlineEnabled?: boolean;
  mentionEnabled?: boolean;
}

export interface EmailPreview {
  type: EmailNotificationType;
  subject: string;
  html: string;
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
  teamId?: number | null;
  teamName?: string | null;
  sprintCount: number;
  taskCount: number;
  owner: boolean;
  memberCount: number;
}

export interface ProjectMember {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  owner: boolean;
  joinedAt: string | null;
}

export interface InviteProjectMemberResult {
  mode: 'INVITATION_SENT' | 'DIRECT_ADD' | 'EMAIL_SENT';
  message: string;
  member: ProjectMember | null;
}

export interface ProjectInvitation {
  id: number;
  projectId: number;
  projectName: string;
  inviterId: number;
  inviterFirstName: string;
  inviterLastName: string;
  invitedEmail: string;
  invitedUserId: number | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  expiresAt: string;
  token: string;
}

export interface ProjectInvitationPreview {
  projectName: string;
  ownerName: string;
  invitedEmail: string;
  expired: boolean;
  alreadyAccepted: boolean;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: ProjectStatus;
  teamId?: number | null;
}

export interface UpdateProjectPayload {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: ProjectStatus;
  teamId?: number | null;
}

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

export type EpicStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export interface EpicItem {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  status: EpicStatus;
  color: string;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
  storyCount: number;
  plannedStoryCount: number;
  doneStoryCount: number;
  /** @deprecated use plannedStoryCount */
  completedStoryCount: number;
  totalTaskCount: number;
  completedTaskCount: number;
  totalStoryPoints: number;
  progressPercent: number;
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
  epicId: number | null;
  epicTitle: string | null;
  epicColor: string | null;
  taskCount: number;
  completedTaskCount: number;
  done: boolean;
  createdAt: string | null;
}

export interface BacklogData {
  id: number;
  projectId: number;
  projectName: string;
  epics: EpicItem[];
  stories: UserStoryItem[];
}

export interface CreateUserStoryPayload {
  title: string;
  description?: string;
  priority: StoryPriority;
  storyPoints?: number | null;
  acceptanceCriteria?: string;
  epicId?: number | null;
}

export interface CreateEpicPayload {
  title: string;
  description?: string;
  status?: EpicStatus;
  color?: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateUserStoryPayload extends CreateUserStoryPayload {}

export interface TaskItem {
  id: number;
  titre: string;
  description: string | null;
  statut: TaskStatut;
  priorite: TaskPriorite;
  isUrgent: boolean;
  assignedToId: number | null;
  assignedToName: string | null;
  sprintId: number | null;
  sprintLabel: string | null;
  storyId: number | null;
  dateEcheance: string | null;
  labels: string[];
}

export interface CommentItem {
  id: number;
  contenu: string;
  auteur: UserListItem;
  taskId: number;
  mentions: string[];
  createdAt: string | null;
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

export interface AnalyticsMemberStats {
  userId: number;
  memberName: string;
  role: Role;
  activityCount: number;
  completedTasks: number;
}

export interface ActivityHeatmapItem {
  date: string;
  activityCount: number;
}

export interface AnalyticsTrendItem {
  date: string;
  activityCount: number;
  completedTasks: number;
}

export interface AnalyticsData {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  sprintId: number | null;
  totalActivities: number;
  completedTasks: number;
  activeMembers: number;
  memberStats: AnalyticsMemberStats[];
  heatmap: ActivityHeatmapItem[];
  trend: AnalyticsTrendItem[];
}

export interface BurndownPoint {
  date: string;
  remainingTasks: number;
  idealRemainingTasks: number;
}

export interface VelocityPoint {
  sprintId: number;
  sprintName: string;
  totalTasks: number;
  completedTasks: number;
  completedStoryPoints: number;
  capacityPoints: number;
}

export interface StatsData {
  projectId: number | null;
  sprintId: number | null;
  startDate: string;
  endDate: string;
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
  completedTasks: number;
  completionRate: number;
  activeSprints: number;
  averageVelocity: number;
  burndown: BurndownPoint[];
  velocity: VelocityPoint[];
}

export type ChannelType = 'GLOBAL' | 'PROJECT' | 'PRIVATE';

export interface ChatMessageDTO {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatar: string | null;
  channelType: ChannelType;
  projectId: number | null;
  recipientId: number | null;
  content: string;
  createdAt: string;
}

export interface DiagramData {
  id: number;
  title?: string;
  description?: string | null;
  titre: string;
  type: DiagramType;
  etapes: string[];
  json: string;
  canvasData?: string | null;
  content?: string | null;
  projectId: number;
  projectName: string;
  createdById?: number | null;
  createdByName?: string | null;
  ownerId: number;
  ownerName: string;
  taskId: number | null;
  taskTitle: string | null;
  isShared?: boolean;
  shared: boolean;
  thumbnailUrl?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  nodes?: DiagramNodeDTO[];
  edges?: DiagramEdgeDTO[];
  collaboratorsCount?: number;
}

export interface CreateDiagramPayload {
  title?: string;
  description?: string;
  titre: string;
  type: DiagramType;
  projectId: number;
  taskId?: number | null;
  etapes?: string[];
  json?: string;
  canvasData?: string;
  content?: string;
  thumbnailUrl?: string | null;
  shared: boolean;
  isShared?: boolean;
  nodes?: DiagramNodeDTO[];
  edges?: DiagramEdgeDTO[];
}

export interface UpdateDiagramPayload {
  title?: string;
  description?: string | null;
  titre: string;
  type: DiagramType;
  taskId?: number | null;
  etapes?: string[];
  json?: string;
  canvasData?: string;
  content?: string;
  thumbnailUrl?: string | null;
  shared: boolean;
  isShared?: boolean;
  nodes?: DiagramNodeDTO[];
  edges?: DiagramEdgeDTO[];
}

export interface DiagramNodeDTO {
  id: string;
  diagramId?: number | null;
  type: string;
  positionX: number;
  positionY: number;
  width?: number | null;
  height?: number | null;
  data?: string | null;
  zIndex?: number | null;
  locked?: boolean | null;
}

export interface DiagramEdgeDTO {
  id: string;
  diagramId?: number | null;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  edgeType?: string | null;
  arrowStart?: string | null;
  arrowEnd?: string | null;
  data?: string | null;
}

export interface CollaboratorInfo {
  userId: number;
  username: string;
  email?: string;
  permission?: 'EDIT' | 'COMMENT' | 'VIEW';
  color: string;
  cursorX: number;
  cursorY: number;
  isActive: boolean;
  lastSeen?: number;
}

export interface DiagramUpdateMessage {
  type:
    | 'NODE_ADDED'
    | 'NODE_MOVED'
    | 'NODE_UPDATED'
    | 'NODE_DELETED'
    | 'EDGE_ADDED'
    | 'EDGE_UPDATED'
    | 'EDGE_DELETED'
    | 'CURSOR_MOVE'
    | 'SELECTION_CHANGE'
    | 'DIAGRAM_TITLE'
    | 'FULL_SYNC'
    | 'JOIN'
    | 'LEAVE'
    | 'ELEMENT_LOCK'
    | 'ELEMENT_UNLOCK'
    | 'CONTENT_UPDATE';
  diagramId: number;
  userId: number;
  userName: string;
  userColor: string;
  payload: unknown;
}
