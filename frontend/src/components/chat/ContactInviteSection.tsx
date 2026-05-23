import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Check, Close, PersonAdd, Search } from '@mui/icons-material';
import {
  acceptChatContactInvitation,
  fetchPendingReceivedInvitations,
  rejectChatContactInvitation,
  searchChatUsers,
  sendChatContactInvitation,
  type ChatContactInvitation,
  type ChatUserSearchResult,
} from '../../api/chatContactsApi';

interface ContactInviteSectionProps {
  onContactsChanged: () => void;
}

const ContactInviteSection = ({ onContactsChanged }: ContactInviteSectionProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUserSearchResult[]>([]);
  const [pendingReceived, setPendingReceived] = useState<ChatContactInvitation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadPendingReceived = useCallback(async () => {
    setIsLoadingInvites(true);
    try {
      const received = await fetchPendingReceivedInvitations();
      setPendingReceived(received);
    } catch {
      setPendingReceived([]);
    } finally {
      setIsLoadingInvites(false);
    }
  }, []);

  useEffect(() => {
    loadPendingReceived();
  }, [loadPendingReceived]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setFeedback(null);
      try {
        const results = await searchChatUsers(searchQuery.trim());
        setSearchResults(results);
      } catch {
        setSearchResults([]);
        setFeedback({ type: 'error', message: 'Recherche impossible pour le moment.' });
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const handleInvite = async (userId: number) => {
    setActionUserId(userId);
    setFeedback(null);
    try {
      await sendChatContactInvitation(userId);
      setFeedback({ type: 'success', message: 'Invitation envoyée.' });
      setSearchResults((prev) =>
        prev.map((u) => (u.userId === userId ? { ...u, relationshipStatus: 'PENDING_SENT' } : u))
      );
      onContactsChanged();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Impossible d'envoyer l'invitation.";
      setFeedback({ type: 'error', message });
    } finally {
      setActionUserId(null);
    }
  };

  const handleAccept = async (invitationId: number) => {
    setActionUserId(invitationId);
    setFeedback(null);
    try {
      await acceptChatContactInvitation(invitationId);
      setFeedback({ type: 'success', message: 'Contact ajouté. Vous pouvez maintenant discuter.' });
      await loadPendingReceived();
      onContactsChanged();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Impossible d'accepter l'invitation.";
      setFeedback({ type: 'error', message });
    } finally {
      setActionUserId(null);
    }
  };

  const handleReject = async (invitationId: number) => {
    setActionUserId(invitationId);
    try {
      await rejectChatContactInvitation(invitationId);
      await loadPendingReceived();
    } catch {
      setFeedback({ type: 'error', message: "Impossible de refuser l'invitation." });
    } finally {
      setActionUserId(null);
    }
  };

  const renderSearchAction = (user: ChatUserSearchResult) => {
    switch (user.relationshipStatus) {
      case 'CONTACT':
        return <Chip size="small" label="Contact" color="success" variant="outlined" />;
      case 'PENDING_SENT':
        return <Chip size="small" label="Invitation envoyée" color="warning" variant="outlined" />;
      case 'PENDING_RECEIVED':
        return <Chip size="small" label="Invitation reçue" color="info" variant="outlined" />;
      default:
        return (
          <Button
            size="small"
            variant="outlined"
            startIcon={<PersonAdd />}
            disabled={actionUserId === user.userId}
            onClick={() => handleInvite(user.userId)}
          >
            Inviter
          </Button>
        );
    }
  };

  return (
    <Box sx={{ px: 2, pb: 2 }}>
      <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
        Ajouter un contact
      </Typography>
      <TextField
        fullWidth
        size="small"
        placeholder="Rechercher par nom ou email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mt: 1, mb: 1 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: isSearching ? (
            <InputAdornment position="end">
              <CircularProgress size={18} />
            </InputAdornment>
          ) : undefined,
        }}
        helperText="Minimum 2 caractères"
      />

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 1 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {searchQuery.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Aucun utilisateur trouvé.
        </Typography>
      )}

      {searchResults.length > 0 && (
        <List dense disablePadding sx={{ mb: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
          {searchResults.map((user) => (
            <ListItem
              key={user.userId}
              secondaryAction={renderSearchAction(user)}
              sx={{ pr: 14 }}
            >
              <ListItemText
                primary={`${user.firstName} ${user.lastName}`}
                secondary={user.email}
                primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
                secondaryTypographyProps={{ fontSize: 12 }}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold', display: 'block', mt: 1 }}>
        Invitations reçues
      </Typography>

      {isLoadingInvites ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <CircularProgress size={22} />
        </Box>
      ) : pendingReceived.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          Aucune invitation en attente.
        </Typography>
      ) : (
        <List dense disablePadding>
          {pendingReceived.map((inv) => (
            <ListItem
              key={inv.id}
              secondaryAction={
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    color="success"
                    disabled={actionUserId === inv.id}
                    onClick={() => handleAccept(inv.id)}
                    aria-label="Accepter"
                  >
                    <Check fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={actionUserId === inv.id}
                    onClick={() => handleReject(inv.id)}
                    aria-label="Refuser"
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Stack>
              }
            >
              <ListItemText
                primary={`${inv.requesterFirstName} ${inv.requesterLastName}`}
                secondary="Souhaite discuter avec vous"
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default ContactInviteSection;
