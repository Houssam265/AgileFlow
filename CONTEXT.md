# AgileFlow — Project Context

> **Purpose of this file:** Give any AI assistant (or new developer) a complete, accurate picture of the project so no time is wasted on discovery.  
> Last updated: 2026-05-23

---

## 1. What Is AgileFlow?

AgileFlow is a **full-stack Agile project-management platform** — a Jira-like tool built as a university semester project (S2). It lets teams manage projects, sprints, tasks, user stories, diagrams, chat, and analytics in a real-time collaborative environment.

The project is written **entirely in French** (entity field names, comments, UI labels), though the code structure and API paths are in English.

---

## 2. High-Level Architecture

```
AgileFlow/
├── backend/          # Spring Boot 3.3.5 REST + WebSocket API
├── frontend/         # React 18 + TypeScript SPA (Vite)
├── docs/postman/     # Postman collection (API docs)
├── README.md
└── CONTEXT.md        ← you are here
```

The two apps run independently and communicate over HTTP (REST) and WebSocket (STOMP over SockJS).

| Layer      | URL (dev)               |
|------------|-------------------------|
| Backend    | http://localhost:8080   |
| Frontend   | http://localhost:5173   |
| Swagger UI | http://localhost:8080/swagger-ui/index.html |

---

## 3. Tech Stack

### Backend
| Technology | Version | Role |
|---|---|---|
| Java | 21 | Language |
| Spring Boot | 3.3.5 | Framework |
| Spring Security | (Boot-managed) | Auth & authorization |
| Spring Data JPA | (Boot-managed) | ORM / persistence |
| Spring WebSocket (STOMP) | (Boot-managed) | Real-time messaging |
| Spring Mail | (Boot-managed) | Email notifications |
| MySQL | 8.0+ | Primary database |
| Flyway | 10.10.0 | DB migrations (disabled in dev — Hibernate `ddl-auto=update` used instead) |
| JWT (jjwt) | 0.12.3 | Stateless authentication |
| Lombok | 1.18.42 | Boilerplate reduction |
| MapStruct | 1.5.5.Final | DTO/entity mapping |
| iText PDF | 7.2.5 | PDF report generation |
| SpringDoc OpenAPI | 2.3.0 | Swagger UI |
| OAuth2 Client | (Boot-managed) | Google & GitHub social login |
| H2 | (test scope) | In-memory DB for tests |

### Frontend
| Technology | Version | Role |
|---|---|---|
| React | 18.2 | UI framework |
| TypeScript | 5.2 | Type safety |
| Vite | 4.5 | Build tool / dev server |
| React Router | v6.20 | Client-side routing |
| Material-UI (MUI) | v5.15 | Component library |
| Zustand | 4.4 | Global state management |
| Axios | 1.6 | HTTP client |
| @stomp/stompjs + sockjs-client | 7.0 / 1.6 | WebSocket (STOMP) |
| ReactFlow | 11.11 | Diagram canvas editor |
| Mermaid | 11.14 | Diagram rendering |
| Recharts | 2.12 | Analytics charts |
| dnd-kit | 6.3 / 10.0 | Drag-and-drop (Kanban) |
| date-fns | 4.1 | Date utilities |
| html-to-image | 1.11 | Diagram thumbnail capture |
| Vitest + Testing Library | 2.1 / 16.0 | Unit testing |

---

## 4. Database

- **Engine:** MySQL 8.0+
- **Database name:** `agileflow_db`
- **Connection:** `jdbc:mysql://localhost:3306/agileflow_db` (root / no password by default)
- **Schema management:** Flyway migrations exist (`V9` → `V19`) but are **disabled** (`spring.flyway.enabled=false`). Hibernate `ddl-auto=update` is active instead during development.

### Key Tables / Entities

