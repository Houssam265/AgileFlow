import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { AccountTree, Refresh } from '@mui/icons-material';
import { createDiagram, deleteDiagram, fetchDiagrams, updateDiagram } from '../../api/diagramsApi';
import { fetchProjects } from '../../api/projectsApi';
import DiagramCanvas from '../../components/diagrams/DiagramCanvas';
import DiagramExport from '../../components/diagrams/DiagramExport';
import DiagramGallery from '../../components/diagrams/DiagramGallery';
import MermaidRenderer from '../../components/diagrams/MermaidRenderer';
import StepInputForm from '../../components/diagrams/StepInputForm';
import type { CreateDiagramPayload, DiagramData, ProjectListItem, UpdateDiagramPayload } from '../../types';

const DiagramFlow = () => {
  const exportRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [diagrams, setDiagrams] = useState<DiagramData[]>([]);
  const [activeDiagram, setActiveDiagram] = useState<DiagramData | null>(null);
  const [draft, setDraft] = useState<CreateDiagramPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setProjects(await fetchProjects());
    } catch {
      setProjects([]);
    }
  }, []);

  const loadDiagrams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchDiagrams(selectedProjectId || undefined);
      setDiagrams(rows);
      setActiveDiagram((current) => {
        if (!current) return rows[0] ?? null;
        return rows.find((diagram) => diagram.id === current.id) ?? rows[0] ?? null;
      });
    } catch {
      setDiagrams([]);
      setActiveDiagram(null);
      setError('Impossible de charger les diagrammes.');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadDiagrams();
  }, [loadDiagrams]);

  const handleNew = () => {
    setActiveDiagram(null);
    setDraft(null);
  };

  const handleSubmit = async (payload: CreateDiagramPayload | UpdateDiagramPayload) => {
    setSaving(true);
    try {
      let saved: DiagramData;
      if (activeDiagram) {
        const { projectId: _projectId, ...updatePayload } = payload as CreateDiagramPayload;
        saved = await updateDiagram(activeDiagram.id, updatePayload);
      } else {
        saved = await createDiagram(payload as CreateDiagramPayload);
        setSelectedProjectId(saved.projectId);
      }
      setActiveDiagram(saved);
      setSnack('Diagramme enregistre.');
      await loadDiagrams();
    } catch {
      setSnack('Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (diagram: DiagramData) => {
    if (!window.confirm(`Supprimer "${diagram.titre}" ?`)) return;
    setSaving(true);
    try {
      await deleteDiagram(diagram.id);
      if (activeDiagram?.id === diagram.id) {
        setActiveDiagram(null);
      }
      setSnack('Diagramme supprime.');
      await loadDiagrams();
    } catch {
      setSnack('Suppression impossible.');
    } finally {
      setSaving(false);
    }
  };

  const preview = draft ?? activeDiagram;
  const previewSteps = preview?.etapes ?? [];
  const previewJson = preview?.json;
  const previewTitle = preview?.titre ?? 'DiagramFlow';

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <AccountTree color="primary" />
          <Typography variant="h5" fontWeight={800}>DiagramFlow</Typography>
        </Stack>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Button startIcon={<Refresh />} onClick={loadDiagrams} disabled={loading}>Actualiser</Button>
          <DiagramExport targetRef={exportRef} filename={previewTitle.replace(/\s+/g, '-').toLowerCase()} disabled={!preview || previewSteps.length === 0} />
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
              <FormControl size="small" fullWidth>
                <InputLabel id="diagram-gallery-project-label">Projet</InputLabel>
                <Select
                  labelId="diagram-gallery-project-label"
                  label="Projet"
                  value={selectedProjectId}
                  onChange={(event) => {
                    setSelectedProjectId(event.target.value as number | '');
                    setActiveDiagram(null);
                    setDraft(null);
                  }}
                >
                  <MenuItem value="">Tous les projets</MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>

            <StepInputForm
              projects={projects}
              initialDiagram={activeDiagram}
              defaultProjectId={selectedProjectId}
              saving={saving}
              onSubmit={handleSubmit}
              onDraftChange={setDraft}
              onNew={handleNew}
            />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : (
              <DiagramGallery diagrams={diagrams} selectedId={activeDiagram?.id} onSelect={setActiveDiagram} onDelete={handleDelete} />
            )}
          </Stack>
        </Grid>

        <Grid item xs={12} lg={8}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {preview && previewSteps.length > 0 ? (
            <Stack spacing={2} ref={exportRef}>
              <DiagramCanvas title={previewTitle} steps={previewSteps} json={previewJson} />
              <MermaidRenderer steps={previewSteps} json={previewJson} />
            </Stack>
          ) : (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
              <Typography variant="body2" color="text.secondary">Aucun apercu.</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      <Snackbar open={snack != null} autoHideDuration={3500} onClose={() => setSnack(null)} message={snack} />
    </Box>
  );
};

export default DiagramFlow;
