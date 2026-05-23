import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {
  Cancel,
  CheckCircle,
  MarkEmailReadOutlined,
  PersonAddOutlined,
  Refresh,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/axiosInterceptor';
import { useAuth } from '../../context/AuthContext';
import { passwordMeetsPolicy, PASSWORD_REQUIREMENTS_TEXT } from '../../utils/passwordPolicy';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const homeForRole = (role: string) => (role === 'ROLE_ADMIN' ? '/admin' : '/dashboard');

const RegisterPage = () => {
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', password: '', confirm: '' });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const navigate = useNavigate();
  const { setAuth } = useAuth();

  useEffect(() => {
    if (otpSent) return;

    const checkEmail = async () => {
      if (!form.email) {
        setEmailError('');
        return;
      }
      if (!emailRegex.test(form.email)) {
        setEmailError("Format d'email invalide.");
        return;
      }

      const domain = form.email.split('@')[1]?.toLowerCase();
      const typos = ['gail.co', 'gml.co', 'gmail.co', 'gmal.com', 'gamil.com', 'gmil.com'];
      if (typos.includes(domain)) {
        setEmailError('Domaine invalide. Voulez-vous dire gmail.com ?');
        return;
      }

      setCheckingEmail(true);
      try {
        const { data } = await api.get(`/auth/check-email?email=${encodeURIComponent(form.email)}`);
        setEmailError(data.available ? '' : 'Cet email est deja utilise.');
      } catch (err) {
        console.error("Erreur de validation de l'email.", err);
      } finally {
        setCheckingEmail(false);
      }
    };

    const timer = setTimeout(checkEmail, 500);
    return () => clearTimeout(timer);
  }, [form.email, otpSent]);

  const evaluatePassword = (pass: string) => {
    let score = 0;
    if (!pass) {
      setPasswordStrength(0);
      return;
    }
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    setPasswordStrength(Math.min(4, score));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    if (e.target.name === 'password') {
      evaluatePassword(e.target.value);
    }
  };

  const getPwdColor = () => {
    if (passwordStrength === 0) return 'grey.300';
    if (passwordStrength === 1) return 'error.main';
    if (passwordStrength === 2) return 'warning.main';
    if (passwordStrength === 3) return 'info.main';
    return 'success.main';
  };

  const getPwdLabel = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength === 1) return 'Faible';
    if (passwordStrength === 2) return 'Moyen';
    if (passwordStrength === 3) return 'Bon';
    return 'Fort';
  };

  const validate = () => {
    if (emailError) return "Veuillez corriger l'adresse email.";
    if (!emailRegex.test(form.email)) return "Format d'email invalide.";
    if (!passwordMeetsPolicy(form.password)) return PASSWORD_REQUIREMENTS_TEXT;
    if (form.password !== form.confirm) return 'Les mots de passe ne correspondent pas.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        password: form.password,
      });
      setOtpSent(true);
      setOtp('');
      setSuccess(data.message || 'Un code OTP a ete envoye a votre email.');
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-email', {
        email: form.email,
        otp,
      });
      setAuth(data.accessToken, {
        id: data.userId,
        email: data.email,
        role: data.role,
        firstName: data.prenom ?? form.prenom,
        lastName: data.nom ?? form.nom,
      }, data.refreshToken);
      navigate(homeForRole(data.role), { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Code OTP incorrect ou expire.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setResendLoading(true);
    try {
      const { data } = await api.post('/auth/resend-verification', { email: form.email });
      setSuccess(data.message || 'Un nouveau code OTP a ete envoye.');
      setOtp('');
    } catch (err: any) {
      setError(err.response?.data?.message || "Impossible de renvoyer le code.");
    } finally {
      setResendLoading(false);
    }
  };

  const renderRegisterForm = () => (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField label="Prenom" name="prenom" value={form.prenom} onChange={handleChange} required fullWidth />
        <TextField label="Nom" name="nom" value={form.nom} onChange={handleChange} required fullWidth />
      </Box>

      <TextField
        label="Adresse email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        required
        fullWidth
        error={!!emailError}
        helperText={emailError || ''}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {checkingEmail && <CircularProgress size={20} />}
              {!checkingEmail && emailError && <Cancel color="error" />}
              {!checkingEmail && !emailError && form.email && emailRegex.test(form.email) && <CheckCircle color="success" />}
            </InputAdornment>
          ),
        }}
      />

      <Box>
        <TextField
          label="Mot de passe"
          name="password"
          type={showPass ? 'text' : 'password'}
          value={form.password}
          onChange={handleChange}
          required
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPass(!showPass)} edge="end">
                  {showPass ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {form.password && (
          <Box sx={{ mt: 1, px: 0.5 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
              {[1, 2, 3, 4].map((idx) => (
                <Box
                  key={idx}
                  sx={{
                    height: 4,
                    flex: 1,
                    borderRadius: 2,
                    bgcolor: passwordStrength >= idx ? getPwdColor() : 'grey.300',
                    transition: 'background-color 0.3s',
                  }}
                />
              ))}
            </Box>
            <Typography variant="caption" color={getPwdColor()} fontWeight={600}>
              Force: {getPwdLabel()}
            </Typography>
          </Box>
        )}
      </Box>

      <TextField
        label="Confirmer le mot de passe"
        name="confirm"
        type="password"
        value={form.confirm}
        onChange={handleChange}
        required
        fullWidth
        error={form.confirm.length > 0 && form.password !== form.confirm}
        helperText={form.confirm.length > 0 && form.password !== form.confirm ? 'Les mots de passe ne correspondent pas' : ''}
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={loading || checkingEmail || !!emailError || !passwordMeetsPolicy(form.password) || form.password !== form.confirm}
        sx={{ mt: 1, py: 1.5 }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Envoyer le code OTP'}
      </Button>
    </Box>
  );

  const renderOtpForm = () => (
    <Box component="form" onSubmit={handleVerify} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        Entrez le code a 6 chiffres envoye a {form.email}.
      </Typography>
      <TextField
        label="Code OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        required
        fullWidth
        autoFocus
        autoComplete="one-time-code"
        inputProps={{ inputMode: 'numeric', maxLength: 6 }}
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={loading || otp.length !== 6}
        sx={{ py: 1.5 }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Verifier et creer le compte'}
      </Button>
      <Button
        type="button"
        variant="outlined"
        fullWidth
        startIcon={resendLoading ? <CircularProgress size={18} /> : <Refresh />}
        disabled={resendLoading}
        onClick={handleResend}
      >
        Renvoyer le code
      </Button>
      <Button
        type="button"
        variant="text"
        onClick={() => {
          setOtpSent(false);
          setOtp('');
          setSuccess('');
          setError('');
        }}
      >
        Modifier l'email
      </Button>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'grey.100', py: 4 }}>
      <Paper elevation={4} sx={{ p: 5, width: '100%', maxWidth: 460, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box sx={{ bgcolor: otpSent ? 'success.main' : 'secondary.main', borderRadius: '50%', p: 1.5, mb: 2 }}>
            {otpSent ? <MarkEmailReadOutlined sx={{ color: 'white' }} /> : <PersonAddOutlined sx={{ color: 'white' }} />}
          </Box>
          <Typography variant="h5" fontWeight={700}>
            {otpSent ? 'Verifier votre email' : 'Creer un compte'}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {otpSent ? 'Validation par code OTP' : 'Rejoignez la plateforme AgileFlow'}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {otpSent ? renderOtpForm() : renderRegisterForm()}

        <Typography variant="body2" align="center" sx={{ mt: 3 }}>
          Vous avez deja un compte ?{' '}
          <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 600 }}>
            Se connecter
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default RegisterPage;