| Entity | Table | Description |
|---|---|---|
| `User` | `users` | Platform users; fields: `nom`, `prenom`, `email`, `password`, `role`, `actif`, `emailVerified`, `dateCreation`, `dateDerniereConnexion` |
| `Project` | `projects` | Projects with status (`ACTIF`, `ARCHIVE`, `TERMINE`), manager, team, sprints, backlog |
| `Team` | `teams` | Groups of users managed by a manager |
| `TeamMember` | `team_members` | Join table User ↔ Team with `joinedAt` |
| `Sprint` | `sprints` | Sprints linked to a project |
| `Backlog` | `backlogs` | One backlog per project |
| `UserStory` | `user_stories` | Stories with priority (`LOW/MEDIUM/HIGH/CRITICAL`), story points, acceptance criteria |
| `Task` | `tasks` | Tasks with `statut` (`TODO/IN_PROGRESS/REVIEW/DONE`), `priorite`, `isUrgent`, `dateEcheance`, labels, assignment, sprint, story |
| `Comment` | `comments` | Task comments with `@mention` support |
| `CommentMention` | `comment_mentions` | Tracks @mentions in comments |
| `Notification` | `notifications` | In-app notifications per user |
| `ActivityLog` | `activity_logs` | Audit trail of all actions |
| `ChatMessage` | `chat_messages` | Chat messages (GLOBAL / PROJECT / PRIVATE channels) |
| `ChatPresence` | `chat_presence` | Tracks online/offline status per user |
| `Diagram` | `diagrams` | Diagrams linked to project and optionally a task |
| `DiagramNode` | `diagram_nodes` | Individual nodes on a diagram canvas |
| `DiagramEdge` | `diagram_edges` | Edges/connections between nodes |
| `DiagramCollaborator` | `diagram_collaborators` | Per-diagram permission (EDIT/COMMENT/VIEW) |
| `UserEmailPreferences` | `user_email_preferences` | Per-user email notification opt-in/opt-out |

---

## 5. Authentication & Authorization

### Mechanisms
1. **JWT (primary):** Access token (15 min) + Refresh token (7 days). Tokens sent as `Authorization: Bearer <token>`. Stored in `localStorage` on the frontend.
2. **OAuth2 Social Login (optional):** Google and GitHub. Enabled only when the provider env vars are set. On success, backend redirects to `/oauth2/redirect` with tokens in query params.
3. **Email verification OTP:** On registration, a one-time code is sent to the user's email. The user must verify before the account is active.
4. **Inactivity timeout:** Frontend auto-logs out after 15 minutes of inactivity.

### Roles
| Role | Capabilities |
|---|---|
| `ROLE_ADMIN` | Platform governance: admin dashboard, users, analytics/reports, activity logs, announcements |
| `ROLE_MANAGER` | Manage projects, teams, sprints, assign tasks |
| `ROLE_DEVELOPER` | Access assigned tasks, backlog, kanban, chat, diagrams |

### Security Config Notes
- CSRF disabled (stateless JWT).
- Session policy: `IF_REQUIRED` (needed for OAuth2 flow).
- Public endpoints: `/api/auth/**`, `/oauth2/**`, `/login/oauth2/**`, `/ws/**`, `/swagger-ui/**`, `/v3/api-docs/**`.
- All other endpoints require authentication.
- CORS allowed origins: `localhost:5173`, `localhost:5174`, `127.0.0.1:5174`, `localhost:3000`.
- WebSocket connections authenticated via JWT in the STOMP `CONNECT` frame `Authorization` header.

---

## 6. Backend Package Structure

