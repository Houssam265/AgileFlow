import { Box, Typography, Avatar, Paper } from '@mui/material';
import { ChatMessageDTO } from '../../types';
import PresenceIndicator from './PresenceIndicator';

interface MessageBubbleProps {
  message: ChatMessageDTO;
  isOwnMessage: boolean;
  isOnline: boolean;
}

const MessageBubble = ({ message, isOwnMessage, isOnline }: MessageBubbleProps) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <Typography
            key={index}
            component="span"
            sx={{ color: 'primary.main', fontWeight: 'bold', display: 'inline' }}
          >
            {part}
          </Typography>
        );
      }
      return part;
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
        mb: 2,
        alignItems: 'flex-end',
        gap: 1,
      }}
    >
      {!isOwnMessage && (
        <PresenceIndicator isOnline={isOnline} size="small">
          <Avatar
            src={message.senderAvatar || undefined}
            sx={{ width: 32, height: 32, fontSize: '0.875rem' }}
          >
            {message.senderName.charAt(0)}
          </Avatar>
        </PresenceIndicator>
      )}

      <Box sx={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isOwnMessage ? 'flex-end' : 'flex-start' }}>
        {!isOwnMessage && (
          <Typography variant="caption" sx={{ ml: 1, mb: 0.5, color: 'text.secondary' }}>
            {message.senderName}
          </Typography>
        )}
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: isOwnMessage ? 'primary.main' : 'grey.100',
            color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
            borderBottomRightRadius: isOwnMessage ? 0 : 2,
            borderBottomLeftRadius: isOwnMessage ? 2 : 0,
          }}
        >
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {renderContent(message.content)}
          </Typography>
        </Paper>
        <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary', fontSize: '0.7rem' }}>
          {formatTime(message.createdAt)}
        </Typography>
      </Box>
    </Box>
  );
};

export default MessageBubble;
