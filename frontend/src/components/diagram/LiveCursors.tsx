import { Box, Typography } from '@mui/material';
import { useViewport } from 'reactflow';
import type { CollaboratorInfo } from '../../types';

interface LiveCursorsProps {
  users: CollaboratorInfo[];
  currentUserId?: number;
}

export const LiveCursors = ({ users, currentUserId }: LiveCursorsProps) => {
  const viewport = useViewport();
  const now = Date.now();
  return (
    <>
      {users
        .filter((user) => user.userId !== currentUserId && (!user.lastSeen || now - user.lastSeen < 5000))
        .map((user) => {
          const x = user.cursorX * viewport.zoom + viewport.x;
          const y = user.cursorY * viewport.zoom + viewport.y;
          return (
            <Box key={user.userId} sx={{ position: 'absolute', left: 0, top: 0, transform: `translate(${x}px, ${y}px)`, transition: 'transform .1s linear', pointerEvents: 'none', zIndex: 20 }}>
              <svg width="22" height="28" viewBox="0 0 22 28">
                <path d="M2 2l16 10-7 2 4 8-4 2-4-8-5 5z" fill={user.color} stroke="white" strokeWidth="1.5" />
              </svg>
              <Typography sx={{ bgcolor: user.color, color: 'white', px: 0.75, py: 0.25, borderRadius: 1, fontSize: 11, whiteSpace: 'nowrap' }}>
                {user.username}
              </Typography>
            </Box>
          );
        })}
    </>
  );
};