```
com.agileflow/
├── AgileflowBackendApplication.java   # Entry point
├── config/
│   ├── CorsConfig.java
│   ├── DataInitializer.java           # Seed data for test profiles
│   └── WebSocketConfig.java           # STOMP broker + JWT interceptor
├── controller/                        # 18 REST controllers
│   ├── AuthController.java            # /api/auth/**
│   ├── AdminController.java           # /api/admin/**
│   ├── AnalyticsController.java       # /api/analytics
│   ├── BacklogController.java         # /api/backlog/**
│   ├── ChatController.java            # WebSocket: /app/chat/send, /app/chat/presence
│   ├── ChatRestController.java        # /api/chat/**
│   ├── CommentController.java         # /api/tasks/{id}/comments/**
│   ├── DashboardController.java       # /api/dashboard
│   ├── DiagramController.java         # /api/diagrams/**
│   ├── EmailPreferencesController.java# /api/email-preferences/**
│   ├── NotificationController.java    # /api/notifications/**
│   ├── ProjectController.java         # /api/projects/**
│   ├── SprintController.java          # /api/sprints/**
│   ├── StatsController.java           # /api/stats (+ PDF/CSV export)
│   ├── TaskController.java            # /api/tasks/**
│   ├── TeamController.java            # /api/teams/**
│   ├── UserController.java            # /api/users/**
│   └── UserStoryController.java       # /api/user-stories/**
├── dto/                               # 51 DTOs (records/classes)
├── entity/                            # 19 JPA entities
├── exception/                         # Custom exceptions (ResourceNotFoundException, etc.)
├── repository/                        # 19 Spring Data JPA repositories
├── scheduler/
│   ├── DeadlineScheduler.java         # @Scheduled every 1h
│   └── PriorityUpdater.java           # Marks tasks urgent, sends 24h/1h reminders
├── security/
│   ├── JwtFilter.java
│   ├── JwtUtil.java
│   ├── OAuth2LoginSuccessHandler.java
│   ├── SecurityConfig.java
│   └── UserDetailsServiceImpl.java
├── service/                           # 27 service classes
│   ├── AuthService.java               # Register, login, OAuth, token refresh, email OTP
│   ├── DiagramService.java            # 34KB — largest service; handles full diagram CRUD + real-time persistence
│   ├── TaskService.java               # Task CRUD, assignment, move (Kanban)
│   ├── EmailTemplateService.java      # HTML email templates
│   ├── EmailNotificationService.java  # Sends emails for deadlines, assignments, mentions
│   ├── AnalyticsService.java          # Member stats, heatmap, trends + PDF export
│   ├── StatsService.java              # Burndown, velocity, completion rates
│   ├── ChatService.java               # Save/fetch messages, presence tracking
│   ├── NotificationService.java       # In-app notification CRUD
│   ├── CommentService.java            # Comments + @mention notifications
│   ├── ProjectService.java
│   ├── SprintService.java
│   ├── TeamService.java
│   ├── UserStoryService.java
│   ├── UserService.java
│   ├── AdminService.java
│   ├── DashboardService.java
│   ├── PdfReportService.java          # iText PDF stats reports
│   ├── CsvExportService.java
│   └── ...
├── validation/                        # Custom bean validation annotations
└── websocket/
    ├── DiagramWebSocketController.java # /app/diagram/{id} — collaborative editing
    ├── KanbanWebSocket.java            # /app/kanban — real-time Kanban updates
    └── WebSocketEventListener.java    # Session connect/disconnect
```

---

## 7. WebSocket Architecture

The app uses **STOMP over SockJS** at endpoint `/ws`.

### Broker config
- Application prefix: `/app`
- Broker topics: `/topic`, `/queue`
- User destination prefix: `/user`

### Key channels

| Direction | Destination | Purpose |
|---|---|---|
| Client → Server | `/app/chat/send` | Send a chat message |
| Client → Server | `/app/chat/presence` | Update online/offline status |
| Server → Client | `/topic/chat/global` | Global chat messages |
| Server → Client | `/topic/chat/project/{id}` | Project-scoped chat |
| Server → Client | `/topic/chat/private/{userId}` | Private messages |
| Server → Client | `/topic/chat/presence` | Online user list broadcast |
| Client → Server | `/app/diagram/{id}` | Collaborative diagram update |
| Client → Server | `/app/diagram/{id}/join` | Join diagram session |
| Client → Server | `/app/diagram/{id}/leave` | Leave diagram session |
| Server → Client | `/topic/diagram/{id}` | Broadcast diagram changes |
| Server → Client | `/topic/diagram/{id}/presence` | Collaborator join/leave |
| Client → Server | `/app/kanban` | Kanban card move |
| Server → Client | `/topic/kanban/{projectId}` | Kanban board update |

### Diagram Update Event Types
`NODE_ADDED`, `NODE_MOVED`, `NODE_UPDATED`, `NODE_DELETED`, `EDGE_ADDED`, `EDGE_UPDATED`, `EDGE_DELETED`, `CURSOR_MOVE`, `SELECTION_CHANGE`, `DIAGRAM_TITLE`, `FULL_SYNC`, `JOIN`, `LEAVE`, `ELEMENT_LOCK`, `ELEMENT_UNLOCK`, `CONTENT_UPDATE`

> **Note:** Transient events (`CURSOR_MOVE`, `SELECTION_CHANGE`, `JOIN`, `LEAVE`) are **not persisted** to the DB. All structural changes are persisted via `DiagramService.persistRealtimeUpdate()`.

---

## 8. Frontend Structure

