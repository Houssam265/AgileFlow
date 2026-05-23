import React, { useEffect, useState } from 'react';
import {
  Box, TextField, Button, Typography, Paper, Alert, CircularProgress, InputAdornment, IconButton, Divider, Stack,
} from '@mui/material';
import { GitHub, Google, Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/axiosInterceptor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const OAUTH_BASE_URL = API_URL.replace(/\/api\/?$/, '');
const homeForRole = (role: string) => (role === 'ROLE_ADMIN' ? '/admin' : '/dashboard');

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setAuth } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('oauthError');
    if (oauthError) {
      const oauthDetail = params.get('oauthDetail');
      setError(oauthDetail || `Connexion OAuth impossible: ${oauthError}`);
    }
  }, []);

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    window.location.href = `${OAUTH_BASE_URL}/oauth2/authorization/${provider}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.accessToken, {
        id: data.userId,
        email: data.email,
        role: data.role,
        firstName: data.prenom ?? '',
        lastName: data.nom ?? '',
      }, data.refreshToken);
      navigate(homeForRole(data.role), { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'grey.100' }}>
      <Paper elevation={4} sx={{ p: 5, width: '100%', maxWidth: 420, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box sx={{ bgcolor: 'primary.main', borderRadius: '50%', p: 1.5, mb: 2 }}>
            <LockOutlined sx={{ color: 'white' }} />
          </Box>
          <Typography variant="h5" fontWeight={700}>Connexion</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Connectez-vous à votre espace AgileFlow
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Adresse email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required fullWidth autoComplete="email"
          />
          <TextField
            label="Mot de passe" type={showPassword ? 'text' : 'password'}
            value={password} onChange={(e) => setPassword(e.target.value)}
            required fullWidth autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ mt: 1, py: 1.5 }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Se connecter'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}>ou</Divider>

        <Stack spacing={1.5}>
          <Button
            type="button"
            variant="outlined"
            fullWidth
            startIcon={<Google />}
            onClick={() => handleOAuthLogin('google')}
          >
            Continuer avec Google
          </Button>
          <Button
            type="button"
            variant="outlined"
            fullWidth
            startIcon={<GitHub />}
            onClick={() => handleOAuthLogin('github')}
          >
            Continuer avec GitHub
          </Button>
        </Stack>

        <Typography variant="body2" align="center" sx={{ mt: 3 }}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 600 }}>
            Créer un compte
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage;
