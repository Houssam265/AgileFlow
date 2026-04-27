import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Chip, CircularProgress, Alert, Grid, List, ListItem, ListItemText, Divider,
  Snackbar,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserDetail } from '../../types';
import { fetchUserById } from '../../api/usersApi';
import { formatDateTime } from '../../utils/formatDate';
import AddEditUserModal from '../../components/users/AddEditUserModal';
import NotificationPreferences from '../../components/users/NotificationPreferences';

const roleChip = (role: string) => {
  const color = role === 'ROLE_ADMIN' ? 'error' : role === 'ROLE_MANAGER' ? 'warning' : 'info';
  const label = role === 'ROLE_ADMIN' ? 'Admin' : role === 'ROLE_MANAGER' ? 'Manager' : 'Développeur';
  return <Chip label={label} color={color} />;
};

const UserProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: current } = useAuth();
  const isAdmin = current?.role === 'ROLE_ADMIN';

  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const u = await fetchUserById(Number(id));
      setData(u);
    } catch {
      setError('Utilisateur introuvable ou erreur réseau.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
    );
  }

  if (error || !data) {
    return <Alert severity="error">{error ?? 'Introuvable.'}</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/users')} sx={{ mb: 2 }}>
        Retour à la liste
      </Button>

      <Paper sx={{ p: 3, borderRadius: 2 }} elevation={0}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {data.firstName} {data.lastName}
            </Typography>
            <Typography color="text.secondary">{data.email}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {roleChip(data.role)}
            {isAdmin && (
              <Button variant="outlined" onClick={() => setEditOpen(true)}>Modifier le profil</Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Créé le</Typography>
            <Typography>{formatDateTime(data.createdAt)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Dernière connexion</Typography>
            <Typography>{formatDateTime(data.lastLogin)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Statut</Typography>
            <Typography>{data.active !== false ? 'Actif' : 'Inactif'}</Typography>
          </Grid>
        </Grid>

        <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>Équipes</Typography>
        {data.teams.length === 0 ? (
          <Typography color="text.secondary">Aucune équipe.</Typography>
        ) : (
          <List dense>
            {data.teams.map((t) => (
              <ListItem key={t.teamId} disablePadding sx={{ py: 0.5 }}>
                <ListItemText
                  primary={
                    <Link to={`/teams/${t.teamId}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>
                      {t.teamName}
                    </Link>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {current?.id === data.id && (
        <Box sx={{ mt: 3 }}>
          <NotificationPreferences title="Notifications email" />
        </Box>
      )}

      <AddEditUserModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        mode="edit"
        user={data}
        onSaved={load}
        onNotify={(msg, sev) => setSnack({ msg, sev })}
      />

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {snack ? <Alert severity={snack.sev} onClose={() => setSnack(null)} sx={{ width: '100%' }}>{snack.msg}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
};

export default UserProfilePage;
