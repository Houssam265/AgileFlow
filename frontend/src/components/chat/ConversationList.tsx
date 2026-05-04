import { useState, useEffect } from 'react';
import { List, ListItem, ListItemAvatar, Avatar, ListItemText, ListItemButton, Badge, Typography, Divider, CircularProgress, Box } from '@mui/material';
import { Public, Business, Person } from '@mui/icons-material';
import PresenceIndicator from './PresenceIndicator';
import { ChannelType, UserListItem } from '../../types';
import { fetchUsers } from '../../api/usersApi';

export interface Conversation {
  id: string | number;
  name: string;
  type: ChannelType;
  unreadCount: number;
  isOnline?: boolean;
  avatar?: string | null;
  recipientId?: number;
  projectId?: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | number;
  onSelectConversation: (conversation: Conversation) => void;
}

const ConversationList = ({ conversations, activeConversationId, onSelectConversation }: ConversationListProps) => {
  const [allUsers, setAllUsers] = useState<UserListItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const users = await fetchUsers();
        setAllUsers(users);
      } catch (error) {
        console.error('Failed to fetch users in ConversationList:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  const getIcon = (type: ChannelType) => {
    switch (type) {
      case 'GLOBAL': return <Public />;
      case 'PROJECT': return <Business />;
      case 'PRIVATE': return <Person />;
    }
  };

  const getUserName = (conv: Conversation) => {
    if (conv.type !== 'PRIVATE' || !conv.recipientId) return conv.name;
    const user = allUsers.find(u => u.id === conv.recipientId);
    if (user) return `${user.firstName} ${user.lastName}`;
    return conv.name;
  };

  const getUserInitial = (conv: Conversation) => {
    if (conv.type !== 'PRIVATE' || !conv.recipientId) return conv.name.charAt(0);
    const user = allUsers.find(u => u.id === conv.recipientId);
    if (user) return user.firstName.charAt(0);
    return conv.name.charAt(0);
  };

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      <Typography variant="overline" sx={{ px: 2, color: 'text.secondary', fontWeight: 'bold' }}>
        Canaux
      </Typography>
      {conversations.filter(c => c.type !== 'PRIVATE').map((conv) => (
        <ListItem key={conv.id} disablePadding>
          <ListItemButton
            selected={activeConversationId === conv.id}
            onClick={() => onSelectConversation(conv)}
            sx={{
              '&.Mui-selected': {
                borderRight: '3px solid',
                borderColor: 'primary.main',
              }
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: activeConversationId === conv.id ? 'primary.main' : 'grey.300' }}>
                {getIcon(conv.type)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText 
              primary={conv.name} 
              secondary={conv.type === 'GLOBAL' ? 'Chat public' : 'Projet'}
            />
            <Badge badgeContent={conv.unreadCount} color="error" />
          </ListItemButton>
        </ListItem>
      ))}

      <Divider sx={{ my: 1 }} />
      
      <Typography variant="overline" sx={{ px: 2, color: 'text.secondary', fontWeight: 'bold' }}>
        Messages Directs
      </Typography>
      
      {isLoadingUsers && allUsers.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        conversations.filter(c => c.type === 'PRIVATE').map((conv) => (
          <ListItem key={conv.id} disablePadding>
            <ListItemButton
              selected={activeConversationId === conv.id}
              onClick={() => onSelectConversation(conv)}
              sx={{
                '&.Mui-selected': {
                  borderRight: '3px solid',
                  borderColor: 'primary.main',
                }
              }}
            >
              <ListItemAvatar>
                <PresenceIndicator isOnline={!!conv.isOnline} size="small">
                  <Avatar src={conv.avatar || undefined}>
                    {getUserInitial(conv)}
                  </Avatar>
                </PresenceIndicator>
              </ListItemAvatar>
              <ListItemText primary={getUserName(conv)} />
              <Badge badgeContent={conv.unreadCount} color="error" />
            </ListItemButton>
          </ListItem>
        ))
      )}
    </List>
  );
};

export default ConversationList;
