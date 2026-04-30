import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Typography,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { useAuth } from '../../context/AuthContext';
import { fetchProjects } from '../../api/projectsApi';
import { fetchSprintsByProject, type SprintItem } from '../../api/sprintsApi';
import { fetchUsers } from '../../api/usersApi';
import {
  fetchTasksBySprint,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
} from '../../api/tasksApi';

import type {
  CreateTaskPayload,
  ProjectListItem,
  TaskItem,
  TaskStatut,
  UpdateTaskPayload,
  UserListItem,
} from '../../types';

import KanbanColumn from '../../components/kanban/KanbanColumn';
import TaskCard from '../../components/kanban/TaskCard';
import CreateTaskModal from '../../components/kanban/CreateTaskModal';
import TaskDetailModal from '../../components/kanban/TaskDetailModal';

const COLUMNS: { id: TaskStatut; title: string }[] = [
  { id: 'TODO', title: 'À faire' },
  { id: 'IN_PROGRESS', title: 'En cours' },
  { id: 'REVIEW', title: 'En revue' },
  { id: 'DONE', title: 'Terminé' },
];

const KanbanBoard = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_MANAGER';

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  
  const [sprints, setSprints] = useState<SprintItem[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
  
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const [activeDragTask, setActiveDragTask] = useState<TaskItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadInitialData = useCallback(async () => {
    try {
      const [projData, usersData] = await Promise.all([fetchProjects(), fetchUsers()]);
      setProjects(projData);
      setUsers(usersData);
      setSelectedProjectId(projData[0]?.id || null);
    } catch {
      setError('Impossible de charger les données initiales.');
      setLoading(false);
    }
  }, []);

  const loadSprints = useCallback(async () => {
    if (!selectedProjectId) {
      setSprints([]);
      setSelectedSprintId(null);
      return;
    }
    try {
      const data = await fetchSprintsByProject(selectedProjectId);
      setSprints(data);
      const activeSprint = data.find((s) => s.statut === 'EN_COURS');
      setSelectedSprintId(activeSprint?.id || data[0]?.id || null);
    } catch {
      setError('Impossible de charger les sprints.');
    }
  }, [selectedProjectId]);

  const loadTasks = useCallback(async () => {
    if (!selectedSprintId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasksBySprint(selectedSprintId);
      setTasks(data);
    } catch {
      setError('Impossible de charger les tâches.');
    } finally {
      setLoading(false);
    }
  }, [selectedSprintId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadSprints();
  }, [loadSprints]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => `task-${t.id}` === active.id);
    if (task) setActiveDragTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskIdStr = String(active.id).replace('task-', '');
    const taskId = Number(taskIdStr);
    const task = tasks.find((t) => t.id === taskId);
    
    // over.id is the column id (e.g. 'TODO', 'IN_PROGRESS')
    const newStatut = over.id as TaskStatut;

    if (!task || task.statut === newStatut) return;

    // Optimistic update
    setTasks((current) => current.map((t) => (t.id === taskId ? { ...t, statut: newStatut } : t)));

    try {
      await moveTask(taskId, newStatut);
    } catch (err) {
      setSnack({ msg: 'Erreur lors du déplacement.', sev: 'error' });
      loadTasks(); // Revert on error
    }
  };

  const handleCreateTask = async (payload: CreateTaskPayload) => {
    if (!selectedSprintId) return;
    setSaving(true);
    try {
      await createTask({ ...payload, sprintId: selectedSprintId });
      setSnack({ msg: 'Tâche créée.', sev: 'success' });
      setCreateModalOpen(false);
      loadTasks();
    } catch {
      setSnack({ msg: 'Création impossible.', sev: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTask = async (taskId: number, payload: UpdateTaskPayload) => {
    setSaving(true);
    try {
      await updateTask(taskId, payload);
      setSnack({ msg: 'Tâche mise à jour.', sev: 'success' });
      setDetailModalOpen(false);
      loadTasks();
    } catch {
      setSnack({ msg: 'Mise à jour impossible.', sev: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    setSaving(true);
    try {
      await deleteTask(taskId);
      setSnack({ msg: 'Tâche supprimée.', sev: 'success' });
      setDetailModalOpen(false);
      loadTasks();
    } catch {
      setSnack({ msg: 'Suppression impossible.', sev: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const tasksByColumn = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.statut === col.id);
    return acc;
  }, {} as Record<TaskStatut, TaskItem[]>);

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Kanban</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gérez vos tâches par glisser-déposer.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="kanban-project-label">Projet</InputLabel>
            <Select
              labelId="kanban-project-label"
              label="Projet"
              value={selectedProjectId ?? ''}
              onChange={(e) => setSelectedProjectId(e.target.value === '' ? null : Number(e.target.value))}
            >
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="kanban-sprint-label">Sprint</InputLabel>
            <Select
              labelId="kanban-sprint-label"
              label="Sprint"
              value={selectedSprintId ?? ''}
              onChange={(e) => setSelectedSprintId(e.target.value === '' ? null : Number(e.target.value))}
              disabled={sprints.length === 0}
            >
              {sprints.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.nom}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {canManage && (
            <Button
              variant="contained"
              startIcon={<Add />}
              disabled={!selectedSprintId}
              onClick={() => setCreateModalOpen(true)}
            >
              Nouvelle tâche
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : !selectedSprintId ? (
        <Alert severity="info">Aucun sprint sélectionné.</Alert>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, flexGrow: 1 }}>
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                tasks={tasksByColumn[col.id] || []}
                onTaskClick={(task) => {
                  setSelectedTask(task);
                  setDetailModalOpen(true);
                }}
              />
            ))}
          </Box>
          <DragOverlay>
            {activeDragTask ? <TaskCard task={activeDragTask} onClick={() => {}} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <CreateTaskModal
        open={createModalOpen}
        saving={saving}
        users={users}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateTask}
      />

      <TaskDetailModal
        open={detailModalOpen}
        saving={saving}
        task={selectedTask}
        users={users}
        canManage={canManage}
        projectTeamId={selectedProject?.teamId ?? null}
        onClose={() => setDetailModalOpen(false)}
        onSubmit={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      <Snackbar
        open={snack != null}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        message={snack?.msg}
      />
    </Box>
  );
};

export default KanbanBoard;