```
frontend/src/
├── App.tsx                   # Root — inactivity timer (15 min) + AppRouter
├── main.tsx                  # ReactDOM bootstrap, AuthContext, MUI ThemeProvider
├── api/                      # 16 Axios API modules (one per domain)
│   ├── axiosInstance.ts      # Base Axios + request interceptor (attach JWT) + 401/refresh interceptor
│   ├── axiosInterceptor.ts
│   ├── adminApi.ts
│   ├── analyticsApi.ts
│   ├── backlogApi.ts
│   ├── chatApi.ts
│   ├── dashboardApi.ts
│   ├── diagramsApi.ts
│   ├── emailPreferencesApi.ts
│   ├── notificationsApi.ts
│   ├── projectsApi.ts
│   ├── sprintsApi.ts
│   ├── statsApi.ts
│   ├── tasksApi.ts
│   ├── teamsApi.ts
│   └── usersApi.ts
├── components/               # Reusable UI components organized by domain
│   ├── ProtectedRoute.tsx
│   ├── WebSocketStatus.tsx
│   ├── layout/               # AppLayout (sidebar + topbar)
│   ├── chat/
│   ├── kanban/
│   ├── backlog/
│   ├── sprints/
│   ├── teams/
│   ├── users/
│   ├── projects/
│   ├── diagram/
│   ├── diagrams/
│   ├── analytics/
│   ├── stats/
│   ├── notifications/
│   └── dashboard/
├── context/
│   └── AuthContext.tsx       # React context wrapping authStore for token/user
├── data/                     # Static mock/seed data
├── hooks/                    # Custom React hooks
├── pages/                    # Page-level components (route targets)
│   ├── DashboardPage.tsx
│   ├── DiagramFlow/          # DiagramListPage + DiagramEditorPage (lazy-loaded)
│   ├── admin/AdminPage.tsx, ActivityLogsPage.tsx
│   ├── analytics/AnalyticsDashboard.tsx (lazy)
│   ├── auth/LoginPage, RegisterPage, OAuthRedirectPage
│   ├── backlog/BacklogPage.tsx
│   ├── diagrams/
│   ├── kanban/KanbanBoard.tsx
│   ├── notifications/NotifCenter.tsx
│   ├── projects/ProjectsListPage.tsx
│   ├── settings/SettingsPage.tsx
│   ├── sprints/SprintsPage.tsx
│   ├── stats/StatsPage.tsx (lazy)
│   ├── teams/TeamsPage, TeamDetailsPage
│   └── users/UsersListPage, UserProfilePage
├── routes/AppRouter.tsx      # React Router v6 route definitions
├── store/
│   ├── authStore.ts          # Zustand store (token, refreshToken, user, setAuth, logout)
│   ├── useAuthStore.ts
│   └── diagramStore.ts       # Zustand store for diagram editor state
├── types/index.ts            # All TypeScript interfaces & types (458 lines)
├── utils/                    # Utility functions
└── test/                     # Vitest unit tests
```

### Routing Table

| Path | Component | Auth Required | Role Restriction |
|---|---|---|---|
| `/login` | LoginPage | No | — |
| `/register` | RegisterPage | No | — |
| `/oauth2/redirect` | OAuthRedirectPage | No | — |
| `/dashboard` | DashboardPage | Yes | — |
| `/analytics` | AnalyticsDashboard | Yes | — |
| `/stats` | StatsPage | Yes | — |
| `/diagrams` | DiagramListPage | Yes | — |
| `/diagrams/:id` | DiagramEditorPage | Yes | — |
| `/projects` | ProjectsListPage | Yes | — |
| `/users` | UsersListPage | Yes | — |
| `/users/:id` | UserProfilePage | Yes | — |
| `/teams` | TeamsPage | Yes | — |
| `/teams/:id` | TeamDetailsPage | Yes | — |
| `/sprints` | SprintsPage | Yes | — |
| `/backlog` | BacklogPage | Yes | — |
| `/kanban` | KanbanBoard | Yes | — |
| `/settings` | SettingsPage | Yes | — |
| `/admin` | AdminPage | Yes | ROLE_ADMIN |
| `/activity-logs` | ActivityLogsPage | Yes | ROLE_ADMIN |
| `/notifications` | NotifCenter | Yes | — |
| `*` | → /dashboard | — | — |

`AnalyticsDashboard`, `StatsPage`, `DiagramListPage`, `DiagramEditorPage` are **lazy-loaded**.

---

## 9. Key Features & How They Work

### 9.1 Kanban Board
- Drag-and-drop with `dnd-kit`.
- Task status columns: `TODO → IN_PROGRESS → REVIEW → DONE`.
- Real-time updates broadcast over WebSocket (`/topic/kanban/{projectId}`).
- `KanbanWebSocket.java` on backend handles the STOMP messages.

