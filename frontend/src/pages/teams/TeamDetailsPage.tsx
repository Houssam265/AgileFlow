import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Button, Paper, Chip, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar,
} from '@mui/material';
import { ArrowBack, Delete, Edit, PersonAdd } from '@mui/icons-material';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { TeamDetail } from '../../types';
import { fetchTeamById, removeTeamMember, updateTeam } from '../../api/teamsApi';
import { formatDateTime } from '../../utils/formatDate';
import AddMemberModal from '../../components/teams/AddMemberModal';

const roleChip = (role: string) => {
  const color = role === 'ROLE_ADMIN' ? 'error' : role === 'ROLE_MANAGER' ? 'warning' : 'info';
  const label = role === 'ROLE_ADMIN' ? 'Admin' : role === 'ROLE_MANAGER' ? 'Manager' : 'Développeur';
  return <Chip label={label} color={color} size="small" />;
};

const TeamDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: current } = useAuth();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const t = await fetchTeamById(Number(id));
      setTeam(t);
      setName(t.name);
      setDescription(t.description ?? '');
    } catch {
      setError('Équipe introuvable.');
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const canManage = useMemo(() => {
    if (!team || !current) return false;
    if (current.role === 'ROLE_ADMIN') return true;
    if (current.role === 'ROLE_MANAGER' && team.manager.id === current.id) return true;
    return false;
  }, [team, current]);

  const memberIds = useMemo(() => {
    if (!team) return new Set<number>();
    return new Set(team.members.map((m) => m.user.id));
  }, [team]);

  const saveEdit = async () => {
    if (!team || !name.trim()) return;
    setSaving(true);
    try {
      await updateTeam(team.id, { name: name.trim(), description: description.trim() || undefined });
      setSnack({ msg: 'Équipe mise à jour.', sev: 'success' });
      setEditOpen(false);
      load();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setSnack({ msg: msg ?? 'Erreur.', sev: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (userId: number) => {
    if (!team || !window.confirm('Retirer ce membre de l’équipe ?')) return;
    try {
      await removeTeamMember(team.id, userId);
      setSnack({ msg: 'Membre retiré.', sev: 'success' });
      load();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setSnack({ msg: msg ?? 'Erreur.', sev: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
    );
  }

  if (error || !team) {
    return <Alert severity="error">{error ?? 'Introuvable.'}</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/teams')} sx={{ mb: 2 }}>
        Retour aux équipes
      </Button>

      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }} elevation={0}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>{team.name}</Typography>
            <Typography color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
              {team.description || 'Aucune description.'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              <strong>Manager :</strong>{' '}
              <Link to={`/users/${team.manager.id}`} style={{ fontWeight: 600 }}>
                {team.manager.firstName} {team.manager.lastName}
              </Link>
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Créée le {formatDateTime(team.createdAt)}
            </Typography>
          </Box>
          {canManage && (
            <Button variant="outlined" startIcon={<Edit />} onClick={() => setEditOpen(true)}>
              Modifier l’équipe
            </Button>
          )}
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Membres</Typography>
        {canManage && (
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setAddMemberOpen(true)}>
            Ajouter un membre
          </Button>
        )}
      </Box>

      {team.members.length === 0 ? (
        <Paper sx={{ p: 3 }} elevation={0}>
          <Typography color="text.secondary">Aucun membre dans cette équipe.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Nom</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rôle</TableCell>
                <TableCell>Rejoint le</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {team.members.map((m) => (
                <TableRow key={m.user.id} hover>
                  <TableCell>
                    <Link to={`/users/${m.user.id}`} style={{ fontWeight: 600, textDecoration: 'none', color: 'inherit' }}>
                      {m.user.firstName} {m.user.lastName}
                    </Link>
                  </TableCell>
                  <TableCell>{m.user.email}</TableCell>
                  <TableCell>{roleChip(m.user.role)}</TableCell>
                  <TableCell>{formatDateTime(m.joinedAt)}</TableCell>
                  <TableCell align="right">
                    {canManage && (
                      <Tooltip title="Retirer">
                        <IconButton size="small" color="error" onClick={() => removeMember(m.user.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={editOpen} onClose={() => !saving && setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier l’équipe</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Nom" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={3} fullWidth />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>Annuler</Button>
          <Button variant="contained" onClick={saveEdit} disabled={saving}>Enregistrer</Button>
        </DialogActions>
      </Dialog>

      <AddMemberModal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        teamId={team.id}
        existingMemberIds={memberIds}
        onNotify={(msg, sev) => setSnack({ msg, sev })}
        onDone={load}
      />

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {snack ? <Alert severity={snack.sev} onClose={() => setSnack(null)} sx={{ width: '100%' }}>{snack.msg}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
};

export default TeamDetailsPage;
