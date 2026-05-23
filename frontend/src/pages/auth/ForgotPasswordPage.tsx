import { useEffect, useState } from 'react';
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
  LockResetOutlined,
  MarkEmailReadOutlined,
  PinOutlined,
  Refresh,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/axiosInterceptor';
import {
  getPasswordChecks,
  PASSWORD_REQUIREMENTS_TEXT,
  passwordMeetsPolicy,
  passwordStrengthLabel,
} from '../../utils/passwordPolicy';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

type Step = 'email' | 'otp' | 'password';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const checks = getPasswordChecks(newPassword);
  const strength = passwordStrengthLabel(newPassword);

  useEffect(() => {
    if (step !== 'password' || !success.includes('reinitialise')) return;
    const timer = window.setTimeout(() => navigate('/login', { replace: true }), 2000);
    return () => window.clearTimeout(timer);
  }, [step, success, navigate]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!emailRegex.test(email.trim())) {
      setError("Format d'email invalide.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setStep('otp');
      setOtp('');
      setSuccess(data.message || 'Un code a ete envoye a votre adresse email.');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Impossible d'envoyer le code pour le moment.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResendLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password/resend', { email: email.trim() });
      setSuccess(data.message || 'Un nouveau code a ete envoye.');
      setOtp('');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Impossible de renvoyer le code.";
      setError(message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (otp.length !== 6) {
      setError('Le code doit contenir 6 chiffres.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-reset-otp', { email: email.trim(), otp });
      setStep('password');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(data.message || 'Code verifie. Definissez votre nouveau mot de passe.');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Code incorrect ou expire.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!passwordMeetsPolicy(newPassword)) {
      setError(PASSWORD_REQUIREMENTS_TEXT);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        email: email.trim(),
        newPassword,
        confirmPassword,
      });
      setSuccess(data.message || 'Mot de passe reinitialise avec succes.');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Impossible de reinitialiser le mot de passe.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const resetToEmail = () => {
    setStep('email');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const title =
    step === 'email'
      ? 'Mot de passe oublie'
      : step === 'otp'
        ? 'Verifier le code'
        : 'Nouveau mot de passe';

  const subtitle =
    step === 'email'
      ? 'Recevez un code par email pour reinitialiser votre acces'
      : step === 'otp'
        ? `Code envoye a ${email}`
        : success.includes('reinitialise')
          ? 'Redirection vers la connexion...'
          : 'Choisissez un nouveau mot de passe securise';

  const renderEmailStep = () => (
    <Box component="form" onSubmit={handleRequestCode} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Adresse email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
        autoComplete="email"
      />
      <Typography variant="body2" color="text.secondary">
        Nous vous enverrons un code a 6 chiffres par email (valide 10 minutes).
      </Typography>
      <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ py: 1.5 }}>
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Envoyer le code'}
      </Button>
    </Box>
  );

  const renderOtpStep = () => (
    <Box component="form" onSubmit={handleVerifyOtp} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Code recu par email"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        required
        fullWidth
        autoFocus
        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
        helperText="Code a 6 chiffres"
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={loading || otp.length !== 6}
        sx={{ py: 1.5 }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Verifier le code'}
      </Button>
      <Button type="button" variant="text" startIcon={<Refresh />} disabled={resendLoading} onClick={handleResend}>
        {resendLoading ? 'Envoi...' : 'Renvoyer le code'}
      </Button>
      <Button type="button" variant="text" onClick={resetToEmail}>
        Changer d&apos;email
      </Button>
    </Box>
  );

  const renderPasswordStep = () => (
    <Box component="form" onSubmit={handleReset} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Nouveau mot de passe"
        type={showPass ? 'text' : 'password'}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        fullWidth
        autoComplete="new-password"
        helperText={PASSWORD_REQUIREMENTS_TEXT}
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
      {newPassword && (
        <Typography variant="caption" color={passwordMeetsPolicy(newPassword) ? 'success.main' : 'text.secondary'}>
          Force : {strength} —{' '}
          {[
            checks.length && '8+ car.',
            checks.upper && 'majuscule',
            checks.lower && 'minuscule',
            checks.digit && 'chiffre',
            checks.special && 'special',
          ]
            .filter(Boolean)
            .join(', ')}
        </Typography>
      )}
      <TextField
        label="Confirmer le mot de passe"
        type={showConfirm ? 'text' : 'password'}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        fullWidth
        autoComplete="new-password"
        error={confirmPassword.length > 0 && confirmPassword !== newPassword}
        helperText={
          confirmPassword.length > 0 && confirmPassword !== newPassword
            ? 'Les mots de passe ne correspondent pas'
            : ' '
        }
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end">
                {showConfirm ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={
          loading ||
          success.includes('reinitialise') ||
          !passwordMeetsPolicy(newPassword) ||
          newPassword !== confirmPassword
        }
        sx={{ py: 1.5 }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Reinitialiser le mot de passe'}
      </Button>
    </Box>
  );

  const StepIcon = step === 'otp' ? PinOutlined : step === 'password' && success.includes('reinitialise') ? MarkEmailReadOutlined : LockResetOutlined;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'grey.100' }}>
      <Paper elevation={4} sx={{ p: 5, width: '100%', maxWidth: 440, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              bgcolor: success.includes('reinitialise') ? 'success.main' : 'primary.main',
              borderRadius: '50%',
              p: 1.5,
              mb: 2,
            }}
          >
            <StepIcon sx={{ color: 'white' }} />
          </Box>
          <Typography variant="h5" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5} textAlign="center">
            {subtitle}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {step === 'email' && renderEmailStep()}
        {step === 'otp' && renderOtpStep()}
        {step === 'password' && !success.includes('reinitialise') && renderPasswordStep()}

        {!success.includes('reinitialise') && (
          <Typography variant="body2" align="center" sx={{ mt: 3 }}>
            <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 600 }}>
              Retour a la connexion
            </Link>
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default ForgotPasswordPage;
