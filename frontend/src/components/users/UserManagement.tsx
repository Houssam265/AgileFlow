import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add, Delete, Edit, Search, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserListItem } from '../../types';
import { deleteUser, fetchUsers } from '../../api/usersApi';
import { formatDateTime } from '../../utils/formatDate';
import AddEditUserModal from './AddEditUserModal';

const roleChip = (role: string) => {
  const color = role === 'ROLE_ADMIN' ? 'error' : role === 'ROLE_MANAGER' ? 'warning' : 'info';
  const label = role === 'ROLE_ADMIN' ? 'Admin' : role === 'ROLE_MANAGER' ? 'Manager' : 'Developpeur';
  return <Chip label={label} color={color} size="small" />;
};

const statusChip = (active: boolean | null) => (
  <Chip
    label={active === false ? 'Inactif' : 'Actif'}
    color={active === false ? 'default' : 'success'}
    variant={active === false ? 'outlined' : 'filled'}
    size="small"
  />
);

export type UserManagementProps = {
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
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
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
    const result = rows.filter((r) => {
      const matchesSearch = !q
        || `${r.firstName} ${r.lastName}`.toLowerCase().includes(q)
        || r.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'ALL' || r.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL'
        || (statusFilter === 'ACTIVE' && r.active !== false)
        || (statusFilter === 'INACTIVE' && r.active === false);
      return matchesSearch && matchesRole && matchesStatus;
    });

    return [...result].sort((a, b) => {
      if (sortBy === 'NAME') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      if (sortBy === 'ROLE') return a.role.localeCompare(b.role);
      if (sortBy === 'LAST_LOGIN') return (b.lastLogin ?? '').localeCompare(a.lastLogin ?? '');
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
    });
  }, [rows, search, roleFilter, statusFilter, sortBy]);

  const counts = useMemo(() => ({
    total: rows.length,
    active: rows.filter((u) => u.active !== false).length,
    admins: rows.filter((u) => u.role === 'ROLE_ADMIN').length,
    managers: rows.filter((u) => u.role === 'ROLE_MANAGER').length,
    developers: rows.filter((u) => u.role === 'ROLE_DEVELOPER').length,
  }), [rows]);

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
      setSnack({ msg: 'Utilisateur desactive.', sev: 'success' });
      setDeleteId(null);
      load();
    } catch {
      setSnack({ msg: 'Suppression impossible.', sev: 'error' });
    }
  };

  const title = variant === 'embedded' ? 'Gestion des utilisateurs' : 'Utilisateurs';

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <Typography variant={variant === 'embedded' ? 'h6' : 'h5'} fontWeight={700}>
          {title}
        </Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Nouvel utilisateur
          </Button>
        )}
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems={{ xs: 'stretch', md: 'center' }}>
        <TextField
          size="small"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { md: 280 }, flex: 1 }}
          InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="role-filter-label">Role</InputLabel>
          <Select labelId="role-filter-label" label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <MenuItem value="ALL">Tous les roles</MenuItem>
            <MenuItem value="ROLE_ADMIN">Admins</MenuItem>
            <MenuItem value="ROLE_MANAGER">Managers</MenuItem>
            <MenuItem value="ROLE_DEVELOPER">Developpeurs</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="status-filter-label">Statut</InputLabel>
          <Select labelId="status-filter-label" label="Statut" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="ALL">Tous</MenuItem>
            <MenuItem value="ACTIVE">Actifs</MenuItem>
            <MenuItem value="INACTIVE">Inactifs</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel id="sort-filter-label">Tri</InputLabel>
          <Select labelId="sort-filter-label" label="Tri" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <MenuItem value="NEWEST">Plus recents</MenuItem>
            <MenuItem value="NAME">Nom</MenuItem>
            <MenuItem value="ROLE">Role</MenuItem>
            <MenuItem value="LAST_LOGIN">Derniere connexion</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
        <Chip label={`${counts.total} utilisateurs`} />
        <Chip label={`${counts.active} actifs`} color="success" variant="outlined" />
        <Chip label={`${counts.admins} admins`} color="error" variant="outlined" />
        <Chip label={`${counts.managers} managers`} color="warning" variant="outlined" />
        <Chip label={`${counts.developers} developpeurs`} color="info" variant="outlined" />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }} elevation={0}>
          <Typography color="text.secondary">Aucun utilisateur a afficher.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>Utilisateur</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Derniere connexion</TableCell>
                <TableCell>Cree le</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 34, height: 34, fontSize: 14 }}>
                        {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700}>{u.firstName} {u.lastName}</Typography>
                        <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>{roleChip(u.role)}</TableCell>
                  <TableCell>{statusChip(u.active)}</TableCell>
                  <TableCell>{formatDateTime(u.lastLogin)}</TableCell>
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
                        <Tooltip title="Desactiver">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteId(u.id)}
                            aria-label={`Desactiver ${u.email}`}
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
        <DialogTitle>Desactiver cet utilisateur ?</DialogTitle>
        <DialogContent>
          <DialogContentText>Le compte sera marque comme inactif (suppression logique).</DialogContentText>
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
