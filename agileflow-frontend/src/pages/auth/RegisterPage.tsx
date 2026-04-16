import { Box, TextField, Button, Typography, Paper } from '@mui/material';

const RegisterPage = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'grey.100',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: 400 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Créer un compte
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Rejoignez la plateforme AgileFlow
        </Typography>
        
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Prénom"
            variant="outlined"
            fullWidth
            required
          />
          <TextField
            label="Nom"
            variant="outlined"
            fullWidth
            required
          />
          <TextField
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            required
          />
          <TextField
            label="Mot de passe"
            type="password"
            variant="outlined"
            fullWidth
            required
          />
          <TextField
            label="Confirmer le mot de passe"
            type="password"
            variant="outlined"
            fullWidth
            required
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            sx={{ mt: 2 }}
          >
            Créer le compte
          </Button>
        </Box>
        
        <Typography variant="body2" align="center" sx={{ mt: 3 }}>
          Déjà un compte ?{' '}
          <Button href="/login" color="primary">
            Se connecter
          </Button>
        </Typography>
      </Paper>
    </Box>
  );
};

export default RegisterPage;