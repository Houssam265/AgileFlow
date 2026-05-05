import { useState, useEffect, useRef } from 'react';
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
} from '@mui/material';
import { Send, Close, ArrowBack, Forum } from '@mui/icons-material';
import { useChat, useChatStore } from '../../hooks/useChat';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuthStore } from '../../store/authStore';
import MessageBubble from './MessageBubble';
import ConversationList, { Conversation } from './ConversationList';
import { ChannelType, ProjectListItem, UserListItem } from '../../types';
import { fetchProjects } from '../../api/projectsApi';
import { fetchUsers } from '../../api/usersApi';
import { Tooltip } from '@mui/material';

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
  
  const [activeChannel, setActiveChannel] = useState<{
    type: ChannelType;
    id: string | number;
    name: string;
    projectId?: number;
    recipientId?: number;
  }>({ type: 'GLOBAL', id: 'global', name: 'Global' });

  const [view, setView] = useState<'list' | 'conversation'>('list');
  const [messageInput, setMessageInput] = useState('');
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    onlineUsers,
    sendMessage,
    loadMoreMessages,
    isLoadingHistory,
    hasMore,
  } = useChat({
    channelType: activeChannel.type,
    projectId: activeChannel.projectId,
    recipientId: activeChannel.recipientId,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projData, usersData] = await Promise.all([fetchProjects(), fetchUsers()]);
        setProjects(projData);
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to load chat side data:', error);
      }
    };
    if (open) loadData();
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!messageInput.trim()) return;
    sendMessage(messageInput);
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const conversations = [
    { id: 'global', name: 'Global', type: 'GLOBAL' as ChannelType, unreadCount: unreadCounts['global'] || 0 },
    ...projects.map(p => ({ 
      id: `project-${p.id}`, 
      name: p.name, 
      type: 'PROJECT' as ChannelType, 
      unreadCount: unreadCounts[`project-${p.id}`] || 0, 
      projectId: p.id 
    })),
    ...users.filter(u => u.id !== user?.id).map(u => ({ 
      id: `private-${u.id}`, 
      name: `${u.firstName} ${u.lastName}`, 
      type: 'PRIVATE' as ChannelType, 
      unreadCount: unreadCounts[`private-${u.id}`] || 0, 
      recipientId: u.id,
      isOnline: onlineUsers.includes(u.id),
      avatar: null
    }))
  ];

  const handleSelectConversation = (conv: Conversation) => {
    setActiveChannel({
      type: conv.type,
      id: conv.id,
      name: conv.name,
      projectId: conv.projectId,
      recipientId: conv.recipientId,
    });
    // Forcer le passage à la vue conversation
    setView('conversation');
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
        zIndex: (theme) => isDesktop ? theme.zIndex.drawer : theme.zIndex.modal,
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
          mt: isDesktop ? '64px' : 0, // Height of the AppBar
          height: isDesktop ? 'calc(100% - 64px)' : '100%',
          borderTop: isDesktop ? '1px solid' : 'none',
          borderColor: 'divider',
        },
      }}
    >
      {/* Header */}
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
              {view === 'list' ? 'Chat Collaboratif' : activeChannel.name}
            </Typography>
            {view === 'conversation' && (
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.8, mt: -0.5 }}>
                Cliquez pour changer de canal
              </Typography>
            )}
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Stack>
      </Box>

      <Divider />

      {/* Body */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {view === 'list' ? (
          <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
            <ConversationList
              conversations={conversations}
              activeConversationId={activeChannel.id}
              onSelectConversation={handleSelectConversation}
            />
          </Box>
        ) : (
          <Box key={activeChannel.id} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box
              ref={scrollRef}
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#f5f7fb'
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
                  isOnline={onlineUsers.includes(msg.senderId)}
                />
              ))}
            </Box>

            {/* Footer */}
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
        )}
      </Box>
    </Drawer>
  );
};

export default ChatPanel;
