import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import { PersonAdd, PersonRemove } from '@mui/icons-material';
import { fetchChatContacts, type ChatContact } from '../../api/chatContactsApi';
import {
  fetchPendingProjectInvitations,
  fetchProjectMembers,
  inviteProjectMember,
  removeProjectMember,
} from '../../api/projectsApi';
import type { ProjectListItem, ProjectMember } from '../../types';

type Props = {
  open: boolean;
  project: ProjectListItem | null;
  onClose: () => void;
  onUpdated?: () => void;
};

const ProjectInviteModal = ({ open, project, onClose, onUpdated }: Props) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    try {
      const [memberRows, contactRows, pendingRows] = await Promise.all([
        fetchProjectMembers(project.id),
        fetchChatContacts(),
        fetchPendingProjectInvitations(project.id).catch(() => []),
      ]);
      setMembers(memberRows);
      const memberIds = new Set(memberRows.map((m) => m.userId));
      const pendingUserIds = new Set(
        pendingRows.map((i) => i.invitedUserId).filter((id): id is number => id != null),
      );
      const pendingEmails = new Set(pendingRows.map((i) => i.invitedEmail.toLowerCase()));
      setContacts(
        contactRows.filter(
          (c) => !memberIds.has(c.userId) && !pendingUserIds.has(c.userId) && !pendingEmails.has(c.email.toLowerCase()),
        ),
      );
    } catch {
      setFeedback({ type: 'error', message: 'Impossible de charger les membres.' });
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (open && project) {
      setFeedback(null);
      setSelectedContact(null);
      setEmail('');
      load();
    }
  }, [open, project, load]);

  const handleInviteContact = async () => {
    if (!project || !selectedContact) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const result = await inviteProjectMember(project.id, { userId: selectedContact.userId });
      setFeedback({ type: 'success', message: result.message });
      setSelectedContact(null);
      await load();
      onUpdated?.();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Impossible d'envoyer l'invitation.";
      setFeedback({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleInviteEmail = async () => {
    if (!project || !email.trim()) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const result = await inviteProjectMember(project.id, { email: email.trim() });
      setFeedback({ type: 'success', message: result.message });
      setEmail('');
      await load();
      onUpdated?.();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Impossible d'envoyer l'invitation.";
      setFeedback({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (userId: number) => {
    if (!project) return;
    setActionLoading(true);
    try {
      await removeProjectMember(project.id, userId);
      setFeedback({ type: 'success', message: 'Membre retire du projet.' });
      await load();
      onUpdated?.();
    } catch {
      setFeedback({ type: 'error', message: 'Impossible de retirer ce membre.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !actionLoading && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>Membres du projet — {project?.name}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {feedback && <Alert severity={feedback.type}>{feedback.message}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
        ) : (
          <>
            <Typography variant="subtitle2" fontWeight={700}>Membres actuels</Typography>
            <List dense disablePadding>
              {members.map((m) => (
                <ListItem
                  key={m.userId}
                  secondaryAction={
                    !m.owner ? (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<PersonRemove />}
                        disabled={actionLoading}
                        onClick={() => handleRemove(m.userId)}
                      >
                        Retirer
                      </Button>
                    ) : undefined
                  }
                >
                  <ListItemText
                    primary={`${m.firstName} ${m.lastName}${m.owner ? ' (Proprietaire)' : ''}`}
                    secondary={m.email}
                  />
                </ListItem>
              ))}
            </List>

            <Divider />

            <Typography variant="subtitle2" fontWeight={700}>Inviter un contact (amis)</Typography>
            <Typography variant="body2" color="text.secondary">
              Votre contact recevra une invitation dans l&apos;application et pourra l&apos;accepter ou la refuser.
            </Typography>
            <Autocomplete
              options={contacts}
              getOptionLabel={(o) => `${o.firstName} ${o.lastName} (${o.email})`}
              value={selectedContact}
              onChange={(_, value) => setSelectedContact(value)}
              renderInput={(params) => <TextField {...params} label="Choisir un contact" size="small" />}
              noOptionsText="Aucun contact disponible (deja membre ou invitation en attente)"
            />
            <Button
              variant="outlined"
              startIcon={<PersonAdd />}
              disabled={!selectedContact || actionLoading}
              onClick={handleInviteContact}
            >
              Envoyer l&apos;invitation
            </Button>

            <Divider />

            <Typography variant="subtitle2" fontWeight={700}>Inviter par email</Typography>
            <Typography variant="body2" color="text.secondary">
              Si la personne n&apos;est pas votre contact, une invitation sera envoyee automatiquement par email.
            </Typography>
            <TextField
              label="Adresse email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              size="small"
            />
            <Button
              variant="contained"
              disabled={!email.trim() || actionLoading}
              onClick={handleInviteEmail}
            >
              Envoyer l&apos;invitation
            </Button>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={actionLoading}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectInviteModal;
