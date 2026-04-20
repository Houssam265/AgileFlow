import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, CircularProgress,
  Typography, LinearProgress, List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import type { Role, UpdateUserPayload, UserListItem } from '../../types';
import { createUser, updateUser } from '../../api/usersApi';
import {
  getPasswordChecks,
  passwordMeetsPolicy,
  passwordStrengthLabel,
  PASSWORD_REQUIREMENTS_TEXT,
} from '../../utils/passwordPolicy';

const ROLES: { value: Role; label: string }[] = [
  { value: 'ROLE_ADMIN', label: 'Administrateur' },
  { value: 'ROLE_MANAGER', label: 'Manager' },
  { value: 'ROLE_DEVELOPER', label: 'Développeur' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  user?: UserListItem | null;
  onSaved: () => void;
  onNotify: (message: string, severity: 'success' | 'error') => void;
}

const AddEditUserModal = ({ open, onClose, mode, user, onSaved, onNotify }: Props) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('ROLE_DEVELOPER');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setEmail(user.email ?? '');
      setRole(user.role as Role);
      setActive(user.active !== false);
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setRole('ROLE_DEVELOPER');
      setPassword('');
      setConfirm('');
      setActive(true);
    }
  }, [open, mode, user]);

  const checks = useMemo(() => getPasswordChecks(password), [password]);
  const strengthLabel = passwordStrengthLabel(password);
  const strengthValue = useMemo(() => {
    if (!password) return 0;
    const met = [checks.length, checks.upper, checks.lower, checks.digit, checks.special].filter(Boolean).length;
    return (met / 5) * 100;
  }, [password, checks]);

  const createPasswordOk = mode === 'create' && passwordMeetsPolicy(password) && password === confirm;
  const editPasswordOk = useMemo(() => {
    if (mode !== 'edit') return true;
    if (!password.trim() && !confirm.trim()) return true;
    return passwordMeetsPolicy(password) && password === confirm;
  }, [mode, password, confirm]);

  const canSubmit =
    firstName.trim() && lastName.trim() && email.trim() && (mode === 'create' ? createPasswordOk : editPasswordOk);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      onNotify('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }
    if (mode === 'create') {
      if (!passwordMeetsPolicy(password) || password !== confirm) {
        onNotify(PASSWORD_REQUIREMENTS_TEXT, 'error');
        return;
      }
    } else if (user) {
      if ((password || confirm) && (!passwordMeetsPolicy(password) || password !== confirm)) {
        onNotify(PASSWORD_REQUIREMENTS_TEXT, 'error');
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === 'create') {
        await createUser({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          role,
          password,
        });
        onNotify('Utilisateur créé.', 'success');
      } else if (user) {
        const payload: UpdateUserPayload = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          role,
          active,
        };
        if (password.trim()) payload.password = password;
        await updateUser(user.id, payload);
        onNotify('Utilisateur mis à jour.', 'success');
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      const status = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { status?: number; data?: { message?: string } } }).response?.status
        : undefined;
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      if (status === 403) {
        onNotify('Vous n’avez pas la permission d’effectuer cette action.', 'error');
      } else {
        onNotify(msg ?? 'Une erreur est survenue.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'create' ? 'Nouvel utilisateur' : 'Modifier l’utilisateur'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} required fullWidth />
          <TextField label="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} required fullWidth />
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
          <TextField select label="Rôle" value={role} onChange={(e) => setRole(e.target.value as Role)} fullWidth>
            {ROLES.map((r) => (
              <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
            ))}
          </TextField>

          <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                {mode === 'create' ? 'Mot de passe' : 'Nouveau mot de passe (optionnel)'}
              </Typography>
              {mode === 'create' && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  {PASSWORD_REQUIREMENTS_TEXT}
                </Typography>
              )}
              <TextField
                label={mode === 'create' ? 'Mot de passe' : 'Mot de passe'}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={mode === 'create'}
                fullWidth
                autoComplete="new-password"
              />
              {password.length > 0 && (
                <>
                  <Box sx={{ mt: 1, mb: 1 }}>
                    <LinearProgress variant="determinate" value={strengthValue} sx={{ height: 8, borderRadius: 1 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Force : {strengthLabel || '—'}
                    </Typography>
                  </Box>
                  <List dense disablePadding sx={{ bgcolor: 'grey.50', borderRadius: 1, px: 1, py: 0.5 }}>
                    {[
                      { ok: checks.length, label: 'Au moins 8 caractères' },
                      { ok: checks.upper, label: 'Une majuscule (A–Z)' },
                      { ok: checks.lower, label: 'Une minuscule (a–z)' },
                      { ok: checks.digit, label: 'Un chiffre (0–9)' },
                      { ok: checks.special, label: 'Un caractère spécial (!@#$%^&*)' },
                    ].map((row) => (
                      <ListItem key={row.label} disableGutters sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {row.ok ? <Check color="success" fontSize="small" /> : <Close color="disabled" fontSize="small" />}
                        </ListItemIcon>
                        <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary={row.label} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
              <TextField
                sx={{ mt: 2 }}
                label={mode === 'create' ? 'Confirmer le mot de passe' : 'Confirmer le nouveau mot de passe'}
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required={mode === 'create'}
                fullWidth
                error={confirm.length > 0 && password !== confirm}
                helperText={confirm.length > 0 && password !== confirm ? 'Les mots de passe ne correspondent pas' : ''}
              />
            </Box>

          {mode === 'edit' && (
            <TextField
              select
              label="Compte actif"
              value={active ? 'true' : 'false'}
              onChange={(e) => setActive(e.target.value === 'true')}
              fullWidth
            >
              <MenuItem value="true">Actif</MenuItem>
              <MenuItem value="false">Inactif</MenuItem>
            </TextField>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Annuler</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !canSubmit}
          startIcon={loading ? <CircularProgress size={18} /> : null}
        >
          {mode === 'create' ? 'Créer' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEditUserModal;