### 9.2 Collaborative Diagram Editor
- Canvas built with **ReactFlow** (nodes, edges, handles).
- Diagram types: FLOWCHART, PROCESS, DECISION, UML, BPMN, ERD, NETWORK, MINDMAP, USE_CASE, CLASS, SEQUENCE, ACTIVITY, COMPONENT, DEPLOYMENT, CUSTOM.
- Multiple collaborators can edit simultaneously; cursor positions broadcast in real-time.
- Per-user permissions: `EDIT`, `COMMENT`, `VIEW`.
- Thumbnails captured with `html-to-image`.
- Backend stores full canvas state (`canvas_data` LONGTEXT) + normalized `diagram_nodes` and `diagram_edges` tables.
- Export endpoint: `GET /api/diagrams/{id}/export/{format}`.

### 9.3 Chat System
- Three channel types: **GLOBAL** (all users), **PROJECT** (per project), **PRIVATE** (1-to-1).
- WebSocket for real-time delivery, REST (`/api/chat/messages`) for pagination/history.
- Online presence tracking via `ChatPresence` entity + `/topic/chat/presence`.

### 9.4 Task Priority & Deadline System
- `DeadlineScheduler` runs every **1 hour** (fixedRate = 3 600 000 ms).
- `PriorityUpdater` auto-marks tasks within 24h of deadline as `isUrgent = true`.
- Email reminders: 24h before deadline and 1h before deadline (sent once, tracked by flags `deadline24hReminderSent`, `deadline1hReminderSent`).

### 9.5 Email Notifications
- Sent via Gmail SMTP (port 587, STARTTLS).
- Configurable per-user: Sprint Start, Task Assigned, Deadline, Mention.
- HTML templates via `EmailTemplateService`.
- Preview endpoint: `GET /api/email-preferences/me/preview?type={TYPE}`.

### 9.6 Analytics & Stats
- **Analytics** (`/api/analytics`): admin dashboard showing KPI cards (activities, completed tasks, active members), member contribution bar chart, and daily trend line chart. Filterable by period (WEEK / MONTH / SPRINT). PDF export supported (iText).
- **Stats** (`/api/stats`): burndown chart, velocity chart, completion rate, task distribution. Filterable by project and sprint. Supports PDF and CSV export.
- Analytics dashboard displays metrics in a clean grid layout: 3 KPI cards (desktop: 3 cols, tablet: 2 cols, mobile: 1 col), followed by two side-by-side charts (6 cols each on desktop, stacked on mobile).

### 9.7 In-App Notifications
- Created on events (task assignment, sprint start, @mention, deadline).
- Paginated at `/api/notifications`.
- Mark single or all as read. Delete individual notifications.
- For `ROLE_ADMIN`, `/notifications` is an announcements composer instead of a personal inbox.
- Admin announcements can target all users, members of a specific project, or one specific user. Project and user targets are searchable in the UI.

### 9.8 Comments & @Mentions
- Comments on tasks support `@username` syntax.
- `MentionParser` extracts mentioned users.
- `MentionNotificationService` creates in-app notifications and sends emails to mentioned users.

### 9.9 Activity Log
- All significant actions (task created/updated, sprint started, etc.) are recorded in `activity_logs`.
- Used by Analytics service for trend data and activity trends.
- Admins can browse `/activity-logs` with search, project/user/action filters, grouping by date/project/user, and collapsible activity groups.

---

## 10. REST API Summary

Base URL: `http://localhost:8080/api`

| Endpoint group | Controller | Notable endpoints |
|---|---|---|
| `/auth` | AuthController | POST /register, POST /verify-email, POST /login, POST /refresh, POST /logout, GET /check-email |
| `/users` | UserController | GET /, GET /:id, POST /, PUT /:id, DELETE /:id |
| `/teams` | TeamController | Full CRUD + member management |
| `/projects` | ProjectController | Full CRUD |
| `/sprints` | SprintController | Full CRUD + start/complete sprint |
| `/backlog` | BacklogController | GET by project, manage stories |
| `/user-stories` | UserStoryController | Full CRUD + assign to sprint |
| `/tasks` | TaskController | Full CRUD + assign + move (Kanban) |
| `/tasks/{id}/comments` | CommentController | CRUD comments with @mention |
| `/kanban` | (WebSocket only) | — |
| `/analytics` | AnalyticsController | GET (period filter) + GET /export.pdf |
| `/stats` | StatsController | GET (project/sprint filter) + export.pdf + export.csv |
| `/diagrams` | DiagramController | Full CRUD + collaborators + content update + export |
| `/chat` | ChatRestController | GET /messages (paginated), GET /presence |
| `/notifications` | NotificationController | GET (paginated), PUT /:id/read, PUT /read-all, DELETE /:id |
| `/email-preferences` | EmailPreferencesController | GET /me, PUT /me, GET /me/preview |
| `/dashboard` | DashboardController | GET (role-aware stats) |
| `/admin` | AdminController | GET /dashboard, GET /activity-logs (filterable), POST /announcements |

