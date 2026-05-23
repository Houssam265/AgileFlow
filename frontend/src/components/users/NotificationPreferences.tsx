import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  fetchEmailPreview,
  fetchMyEmailPreferences,
  updateMyEmailPreferences,
} from '../../api/emailPreferencesApi';
import type {
  EmailNotificationType,
  EmailPreferences,
  EmailPreview,
  UpdateEmailPreferencesPayload,
} from '../../types';
import EmailPreviewCard from './EmailPreviewCard';
import { useAuth } from '../../context/AuthContext';

type PreferenceKey = keyof Omit<EmailPreferences, 'userId'>;

const OPTIONS: Array<{ key: PreferenceKey; type: EmailNotificationType; label: string; description: string }> = [
  { key: 'sprintStartEnabled', type: 'SPRINT_START', label: 'Demarrage de sprint', description: 'Recevoir un email quand un sprint commence.' },
  { key: 'taskAssignedEnabled', type: 'TASK_ASSIGNED', label: 'Tache assignee', description: 'Recevoir un email lors d une nouvelle assignation.' },
  { key: 'deadlineEnabled', type: 'DEADLINE', label: 'Rappel echeance', description: 'Recevoir un rappel avant la date limite d une tache.' },
  { key: 'mentionEnabled', type: 'MENTION', label: 'Mentions', description: 'Recevoir un email lorsqu un membre vous mentionne.' },
];

type Props = {
  title?: string;
  description?: string;
  embedded?: boolean;
};

const NotificationPreferences = ({
  title = 'Preferences email',
  description = 'Active ou coupe les emails automatiques par type de notification.',
  embedded = false,
}: Props) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [preview, setPreview] = useState<EmailPreview | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<EmailNotificationType>('SPRINT_START');
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<PreferenceKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSessionError = (status?: number) => {
    if (status === 401 || status === 403 || status === 404) {
      logout();
      navigate('/login', { replace: true });
      return true;
    }
    return false;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [prefs, previewData] = await Promise.all([
          fetchMyEmailPreferences(),
          fetchEmailPreview('SPRINT_START'),
        ]);
        setPreferences(prefs);
        setPreview(previewData);
      } catch (err: unknown) {
        const status = err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
        if (handleSessionError(status)) {
          return;
        }
        setError('Impossible de charger les preferences email.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const data = await fetchEmailPreview(selectedPreview);
        setPreview(data);
      } catch (err: unknown) {
        const status = err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
        if (handleSessionError(status)) {
          return;
        }
        setError('Impossible de charger l apercu email.');
      }
    };
    if (!loading) {
      loadPreview();
    }
  }, [selectedPreview, loading]);

  const labels = useMemo(
    () => new Map(OPTIONS.map((option) => [option.type, option.label])),
    []
  );

  const handleToggle = async (key: PreferenceKey, checked: boolean) => {
    const payload: UpdateEmailPreferencesPayload = { [key]: checked };
    setSavingKey(key);
    setError(null);
    try {
      const updated = await updateMyEmailPreferences(payload);
      setPreferences(updated);
    } catch (err: unknown) {
      const status = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;
      if (handleSessionError(status)) {
        return;
      }
      setError('Impossible de sauvegarder cette preference.');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!preferences) {
    return <Alert severity="error">{error ?? 'Preferences introuvables.'}</Alert>;
  }

  const content = (
    <>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{description}</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {OPTIONS.map((option) => (
            <Box key={option.type} sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(preferences[option.key])}
                    onChange={(_, checked) => handleToggle(option.key, checked)}
                    disabled={savingKey === option.key}
                  />
                }
                label={option.label}
              />
              <Typography variant="body2" color="text.secondary">
                {option.description}
              </Typography>
            </Box>
          ))}
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="preview-type-label">Type d email</InputLabel>
            <Select
              labelId="preview-type-label"
              label="Type d email"
              value={selectedPreview}
              onChange={(e) => setSelectedPreview(e.target.value as EmailNotificationType)}
            >
              {OPTIONS.map((option) => (
                <MenuItem key={option.type} value={option.type}>
                  {labels.get(option.type)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <EmailPreviewCard preview={preview} />
        </Grid>
      </Grid>
    </>
  );

  const paperSx = embedded
    ? { p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }
    : { p: 3, borderRadius: 2 };

  return (
    <Paper elevation={0} sx={paperSx} data-testid="notification-preferences">
      {content}
    </Paper>
  );
};

export default NotificationPreferences;
