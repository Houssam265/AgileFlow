import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Add, Delete, Save } from '@mui/icons-material';
import type { CreateDiagramPayload, DiagramData, DiagramType, ProjectListItem, TaskItem, UpdateDiagramPayload } from '../../types';
import { cleanDiagramSteps, stringifyDiagramJson } from '../../utils/diagramGeneration';
import { fetchTasksByProject } from '../../api/tasksApi';

const DIAGRAM_TYPES: Array<{ value: DiagramType; label: string }> = [
  { value: 'FLOWCHART', label: 'Flowchart' },
  { value: 'PROCESS', label: 'Process' },
  { value: 'DECISION', label: 'Decision' },
  { value: 'CUSTOM', label: 'Custom' },
];

interface StepInputFormProps {
  projects: ProjectListItem[];
  initialDiagram?: DiagramData | null;
  defaultProjectId?: number | '';
  saving?: boolean;
  onSubmit: (payload: CreateDiagramPayload | UpdateDiagramPayload) => void;
  onDraftChange?: (payload: CreateDiagramPayload) => void;
  onNew?: () => void;
}

const StepInputForm = ({ projects, initialDiagram, defaultProjectId = '', saving = false, onSubmit, onDraftChange, onNew }: StepInputFormProps) => {
  const [titre, setTitre] = useState('');
  const [type, setType] = useState<DiagramType>('FLOWCHART');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [taskId, setTaskId] = useState<number | '' | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [shared, setShared] = useState(false);
  const [steps, setSteps] = useState<string[]>(['']);

  const loadTasks = useMemo(() => async (projId: number) => {
    setTasksLoading(true);
    try {
      setTasks(await fetchTasksByProject(projId));
    } catch {
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialDiagram) {
      setTitre(initialDiagram.titre);
      setType(initialDiagram.type);
      setProjectId(initialDiagram.projectId);
      setTaskId(initialDiagram.taskId);
      setShared(initialDiagram.shared);
      setSteps(initialDiagram.etapes.length ? initialDiagram.etapes : ['']);
      if (initialDiagram.projectId) {
        loadTasks(initialDiagram.projectId);
      }
      return;
    }
    setTitre('');
    setType('FLOWCHART');
    setProjectId(defaultProjectId || projects[0]?.id || '');
    setTaskId(null);
    setShared(false);
    setSteps(['']);
  }, [defaultProjectId, initialDiagram, projects, loadTasks]);

  useEffect(() => {
    if (projectId && typeof projectId === 'number') {
      loadTasks(projectId);
      setTaskId(null);
    } else {
      setTasks([]);
      setTaskId(null);
    }
  }, [projectId, loadTasks]);

  const cleanSteps = useMemo(() => cleanDiagramSteps(steps), [steps]);
  const canSubmit = titre.trim().length > 0 && Boolean(projectId) && cleanSteps.length > 0;

  useEffect(() => {
    if (!projectId) return;
    onDraftChange?.({
      titre: titre.trim() || 'Diagramme',
      type,
      projectId: Number(projectId),
      taskId: taskId && typeof taskId === 'number' ? taskId : null,
      etapes: cleanSteps,
      json: stringifyDiagramJson(titre || 'Diagramme', type, cleanSteps),
      shared,
    });
  }, [cleanSteps, onDraftChange, projectId, shared, taskId, titre, type]);

  const updateStep = (index: number, value: string) => {
    setSteps((current) => current.map((step, stepIndex) => (stepIndex === index ? value : step)));
  };

  const removeStep = (index: number) => {
    setSteps((current) => current.length === 1 ? [''] : current.filter((_, stepIndex) => stepIndex !== index));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      titre: titre.trim(),
      type,
      projectId: Number(projectId),
      taskId: taskId && typeof taskId === 'number' ? taskId : null,
      etapes: cleanSteps,
      json: stringifyDiagramJson(titre, type, cleanSteps),
      shared,
    });
  };

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
      <Stack spacing={2}>
        <TextField
          label="Titre"
          value={titre}
          onChange={(event) => setTitre(event.target.value)}
          size="small"
          required
        />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <FormControl size="small" fullWidth>
            <InputLabel id="diagram-project-label">Projet</InputLabel>
            <Select
              labelId="diagram-project-label"
              label="Projet"
              value={projectId}
              disabled={Boolean(initialDiagram)}
              onChange={(event) => setProjectId(event.target.value as number | '')}
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel id="diagram-type-label">Type</InputLabel>
            <Select
              labelId="diagram-type-label"
              label="Type"
              value={type}
              onChange={(event) => setType(event.target.value as DiagramType)}
            >
              {DIAGRAM_TYPES.map((item) => (
                <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        <FormControl size="small" fullWidth disabled={!projectId}>
          <InputLabel id="diagram-task-label">Tâche associée</InputLabel>
          <Select
            labelId="diagram-task-label"
            label="Tâche associée"
            value={taskId ?? ''}
            onChange={(event) => setTaskId(event.target.value as number | '' | null)}
          >
            <MenuItem value="">Aucune</MenuItem>
            {tasksLoading ? (
              <MenuItem disabled>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Chargement...
              </MenuItem>
            ) : (
              tasks.map((task) => (
                <MenuItem key={task.id} value={task.id}>{task.titre}</MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <Stack spacing={1}>
          {steps.map((step, index) => (
            <Stack direction="row" spacing={1} alignItems="center" key={`${index}-${steps.length}`}>
              <TextField
                label={`Etape ${index + 1}`}
                value={step}
                onChange={(event) => updateStep(index, event.target.value)}
                size="small"
                fullWidth
              />
              <Tooltip title="Retirer">
                <IconButton onClick={() => removeStep(index)} size="small">
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
          <Button startIcon={<Add />} onClick={() => setSteps((current) => [...current, ''])} variant="outlined">
            Ajouter
          </Button>
        </Stack>

        <FormControlLabel
          control={<Checkbox checked={shared} onChange={(event) => setShared(event.target.checked)} />}
          label="Partager"
        />

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {onNew && (
            <Button onClick={onNew} disabled={saving}>
              Nouveau
            </Button>
          )}
          <Button startIcon={<Save />} variant="contained" onClick={handleSubmit} disabled={!canSubmit || saving}>
            Enregistrer
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default StepInputForm;
