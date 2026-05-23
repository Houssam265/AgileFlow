import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { Check, Close, MailOutline } from '@mui/icons-material';
import {
  acceptProjectInvitationById,
  fetchReceivedProjectInvitations,
  rejectProjectInvitation,
} from '../../api/projectsApi';
import type { ProjectInvitation } from '../../types';

type Props = {
  onAccepted?: () => void;
};

const ProjectReceivedInvitations = ({ onAccepted }: Props) => {
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchReceivedProjectInvitations();
      setInvitations(rows);
    } catch {
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAccept = async (id: number) => {
    setActionId(id);
    setFeedback(null);
    try {
      await acceptProjectInvitationById(id);
      setFeedback({ type: 'success', message: 'Invitation acceptee. Le projet apparait dans votre liste.' });
      await load();
      onAccepted?.();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Impossible d'accepter l'invitation.";
      setFeedback({ type: 'error', message });
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionId(id);
    setFeedback(null);
    try {
      await rejectProjectInvitation(id);
      await load();
    } catch {
      setFeedback({ type: 'error', message: "Impossible de refuser l'invitation." });
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, mb: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'primary.50', borderColor: 'primary.light' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <MailOutline color="primary" />
        <Typography variant="subtitle1" fontWeight={700}>
          Invitations projet recues
        </Typography>
      </Box>
      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 1 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}
      <List dense disablePadding>
        {invitations.map((inv) => (
          <ListItem
            key={inv.id}
            sx={{ px: 0, alignItems: 'flex-start' }}
            secondaryAction={
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton
                  size="small"
                  color="success"
                  aria-label="Accepter"
                  disabled={actionId === inv.id}
                  onClick={() => handleAccept(inv.id)}
                >
                  <Check fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  aria-label="Refuser"
                  disabled={actionId === inv.id}
                  onClick={() => handleReject(inv.id)}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            }
          >
            <ListItemText
              primary={inv.projectName}
              secondary={`${inv.inviterFirstName} ${inv.inviterLastName} vous invite a rejoindre ce projet.`}
            />
          </ListItem>
        ))}
      </List>
      <Typography variant="caption" color="text.secondary">
        Vous pouvez aussi accepter via le lien recu par email.
      </Typography>
    </Paper>
  );
};

export default ProjectReceivedInvitations;
