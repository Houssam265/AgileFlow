import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, CircularProgress, Alert, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, MenuItem,
} from '@mui/material';
import { Add, Delete, Edit, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { TeamListItem, UserListItem } from '../../types';
import { createTeam, deleteTeam, fetchTeams, updateTeam } from '../../api/teamsApi';
import { fetchUsers } from '../../api/usersApi';
import { formatDate } from '../../utils/formatDate';

const TeamsPage = () => {
  const navigate = useNavigate();
  const { user: current } = useAuth();
  const canManage = current?.role === 'ROLE_ADMIN' || current?.role === 'ROLE_MANAGER';

  const canEditTeam = (t: TeamListItem) =>
    current?.role === 'ROLE_ADMIN' || (current?.role === 'ROLE_MANAGER' && current.id === t.managerId);

  const [rows, setRows] = useState<TeamListItem[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<TeamListItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [managerId, setManagerId] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const managerCandidates = useMemo(
    () => users.filter((u) => u.role === 'ROLE_ADMIN' || u.role === 'ROLE_MANAGER'),
    [users],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, u] = await Promise.all([fetchTeams(), fetchUsers()]);
      setRows(t);
      setUsers(u.filter((x) => x.active !== false));
    } catch {
      setError('Impossible de charger les équipes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q));
  }, [rows, search]);

  const openCreate = () => {
    setEditTeam(null);
    setName('');
    setDescription('');
    setManagerId(managerCandidates[0]?.id ?? 0);
    setDialogOpen(true);
  };

  const openEdit = (t: TeamListItem) => {
    setEditTeam(t);
    setName(t.name);
    setDescription(t.description ?? '');
    setManagerId(t.managerId);
    setDialogOpen(true);
  };

  const saveTeam = async () => {
    if (!name.trim()) {
      setSnack({ msg: 'Le nom est obligatoire.', sev: 'error' });
      return;
    }
    setSaving(true);
    try {
      if (editTeam) {
        await updateTeam(editTeam.id, { name: name.trim(), description: description.trim() || undefined });
        setSnack({ msg: 'Équipe mise à jour.', sev: 'success' });
      } else {
        if (!managerId) {
          setSnack({ msg: 'Choisissez un manager.', sev: 'error' });
          setSaving(false);
          return;
        }
        await createTeam({ name: name.trim(), description: description.trim() || undefined, managerId });
        setSnack({ msg: 'Équipe créée.', sev: 'success' });
      }
      setDialogOpen(false);
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

  const handleDelete = async (t: TeamListItem) => {
    if (!window.confirm(`Supprimer l’équipe « ${t.name} » ?`)) return;
    try {
      await deleteTeam(t.id);
      setSnack({ msg: 'Équipe supprimée.', sev: 'success' });
      load();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setSnack({ msg: msg ?? 'Suppression impossible.', sev: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Équipes</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Rechercher par nom…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
          />
          {canManage && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openCreate}
              disabled={managerCandidates.length === 0}
              title={managerCandidates.length === 0 ? 'Aucun utilisateur ADMIN ou MANAGER disponible comme manager' : ''}
            >
              Nouvelle équipe
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }} elevation={0}>
          <Typography color="text.secondary">Aucune équipe.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Nom</TableCell>
                <TableCell sx={{ maxWidth: 280 }}>Description</TableCell>
                <TableCell>Manager</TableCell>
                <TableCell align="center">Membres</TableCell>
                <TableCell>Créée le</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/teams/${t.id}`)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>{t.name}</TableCell>
                  <TableCell
                    sx={{ maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    title={t.description ?? ''}
                  >
                    {t.description || '—'}
                  </TableCell>
                  <TableCell>{t.managerName}</TableCell>
                  <TableCell align="center">{t.memberCount}</TableCell>
                  <TableCell>{formatDate(t.createdAt)}</TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Voir">
                      <IconButton size="small" onClick={() => navigate(`/teams/${t.id}`)}><Visibility fontSize="small" /></IconButton>
                    </Tooltip>
                    {canEditTeam(t) && (
                      <>
                        <Tooltip title="Modifier">
                          <IconButton size="small" onClick={() => openEdit(t)}><Edit fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton size="small" color="error" onClick={() => handleDelete(t)}><Delete fontSize="small" /></IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTeam ? 'Modifier l’équipe' : 'Nouvelle équipe'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Nom" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={2} fullWidth />
          {!editTeam && (
            <>
              {managerCandidates.length === 0 ? (
                <Alert severity="warning">Aucun utilisateur avec le rôle ADMIN ou MANAGER n’est disponible pour être manager.</Alert>
              ) : (
                <TextField select label="Manager" value={managerId || ''} onChange={(e) => setManagerId(Number(e.target.value))} fullWidth required>
                  {managerCandidates.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} — {u.role.replace('ROLE_', '')} ({u.email})
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Annuler</Button>
          <Button
            variant="contained"
            onClick={saveTeam}
            disabled={saving || (!editTeam && managerCandidates.length === 0)}
          >
            {editTeam ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {snack ? <Alert severity={snack.sev} onClose={() => setSnack(null)} sx={{ width: '100%' }}>{snack.msg}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
};

export default TeamsPage;
