import { Badge, styled } from '@mui/material';

interface PresenceIndicatorProps {
  isOnline: boolean;
  children: React.ReactNode;
  size?: 'small' | 'medium';
}

const StyledBadge = styled(Badge, {
  shouldForwardProp: (prop) => prop !== 'size' && prop !== 'isOnline',
})<{ isOnline: boolean; size: 'small' | 'medium' }>(({ theme, isOnline, size }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: isOnline ? '#44b700' : '#bdbdbd',
    color: isOnline ? '#44b700' : '#bdbdbd',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    width: size === 'small' ? 8 : 12,
    height: size === 'small' ? 8 : 12,
    borderRadius: '50%',
    '&::after': isOnline ? {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    } : {},
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const PresenceIndicator = ({ isOnline, children, size = 'medium' }: PresenceIndicatorProps) => {
  return (
    <StyledBadge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      variant="dot"
      isOnline={isOnline}
      size={size}
    >
      {children}
    </StyledBadge>
  );
};

export default PresenceIndicator;
