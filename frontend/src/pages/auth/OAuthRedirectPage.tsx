import { useEffect, useRef } from 'react';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types';

const OAuthRedirectPage = () => {
  const navigate = useNavigate();
  const { setAuth, token, user } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) {
      return;
    }
    processedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken') ?? undefined;
    const userId = Number(params.get('userId'));
    const email = params.get('email');
    const role = params.get('role') as Role | null;
    const firstName = params.get('prenom') ?? '';
    const lastName = params.get('nom') ?? '';

    if (!accessToken || !email || !role || Number.isNaN(userId)) {
      if (token && user) {
        navigate('/dashboard', { replace: true });
        return;
      }
      navigate('/login?oauthError=missing_token', { replace: true });
      return;
    }

    setAuth(accessToken, {
      id: userId,
      email,
      role,
      firstName,
      lastName,
    }, refreshToken);

    navigate('/dashboard', { replace: true });
  }, [navigate, setAuth, token, user]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'grey.100' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 360, textAlign: 'center', borderRadius: 3 }}>
        <CircularProgress size={32} sx={{ mb: 2 }} />
        <Typography fontWeight={700}>Connexion en cours...</Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Finalisation de votre session AgileFlow
        </Typography>
      </Paper>
    </Box>
  );
};

export default OAuthRedirectPage;
