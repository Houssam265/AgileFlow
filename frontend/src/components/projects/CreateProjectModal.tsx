import { useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import type { CreateProjectPayload, ProjectListItem, ProjectStatus, TeamListItem } from '../../types';

const statusOptions: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'ACTIF', label: 'Actif' },
  { value: 'TERMINE', label: 'Termine' },
  { value: 'ARCHIVE', label: 'Archive' },
];

type Props = {
  open: boolean;
  saving: boolean;
  teams: TeamListItem[];
  project?: ProjectListItem | null;
  onClose: () => void;
  onSubmit: (payload: CreateProjectPayload) => Promise<void>;
};

const today = new Date().toISOString().slice(0, 10);

const CreateProjectModal = ({ open, saving, teams, project, onClose, onSubmit }: Props) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('ACTIF');
  const [teamId, setTeamId] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(project?.name ?? '');
    setDescription(project?.description ?? '');
    setStartDate(project?.startDate ?? today);
    setEndDate(project?.endDate ?? '');
    setStatus(project?.status ?? 'ACTIF');
    setTeamId(project?.teamId ?? '');
  }, [open, project]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Le nom du projet est obligatoire.');
      return;
    }
    if (!startDate) {
      setError('La date de debut est obligatoire.');
      return;
    }
    if (endDate && endDate < startDate) {
      setError('La date de fin doit etre posterieure a la date de debut.');
      return;
    }

    setError(null);
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      startDate,
      endDate: endDate || undefined,
      status,
      teamId: teamId || null,
    });
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>{project ? 'Modifier le projet' : 'Nouveau projet'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {!project && (
          <Alert severity="info">
            Vous serez le proprietaire de ce projet et pourrez inviter des membres ensuite.
          </Alert>
        )}
        <TextField label="Nom du projet" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
        <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={3} fullWidth />
        <TextField label="Date de debut" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} required />
        <TextField label="Date de fin" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField select label="Statut" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
          {statusOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Equipe (optionnel)"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value === '' ? '' : Number(e.target.value))}
        >
          <MenuItem value="">Aucune equipe</MenuItem>
          {teams.map((team) => (
            <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {project ? 'Enregistrer' : 'Creer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateProjectModal;
