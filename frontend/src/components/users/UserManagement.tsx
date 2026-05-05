import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
} from '@mui/material';
import { Add, Delete, Edit, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserListItem } from '../../types';
import { deleteUser, fetchUsers } from '../../api/usersApi';
import { formatDateTime } from '../../utils/formatDate';
import AddEditUserModal from './AddEditUserModal';

const roleChip = (role: string) => {
  const color = role === 'ROLE_ADMIN' ? 'error' : role === 'ROLE_MANAGER' ? 'warning' : 'info';
  const label = role === 'ROLE_ADMIN' ? 'Admin' : role === 'ROLE_MANAGER' ? 'Manager' : 'Développeur';
  return <Chip label={label} color={color} size="small" />;
};

export type UserManagementProps = {
  /** When embedded in AdminPage, hide the main "Utilisateurs" page title. */
  variant?: 'full' | 'embedded';
};

const UserManagement = ({ variant = 'full' }: UserManagementProps) => {
  const navigate = useNavigate();
  const { user: current } = useAuth();
  const isAdmin = current?.role === 'ROLE_ADMIN';

  const [rows, setRows] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editTarget, setEditTarget] = useState<UserListItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers();
      setRows(data);
    } catch {
      setError('Impossible de charger les utilisateurs.');
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
    return rows.filter(
      (r) =>
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const openCreate = () => {
    setModalMode('create');
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (u: UserListItem) => {
    setModalMode('edit');
    setEditTarget(u);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId == null) return;
    try {
      await deleteUser(deleteId);
      setSnack({ msg: 'Utilisateur désactivé.', sev: 'success' });
      setDeleteId(null);
      load();
    } catch {
      setSnack({ msg: 'Suppression impossible.', sev: 'error' });
    }
  };

  const title = variant === 'embedded' ? 'Gestion des utilisateurs' : 'Utilisateurs';

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Typography variant={variant === 'embedded' ? 'h6' : 'h5'} fontWeight={700}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Rechercher par nom ou email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
          />
          {isAdmin && (
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
              Nouvel utilisateur
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }} elevation={0}>
          <Typography color="text.secondary">Aucun utilisateur à afficher.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Nom</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rôle</TableCell>
                <TableCell>Créé le</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>{u.firstName} {u.lastName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{roleChip(u.role)}</TableCell>
                  <TableCell>{formatDateTime(u.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Voir le profil">
                      <IconButton size="small" onClick={() => navigate(`/users/${u.id}`)}><Visibility fontSize="small" /></IconButton>
                    </Tooltip>
                    {isAdmin && (
                      <>
                        <Tooltip title="Modifier">
                          <IconButton size="small" onClick={() => openEdit(u)}><Edit fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Désactiver">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteId(u.id)}
                            aria-label={`Désactiver ${u.email}`}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
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

      <AddEditUserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        user={editTarget}
        onSaved={load}
        onNotify={(msg, sev) => setSnack({ msg, sev })}
      />

      <Dialog open={deleteId != null} onClose={() => setDeleteId(null)}>
        <DialogTitle>Désactiver cet utilisateur ?</DialogTitle>
        <DialogContent>
          <DialogContentText>Le compte sera marqué comme inactif (suppression logique).</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Annuler</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Confirmer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {snack ? <Alert severity={snack.sev} onClose={() => setSnack(null)} sx={{ width: '100%' }}>{snack.msg}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