---

## 11. Environment & Configuration

### Backend (`application.properties`)
```properties
server.port=8080
spring.datasource.url=jdbc:mysql://localhost:3306/agileflow_db
spring.datasource.username=root
spring.datasource.password=           # empty by default
spring.jpa.hibernate.ddl-auto=update
spring.flyway.enabled=false
jwt.secret=${JWT_SECRET:change-me-in-local-env}
jwt.expiration=900000                  # 15 min (ms)
jwt.refresh-expiration=604800000       # 7 days (ms)
app.frontend-url=http://localhost:5173
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME:}
spring.mail.password=${MAIL_PASSWORD:}
```

OAuth2 providers are configured via environment variables:
- `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID`
- `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET`
- `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GITHUB_CLIENT_ID`
- `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GITHUB_CLIENT_SECRET`

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws
```

---

## 12. Development Setup

### Prerequisites
- Java 21
- Node.js 18+ & npm
- MySQL 8.0+
- Maven (wrapper `./mvnw` included)

### Running the backend
```powershell
cd backend
./mvnw spring-boot:run
```

### Running the frontend
```powershell
cd frontend
npm install        # first time only
cp .env.example .env
npm run dev
```

### Seeding test data (Windows)
```powershell
cd backend/src/main/resources
./seed-data.bat
```
**Warning:** This wipes all existing data and re-creates test data.

### Test accounts (password: `Password@2024`)
| Role | Email |
|---|---|
| Admin | admin@agileflow.com |
| Manager | manager@agileflow.com |
| Developer | alice@agileflow.com |
| Developer | bob@agileflow.com |

---

## 13. Testing

### Backend
- Framework: Spring Boot Test + Spring Security Test
- Test DB: H2 (in-memory)
- Run: `./mvnw test`

### Frontend
- Framework: Vitest + React Testing Library + jsdom
- Test files: `*.test.tsx` (e.g. `DashboardPage.test.tsx`)
- Run: `npm run test` (single pass) or `npm run test -- --watch`

---

## 14. Known Patterns & Conventions

1. **French field names in entities:** `nom`, `prenom`, `titre`, `statut`, `priorite`, `dateEcheance`, `actif`, `dateCreation`. DTO field names generally use English (or French aliases mapped by service layer).
2. **Flyway disabled:** Schema is fully managed by Hibernate `ddl-auto=update`. Flyway migration files exist in `db/migration/` (V9–V19) but are NOT run on startup. They serve as documentation of schema evolution.
3. **Dual field redundancy in `Diagram`:** `title`/`titre`, `shared`/`isShared`, `canvasData`/`json`, `owner`/`createdBy` — all kept in sync by `syncCompatibilityFields()` to support iterative refactoring without breaking existing data.
4. **Token storage:** JWT stored in `localStorage`. Axios interceptor auto-refreshes on 401.
5. **No Redux:** State managed with Zustand (`authStore`, `diagramStore`).
6. **Role-based UI:** Frontend uses `user.role` from the JWT payload to conditionally render admin routes and UI elements.
7. **CORS:** Hard-coded to specific localhost origins — change `SecurityConfig.corsConfigurationSource()` for deployment.
8. **Notification service dual-channel:** Every important event creates both an in-app `Notification` entity AND can trigger an email (if the user's email preferences allow it).
9. **Admin navigation:** Admins use a trimmed governance nav only: Dashboard (`/admin`), Users, Analytics / Reports, Activity Logs, Notifications. Admin login/register/OAuth redirects go to `/admin`.

---

## 15. Areas of Active Development / Known TODOs

- Flyway is disabled — the project may need a proper migration strategy before production.
- OAuth2 is optional and only activates when provider env vars are present (graceful degradation).
- `DataInitializer.java` is a large (10 KB) seed class — likely still being extended as new features are added.
- The diagram editor (`DiagramService.java`, 34 KB) is the most complex service and the most recently added feature (V18/V19 migrations).
- No CI/CD pipeline configured.
- Production deployment has not been addressed (no Docker, no cloud config).
