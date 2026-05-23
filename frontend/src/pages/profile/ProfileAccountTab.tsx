import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchMyProfile, updateMyProfile } from '../../api/usersApi';
import type { UserDetail } from '../../types';
import { formatDateTime } from '../../utils/formatDate';
import { useAuthStore } from '../../store/authStore';

const roleChip = (role: string) => {
  const map: Record<string, { label: string; color: 'error' | 'warning' | 'info' }> = {
    ROLE_ADMIN: { label: 'Administrateur', color: 'error' },
    ROLE_MANAGER: { label: 'Manager', color: 'warning' },
    ROLE_DEVELOPER: { label: 'Developpeur', color: 'info' },
  };
  const cfg = map[role] ?? { label: role, color: 'info' as const };
  return <Chip label={cfg.label} color={cfg.color} size="small" />;
};

const ProfileAccountTab = () => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<UserDetail | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyProfile();
      setProfile(data);
      setFirstName(data.firstName);
      setLastName(data.lastName);
    } catch {
      setError('Impossible de charger votre profil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    setSaving(true);
    try {
      const updated = await updateMyProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      if (user && token) {
        useAuthStore.getState().setAuth(token, {
          ...user,
          firstName: updated.firstName,
          lastName: updated.lastName,
        });
      }
      setSnack('Profil mis a jour.');
      await load();
    } catch {
      setSnack('Erreur lors de la mise a jour.');
    } finally {
      setSaving(false);
    }
  };

  const dirty = profile && (firstName !== profile.firstName || lastName !== profile.lastName);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return <Alert severity="error">{error ?? 'Profil introuvable.'}</Alert>;
  }

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
        Informations du compte
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Votre identite affichee dans AgileFlow et sur les assignations.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Prenom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Email" value={profile.email} fullWidth disabled helperText="Contactez un admin pour changer l'email." />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" color="text.secondary">Role</Typography>
          <Box sx={{ mt: 0.5 }}>{roleChip(profile.role)}</Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" color="text.secondary">Statut</Typography>
          <Typography>{profile.active !== false ? 'Compte actif' : 'Compte inactif'}</Typography>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="contained" disabled={!dirty || saving} onClick={handleSave}>
          Enregistrer
        </Button>
        <Button
          variant="outlined"
          disabled={!dirty || saving}
          onClick={() => {
            setFirstName(profile.firstName);
            setLastName(profile.lastName);
          }}
        >
          Annuler
        </Button>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" color="text.secondary">Membre depuis</Typography>
          <Typography>{formatDateTime(profile.createdAt)}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" color="text.secondary">Derniere connexion</Typography>
          <Typography>{formatDateTime(profile.lastLogin)}</Typography>
        </Grid>
      </Grid>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        Mes equipes
      </Typography>
      {profile.teams.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Vous n'appartenez a aucune equipe pour le moment.
        </Typography>
      ) : (
        <List dense disablePadding>
          {profile.teams.map((t) => (
            <ListItem key={t.teamId} disablePadding sx={{ py: 0.5 }}>
              <ListItemText
                primary={
                  <Link component={RouterLink} to={`/teams/${t.teamId}`} underline="hover" fontWeight={600}>
                    {t.teamName}
                  </Link>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      <Snackbar open={snack != null} autoHideDuration={4000} onClose={() => setSnack(null)} message={snack} />
    </Paper>
  );
};

export default ProfileAccountTab;
