import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { GroupAdd } from '@mui/icons-material';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  acceptProjectInvitation,
  previewProjectInvitation,
  rejectProjectInvitationByToken,
} from '../../api/projectsApi';
import { useAuth } from '../../context/AuthContext';
import type { ProjectInvitationPreview } from '../../types';

const ProjectInvitePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const { token: authToken } = useAuth();

  const [preview, setPreview] = useState<ProjectInvitationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Lien d\'invitation invalide.');
      setLoading(false);
      return;
    }
    previewProjectInvitation(token)
      .then(setPreview)
      .catch(() => setError('Invitation introuvable.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleReject = async () => {
    if (!authToken) {
      navigate(`/login?redirect=${encodeURIComponent(`/project-invite?token=${token}`)}`);
      return;
    }
    setRejecting(true);
    setError('');
    try {
      await rejectProjectInvitationByToken(token);
      setSuccess('Invitation refusee.');
      setTimeout(() => navigate('/projects', { replace: true }), 2000);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Impossible de refuser l'invitation.";
      setError(message);
    } finally {
      setRejecting(false);
    }
  };

  const handleAccept = async () => {
    if (!authToken) {
      navigate(`/login?redirect=${encodeURIComponent(`/project-invite?token=${token}`)}`);
      return;
    }
    setAccepting(true);
    setError('');
    try {
      await acceptProjectInvitation(token);
      setSuccess('Invitation acceptee. Vous avez rejoint le projet.');
      setTimeout(() => navigate('/projects', { replace: true }), 2000);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Impossible d\'accepter l\'invitation.';
      setError(message);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'grey.100', p: 2 }}>
      <Paper elevation={4} sx={{ p: 4, maxWidth: 480, width: '100%', borderRadius: 3, textAlign: 'center' }}>
        <GroupAdd sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>Invitation projet</Typography>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>{success}</Alert>}
            {preview && !success && (
              <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
                <strong>{preview.ownerName}</strong> vous invite au projet <strong>{preview.projectName}</strong>
                <br />
                Email invite : {preview.invitedEmail}
              </Alert>
            )}
            {preview?.expired && <Alert severity="warning" sx={{ mb: 2 }}>Cette invitation a expire.</Alert>}
            {preview?.alreadyAccepted && <Alert severity="success" sx={{ mb: 2 }}>Deja acceptee.</Alert>}

            {!preview?.expired && !preview?.alreadyAccepted && !success && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={accepting || rejecting || !!error}
                  onClick={handleAccept}
                >
                  {accepting ? <CircularProgress size={24} color="inherit" /> : authToken ? 'Accepter l\'invitation' : 'Se connecter pour accepter'}
                </Button>
                {authToken && (
                  <Button
                    variant="outlined"
                    color="inherit"
                    fullWidth
                    disabled={accepting || rejecting}
                    onClick={handleReject}
                  >
                    {rejecting ? <CircularProgress size={24} /> : 'Refuser l\'invitation'}
                  </Button>
                )}
              </Box>
            )}

            <Button component={Link} to="/projects" fullWidth>
              Voir mes projets
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ProjectInvitePage;
