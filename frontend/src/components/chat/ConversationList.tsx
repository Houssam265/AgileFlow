import { List, ListItem, ListItemAvatar, Avatar, ListItemText, ListItemButton, Badge, Typography, Divider, Box } from '@mui/material';
import { Business, Person } from '@mui/icons-material';
import PresenceIndicator from './PresenceIndicator';
import { ChannelType } from '../../types';
import type { PresenceDisplay } from '../../store/presenceStore';
import ContactInviteSection from './ContactInviteSection';

export interface Conversation {
  id: string | number;
  name: string;
  type: ChannelType;
  unreadCount: number;
  presence?: PresenceDisplay;
  avatar?: string | null;
  recipientId?: number;
  projectId?: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | number;
  onSelectConversation: (conversation: Conversation) => void;
  onContactsChanged: () => void;
}

const ConversationList = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onContactsChanged,
}: ConversationListProps) => {
  const getIcon = (type: ChannelType) => {
    switch (type) {
      case 'PROJECT': return <Business />;
      case 'PRIVATE': return <Person />;
      default: return <Business />;
    }
  };

  const privateConversations = conversations.filter((c) => c.type === 'PRIVATE');

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      <Typography variant="overline" sx={{ px: 2, color: 'text.secondary', fontWeight: 'bold' }}>
        Canaux
      </Typography>
      {conversations.filter((c) => c.type !== 'PRIVATE').map((conv) => (
        <ListItem key={conv.id} disablePadding>
          <ListItemButton
            selected={activeConversationId === conv.id}
            onClick={() => onSelectConversation(conv)}
            sx={{
              '&.Mui-selected': {
                borderRight: '3px solid',
                borderColor: 'primary.main',
              },
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: activeConversationId === conv.id ? 'primary.main' : 'grey.300' }}>
                {getIcon(conv.type)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={conv.name}
              secondary="Projet"
            />
            <Badge badgeContent={conv.unreadCount} color="error" />
          </ListItemButton>
        </ListItem>
      ))}

      <Divider sx={{ my: 1 }} />

      <ContactInviteSection onContactsChanged={onContactsChanged} />

      <Divider sx={{ my: 1 }} />

      <Typography variant="overline" sx={{ px: 2, color: 'text.secondary', fontWeight: 'bold' }}>
        Messages Directs
      </Typography>

      {privateConversations.length === 0 ? (
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Aucun contact pour le moment. Recherchez un utilisateur et envoyez une invitation.
          </Typography>
        </Box>
      ) : (
        privateConversations.map((conv) => (
          <ListItem key={conv.id} disablePadding>
            <ListItemButton
              selected={activeConversationId === conv.id}
              onClick={() => onSelectConversation(conv)}
              sx={{
                '&.Mui-selected': {
                  borderRight: '3px solid',
                  borderColor: 'primary.main',
                },
              }}
            >
              <ListItemAvatar>
                <PresenceIndicator presence={conv.presence ?? 'OFFLINE'} size="small">
                  <Avatar src={conv.avatar || undefined}>
                    {conv.name.charAt(0)}
                  </Avatar>
                </PresenceIndicator>
              </ListItemAvatar>
              <ListItemText primary={conv.name} />
              <Badge badgeContent={conv.unreadCount} color="error" />
            </ListItemButton>
          </ListItem>
        ))
      )}
    </List>
  );
};

export default ConversationList;
