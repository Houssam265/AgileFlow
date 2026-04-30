import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import type { CreateProjectPayload, ProjectListItem, ProjectStatus, TeamListItem, UserListItem } from '../../types';

const statusOptions: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'ACTIF', label: 'Actif' },
  { value: 'TERMINE', label: 'Termine' },
  { value: 'ARCHIVE', label: 'Archive' },
];

type Props = {
  open: boolean;
  saving: boolean;
  users: UserListItem[];
  teams: TeamListItem[];
  currentUserId?: number;
  currentUserRole?: string;
  project?: ProjectListItem | null;
  onClose: () => void;
  onSubmit: (payload: CreateProjectPayload) => Promise<void>;
};

const today = new Date().toISOString().slice(0, 10);

const CreateProjectModal = ({ open, saving, users, teams, currentUserId, currentUserRole, project, onClose, onSubmit }: Props) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('ACTIF');
  const [managerId, setManagerId] = useState<number>(0);
  const [teamId, setTeamId] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  const managerOptions = useMemo(
    () => users.filter((user) => user.role === 'ROLE_ADMIN' || user.role === 'ROLE_MANAGER'),
    [users],
  );

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(project?.name ?? '');
    setDescription(project?.description ?? '');
    setStartDate(project?.startDate ?? today);
    setEndDate(project?.endDate ?? '');
    setStatus(project?.status ?? 'ACTIF');
    setTeamId(project?.teamId ?? '');
    if (project?.managerId) {
      setManagerId(project.managerId);
      return;
    }
    if (currentUserRole === 'ROLE_MANAGER' && currentUserId) {
      setManagerId(currentUserId);
      return;
    }
    setManagerId(managerOptions[0]?.id ?? 0);
  }, [open, project, currentUserId, currentUserRole, managerOptions]);

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
    if (!managerId) {
      setError('Choisissez un manager.');
      return;
    }

    setError(null);
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      startDate,
      endDate: endDate || undefined,
      status,
      managerId,
      teamId: teamId || null,
    });
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>{project ? 'Modifier le projet' : 'Nouveau projet'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Nom du projet" value={name} onChange={(event) => setName(event.target.value)} fullWidth required />
        <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} multiline minRows={3} fullWidth />
        <TextField label="Date de debut" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} InputLabelProps={{ shrink: true }} required />
        <TextField label="Date de fin" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField select label="Statut" value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)}>
          {statusOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Manager"
          value={managerId || ''}
          onChange={(event) => setManagerId(Number(event.target.value))}
          disabled={currentUserRole === 'ROLE_MANAGER'}
        >
          {managerOptions.map((user) => (
            <MenuItem key={user.id} value={user.id}>
              {user.firstName} {user.lastName} ({user.role.replace('ROLE_', '')})
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Equipe"
          value={teamId}
          onChange={(event) => setTeamId(event.target.value === '' ? '' : Number(event.target.value))}
        >
          <MenuItem value="">Aucune equipe</MenuItem>
          {teams.map((team) => (
            <MenuItem key={team.id} value={team.id}>
              {team.name}
            </MenuItem>
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
