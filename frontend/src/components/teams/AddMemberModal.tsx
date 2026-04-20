import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Checkbox, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, CircularProgress, Typography,
} from '@mui/material';
import type { UserListItem } from '../../types';
import { fetchUsers } from '../../api/usersApi';
import { addTeamMember } from '../../api/teamsApi';

interface Props {
  open: boolean;
  onClose: () => void;
  teamId: number;
  existingMemberIds: Set<number>;
  onNotify: (message: string, severity: 'success' | 'error') => void;
  onDone: () => void;
}

const AddMemberModal = ({ open, onClose, teamId, existingMemberIds, onNotify, onDone }: Props) => {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  /** Option A : seuls les développeurs peuvent être membres d’équipe (aligné backend). */
  const available = useMemo(
    () =>
      users.filter(
        (u) => !existingMemberIds.has(u.id) && u.role === 'ROLE_DEVELOPER',
      ),
    [users, existingMemberIds],
  );

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setLoadingList(true);
    fetchUsers()
      .then(setUsers)
      .catch(() => onNotify('Impossible de charger les utilisateurs.', 'error'))
      .finally(() => setLoadingList(false));
  }, [open, onNotify]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      for (const userId of selected) {
        await addTeamMember(teamId, userId);
      }
      onNotify(`${selected.size} membre(s) ajouté(s).`, 'success');
      onDone();
      onClose();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      onNotify(msg ?? 'Erreur lors de l’ajout.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Ajouter des membres</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Seuls les comptes <strong>Développeur</strong> peuvent être ajoutés comme membres d’équipe.
        </Typography>
        {loadingList ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : available.length === 0 ? (
          <Typography color="text.secondary">Aucun utilisateur disponible à ajouter.</Typography>
        ) : (
          <List dense sx={{ maxHeight: 360, overflow: 'auto' }}>
            {available.map((u) => (
              <ListItem key={u.id} disablePadding>
                <ListItemButton onClick={() => toggle(u.id)}>
                  <ListItemIcon>
                    <Checkbox edge="start" checked={selected.has(u.id)} tabIndex={-1} disableRipple />
                  </ListItemIcon>
                  <ListItemText primary={`${u.firstName} ${u.lastName}`} secondary={u.email} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" onClick={handleAdd} disabled={saving || selected.size === 0} startIcon={saving ? <CircularProgress size={18} /> : null}>
          Ajouter la sélection
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMemberModal;
