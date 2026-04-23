import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import type { SprintItem, SprintPayload } from '../../api/sprintsApi';

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: SprintPayload, existing?: SprintItem | null) => Promise<void>;
  projetId: number;
  initialSprint?: SprintItem | null;
};

const SprintPlanningModal = ({ open, onClose, onSave, projetId, initialSprint }: Props) => {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [capacitePoints, setCapacitePoints] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialSprint) {
      setNom(initialSprint.nom);
      setDescription(initialSprint.description ?? '');
      setDateDebut(initialSprint.dateDebut ?? '');
      setDateFin(initialSprint.dateFin ?? '');
      setCapacitePoints(initialSprint.capacitePoints != null ? String(initialSprint.capacitePoints) : '');
    } else {
      setNom('');
      setDescription('');
      setDateDebut('');
      setDateFin('');
      setCapacitePoints('');
    }
  }, [initialSprint, open]);

  const handleSave = async () => {
    if (!nom.trim() || !dateDebut) {
      return;
    }
    const payload: SprintPayload = {
      nom: nom.trim(),
      description: description.trim() || null,
      dateDebut,
      dateFin: dateFin || null,
      capacitePoints: capacitePoints ? Number(capacitePoints) : null,
      projetId,
    };
    setSaving(true);
    try {
      await onSave(payload, initialSprint ?? null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialSprint ? 'Modifier le sprint' : 'Nouveau sprint'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Nom du sprint"
            fullWidth
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
          <TextField
            label="Description / objectif"
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Date de debut"
              type="date"
              fullWidth
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Date de fin"
              type="date"
              fullWidth
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
          <TextField
            label="Capacite (points)"
            type="number"
            fullWidth
            value={capacitePoints}
            onChange={(e) => setCapacitePoints(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving || !nom.trim() || !dateDebut}>
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SprintPlanningModal;
