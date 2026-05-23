import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  IconButton,
  Divider,
  Paper,
  CircularProgress,
  Button,
  Stack,
  useTheme,
  useMediaQuery,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import { Send, Close, ArrowBack, Forum } from '@mui/icons-material';
import { useChat, useChatStore } from '../../hooks/useChat';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuthStore } from '../../store/authStore';
import MessageBubble from './MessageBubble';
import ConversationList, { Conversation } from './ConversationList';
import { ChannelType, ProjectListItem } from '../../types';
import { fetchProjects } from '../../api/projectsApi';
import { fetchChatContacts, type ChatContact } from '../../api/chatContactsApi';
import { resolvePresenceDisplay, usePresenceStore } from '../../store/presenceStore';

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

const ChatPanel = ({ open, onClose }: ChatPanelProps) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { user } = useAuthStore();
  const { connectionState } = useWebSocket();
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const incomingAlert = useChatStore((state) => state.incomingAlert);
  const setIncomingAlert = useChatStore((state) => state.setIncomingAlert);
  const getPresence = usePresenceStore((state) => state.getPresence);

  const [activeChannel, setActiveChannel] = useState<{
    type: ChannelType;
    id: string | number;
    name: string;
    projectId?: number;
    recipientId?: number;
  } | null>(null);

  const [view, setView] = useState<'list' | 'conversation'>('list');
  const [messageInput, setMessageInput] = useState('');
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const projectNames = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])),
    [projects]
  );

  const contactNames = useMemo(
    () => Object.fromEntries(contacts.map((c) => [c.userId, `${c.firstName} ${c.lastName}`])),
    [contacts]
  );

  const {
    messages,
    sendMessage,
    loadMoreMessages,
    isLoadingHistory,
    hasMore,
  } = useChat({
    channelType: activeChannel?.type,
    projectId: activeChannel?.projectId,
    recipientId: activeChannel?.recipientId,
    projectNames,
    contactNames,
  });

  const loadContacts = useCallback(async () => {
    try {
      const contactRows = await fetchChatContacts();
      setContacts(contactRows);
    } catch (error) {
      console.error('Failed to load chat contacts:', error);
      setContacts([]);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const projData = await fetchProjects();
        setProjects(projData);
        await loadContacts();
      } catch (error) {
        console.error('Failed to load chat side data:', error);
      }
    };
    if (open) loadData();
  }, [open, loadContacts]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!messageInput.trim() || !activeChannel) return;
    sendMessage(messageInput);
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const conversations: Conversation[] = [
    ...projects.map((p) => ({
      id: `project-${p.id}`,
      name: p.name,
      type: 'PROJECT' as ChannelType,
      unreadCount: unreadCounts[`project-${p.id}`] || 0,
      projectId: p.id,
    })),
    ...contacts.map((c) => ({
      id: `private-${c.userId}`,
      name: `${c.firstName} ${c.lastName}`,
      type: 'PRIVATE' as ChannelType,
      unreadCount: unreadCounts[`private-${c.userId}`] || 0,
      recipientId: c.userId,
      presence: resolvePresenceDisplay(getPresence(c.userId)),
      avatar: null,
    })),
  ];

  const handleSelectConversation = (conv: Conversation) => {
    setActiveChannel({
      type: conv.type,
      id: conv.id,
      name: conv.name,
      projectId: conv.projectId,
      recipientId: conv.recipientId,
    });
    setView('conversation');
    setIncomingAlert(null);
  };

  const handleContactsChanged = async () => {
    await loadContacts();
  };

  const handleOpenAlertConversation = () => {
    if (!incomingAlert) return;
    const conv = conversations.find((c) => String(c.id) === incomingAlert.channelId);
    if (conv) {
      handleSelectConversation(conv);
    }
    setIncomingAlert(null);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant={isDesktop ? 'persistent' : 'temporary'}
      sx={{
        width: open ? 350 : 0,
        flexShrink: 0,
        zIndex: (t) => (isDesktop ? t.zIndex.drawer : t.zIndex.modal),
        visibility: open ? 'visible' : 'hidden',
        transition: theme.transitions.create(['width', 'visibility'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        '& .MuiDrawer-paper': {
          width: 350,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          mt: isDesktop ? '64px' : 0,
          height: isDesktop ? 'calc(100% - 64px)' : '100%',
          borderTop: isDesktop ? '1px solid' : 'none',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: 'white' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {view === 'conversation' ? (
            <Tooltip title="Retour à la liste">
              <IconButton size="small" onClick={() => setView('list')} sx={{ color: 'white', mr: 1 }}>
                <ArrowBack />
              </IconButton>
            </Tooltip>
          ) : (
            <Forum sx={{ mr: 1 }} />
          )}
          <Box
            onClick={() => view === 'conversation' && setView('list')}
            sx={{ cursor: view === 'conversation' ? 'pointer' : 'default' }}
          >
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {view === 'list' ? 'Chat Collaboratif' : activeChannel?.name ?? 'Chat'}
            </Typography>
            {view === 'conversation' && (
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.8, mt: -0.5 }}>
                Cliquez pour changer de canal
              </Typography>
            )}
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </Box>

      <Divider />

      <Snackbar
        open={Boolean(open && view === 'list' && incomingAlert)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: 72, width: '100%', maxWidth: 330, left: 'auto', right: 10, transform: 'none' }}
      >
        <Alert
          severity="info"
          variant="filled"
          onClose={() => setIncomingAlert(null)}
          onClick={handleOpenAlertConversation}
          sx={{ width: '100%', cursor: 'pointer' }}
        >
          <strong>{incomingAlert?.senderName}</strong> — {incomingAlert?.channelName}
          <br />
          <Typography variant="caption" component="span">
            {incomingAlert?.preview}
          </Typography>
        </Alert>
      </Snackbar>

      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {view === 'list' ? (
          <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
            <ConversationList
              conversations={conversations}
              activeConversationId={activeChannel?.id ?? ''}
              onSelectConversation={handleSelectConversation}
              onContactsChanged={handleContactsChanged}
            />
          </Box>
        ) : activeChannel ? (
          <Box key={activeChannel.id} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box
              ref={scrollRef}
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#f5f7fb',
              }}
            >
              {hasMore && (
                <Button
                  size="small"
                  onClick={loadMoreMessages}
                  disabled={isLoadingHistory}
                  sx={{ mb: 2, alignSelf: 'center' }}
                >
                  {isLoadingHistory ? <CircularProgress size={20} /> : 'Charger plus'}
                </Button>
              )}
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id || `${msg.senderId}-${msg.createdAt}`}
                  message={msg}
                  isOwnMessage={msg.senderId === user?.id}
                  presence={resolvePresenceDisplay(getPresence(msg.senderId))}
                />
              ))}
            </Box>

            <Paper elevation={3} sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="flex-end">
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Tapez un message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value.substring(0, 1000))}
                  onKeyDown={handleKeyPress}
                  variant="outlined"
                  size="small"
                  helperText={`${messageInput.length}/1000`}
                />
                <IconButton
                  color="primary"
                  onClick={handleSend}
                  disabled={!messageInput.trim() || connectionState !== 'CONNECTED'}
                >
                  <Send />
                </IconButton>
              </Stack>
            </Paper>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Selectionnez une conversation.
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default ChatPanel;
