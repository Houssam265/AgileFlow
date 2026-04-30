import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { SendRounded } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { createTaskComment, fetchTaskComments } from '../../api/tasksApi';
import { fetchTeamMembers } from '../../api/teamsApi';
import type { CommentItem, TaskItem, TaskPriorite, UpdateTaskPayload, UserListItem } from '../../types';

type Props = {
  open: boolean;
  saving: boolean;
  task: TaskItem | null;
  users: UserListItem[];
  onClose: () => void;
  onSubmit: (taskId: number, payload: UpdateTaskPayload) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
  canManage: boolean;
  projectTeamId?: number | null;
};

type MentionOption = UserListItem & {
  mentionKey: string;
  fullName: string;
};

const avatarPalette = [
  '#2563eb',
  '#7c3aed',
  '#0f766e',
  '#c2410c',
  '#be185d',
  '#1d4ed8',
];

const getInitials = (user: UserListItem) =>
  `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || user.email?.[0]?.toUpperCase() || '?';

const getAvatarColor = (seed: string) => {
  const value = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarPalette[value % avatarPalette.length];
};

const buildMentionKey = (user: UserListItem) => {
  const localPart = user.email.split('@')[0] ?? '';
  const normalized = localPart
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
  return normalized || `user_${user.id}`;
};

const fullName = (user: UserListItem) => `${user.firstName} ${user.lastName}`.trim();

const relativeDate = (value: string | null) => {
  if (!value) return 'à l’instant';
  const date = new Date(value);
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];
  const formatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds || unit === 'second') {
      return formatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return 'à l’instant';
};

const getActiveMention = (value: string, caretPosition: number) => {
  const beforeCaret = value.slice(0, caretPosition);
  const match = beforeCaret.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
  if (!match) return null;
  return {
    start: beforeCaret.lastIndexOf('@'),
    end: caretPosition,
    query: match[1].toLowerCase(),
  };
};

const TaskDetailModal = ({ open, saving, task, users, onClose, onSubmit, onDelete, canManage, projectTeamId }: Props) => {
  const [form, setForm] = useState<UpdateTaskPayload | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [teamMembers, setTeamMembers] = useState<UserListItem[]>([]);
  const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(null);
  const [mentionState, setMentionState] = useState<{ start: number; end: number; query: string } | null>(null);
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open && task) {
      setForm({
        titre: task.titre,
        description: task.description ?? '',
        priorite: task.priorite,
        assignedToId: task.assignedToId ?? null,
        dateEcheance: task.dateEcheance ?? null,
        labels: task.labels ?? [],
      });
      setLabelInput('');
    }
  }, [open, task]);

  const currentForm = form ?? {
    titre: task?.titre ?? '',
    description: task?.description ?? '',
    priorite: task?.priorite ?? 'MEDIUM',
    assignedToId: task?.assignedToId ?? null,
    dateEcheance: task?.dateEcheance ?? null,
    labels: task?.labels ?? [],
  };

  useEffect(() => {
    if (!open || !task) {
      setComments([]);
      setCommentsError(null);
      setCommentDraft('');
      setMentionState(null);
      return;
    }

    let active = true;
    setCommentsLoading(true);
    setCommentsError(null);
    fetchTaskComments(task.id)
      .then((data) => {
        if (!active) return;
        setComments(data);
      })
      .catch(() => {
        if (!active) return;
        setCommentsError('Impossible de charger les commentaires.');
      })
      .finally(() => {
        if (active) setCommentsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, task]);

  useEffect(() => {
    if (!open || !projectTeamId) {
      setTeamMembers([]);
      return;
    }

    let active = true;
    fetchTeamMembers(projectTeamId)
      .then((data) => {
        if (!active) return;
        setTeamMembers(data);
      })
      .catch(() => {
        if (!active) return;
        setTeamMembers([]);
      });

    return () => {
      active = false;
    };
  }, [open, projectTeamId]);

  const mentionOptions = useMemo<MentionOption[]>(
    () => teamMembers.map((member) => ({
      ...member,
      mentionKey: buildMentionKey(member),
      fullName: fullName(member),
    })),
    [teamMembers],
  );

  const mentionMap = useMemo(
    () => new Map(mentionOptions.map((member) => [member.mentionKey, member])),
    [mentionOptions],
  );

  const filteredMentionOptions = useMemo(() => {
    if (!mentionState) return [];
    return mentionOptions.filter((member) =>
      member.mentionKey.includes(mentionState.query) || member.fullName.toLowerCase().includes(mentionState.query),
    );
  }, [mentionOptions, mentionState]);

  if (!open || !task) return null;

  const handleChange = <K extends keyof UpdateTaskPayload>(key: K, value: UpdateTaskPayload[K]) => {
    setForm((current) => ({ ...(current || currentForm), [key]: value }));
  };

  const handleAddLabel = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && labelInput.trim() && canManage) {
      e.preventDefault();
      const newLabel = labelInput.trim();
      if (!currentForm.labels?.includes(newLabel)) {
        handleChange('labels', [...(currentForm.labels || []), newLabel]);
      }
      setLabelInput('');
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    if (!canManage) return;
    handleChange('labels', currentForm.labels?.filter((l) => l !== labelToRemove));
  };

  const handleSubmit = async () => {
    await onSubmit(task.id, {
      ...currentForm,
      description: currentForm.description?.trim() || undefined,
    });
  };

  const handleCommentInputChange = (value: string, caretOverride?: number | null) => {
    setCommentDraft(value);
    const caretPosition = caretOverride ?? commentInputRef.current?.selectionStart ?? value.length;
    setMentionState(getActiveMention(value, caretPosition));
  };

  const handleSelectMention = (member: MentionOption | null) => {
    if (!member || !mentionState) return;
    const nextValue = `${commentDraft.slice(0, mentionState.start)}@${member.mentionKey} ${commentDraft.slice(mentionState.end)}`;
    setCommentDraft(nextValue);
    setMentionState(null);
    window.setTimeout(() => {
      commentInputRef.current?.focus();
      const nextCursor = mentionState.start + member.mentionKey.length + 2;
      commentInputRef.current?.setSelectionRange(nextCursor, nextCursor);
    }, 0);
  };

  const handleCreateComment = async () => {
    if (!task || !commentDraft.trim()) return;
    setPostingComment(true);
    try {
      const created = await createTaskComment(task.id, commentDraft.trim());
      setComments((current) => [...current, created]);
      setCommentDraft('');
      setMentionState(null);
      setHighlightedCommentId(created.id);
      window.setTimeout(() => setHighlightedCommentId((current) => (current === created.id ? null : current)), 1200);
    } catch {
      setCommentsError('Impossible d’ajouter le commentaire.');
    } finally {
      setPostingComment(false);
    }
  };

  const renderCommentContent = (content: string) => {
    const parts = content.split(/(@[a-zA-Z0-9_]+)/g);
    return parts.map((part, index) => {
      if (!part.startsWith('@')) {
        return <Box component="span" key={`${part}-${index}`}>{part}</Box>;
      }
      const mentionKey = part.slice(1).toLowerCase();
      const member = mentionMap.get(mentionKey);
      if (!member) {
        return (
          <Box component="span" key={`${part}-${index}`} sx={{ color: 'primary.main', fontWeight: 700 }}>
            {part}
          </Box>
        );
      }
      return (
        <Link
          key={`${part}-${index}`}
          component={RouterLink}
          to={`/users/${member.id}`}
          underline="hover"
          sx={{ color: 'primary.main', fontWeight: 700 }}
        >
          {part}
        </Link>
      );
    });
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Détails de la tâche</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Titre"
            value={currentForm.titre}
            onChange={(event) => handleChange('titre', event.target.value)}
            fullWidth
            required
            disabled={!canManage}
          />
          <TextField
            label="Description"
            value={currentForm.description ?? ''}
            onChange={(event) => handleChange('description', event.target.value)}
            multiline
            minRows={3}
            fullWidth
            disabled={!canManage}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth disabled={!canManage}>
              <InputLabel id="edit-task-priority-label">Priorité</InputLabel>
              <Select
                labelId="edit-task-priority-label"
                label="Priorité"
                value={currentForm.priorite || 'MEDIUM'}
                onChange={(event) => handleChange('priorite', event.target.value as TaskPriorite)}
              >
                <MenuItem value="LOW">Faible</MenuItem>
                <MenuItem value="MEDIUM">Moyenne</MenuItem>
                <MenuItem value="HIGH">Haute</MenuItem>
                <MenuItem value="CRITICAL">Critique</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth disabled={!canManage}>
              <InputLabel id="edit-task-assignee-label">Assigné à</InputLabel>
              <Select
                labelId="edit-task-assignee-label"
                label="Assigné à"
                value={currentForm.assignedToId || ''}
                onChange={(event) => handleChange('assignedToId', event.target.value === '' ? null : Number(event.target.value))}
              >
                <MenuItem value=""><em>Non assigné</em></MenuItem>
                {users.map(u => (
                  <MenuItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          
          <TextField
            label="Date d'échéance"
            type="date"
            value={currentForm.dateEcheance ?? ''}
            onChange={(event) => handleChange('dateEcheance', event.target.value || null)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            disabled={!canManage}
          />

          <Box>
            {canManage && (
              <TextField
                label="Étiquettes (Appuyez sur Entrée)"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={handleAddLabel}
                fullWidth
                size="small"
              />
            )}
            <Stack direction="row" flexWrap="wrap" gap={1} mt={canManage ? 1 : 0}>
              {currentForm.labels?.map(label => (
                <Chip 
                  key={label} 
                  label={label} 
                  onDelete={canManage ? () => handleRemoveLabel(label) : undefined} 
                />
              ))}
            </Stack>
          </Box>

          <Divider sx={{ pt: 1 }}>
            <Typography variant="overline" color="text.secondary" letterSpacing={1.1}>
              Collaboration
            </Typography>
          </Divider>

          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                Commentaires ({comments.length})
              </Typography>
              {!projectTeamId && (
                <Chip
                  size="small"
                  variant="outlined"
                  color="warning"
                  label="Aucune équipe rattachée au projet"
                />
              )}
            </Box>

            {commentsError && <Alert severity="error">{commentsError}</Alert>}

            <Stack
              spacing={1.5}
              sx={{
                maxHeight: 280,
                overflowY: 'auto',
                pr: 0.5,
                '@keyframes comment-pop': {
                  from: { opacity: 0, transform: 'translateY(8px) scale(0.98)' },
                  to: { opacity: 1, transform: 'translateY(0) scale(1)' },
                },
              }}
            >
              {commentsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : comments.length === 0 ? (
                <Paper
                  variant="outlined"
                  sx={{ p: 2.5, borderRadius: 3, bgcolor: 'grey.50' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Aucun commentaire pour l’instant. Lancez la discussion avec votre équipe.
                  </Typography>
                </Paper>
              ) : (
                comments.map((comment) => {
                  const authorName = fullName(comment.auteur);
                  return (
                    <Paper
                    key={comment.id}
                    variant="elevation"
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 4,
                      border: comment.id === highlightedCommentId ? '1px solid' : '1px solid',
                      borderColor: comment.id === highlightedCommentId ? 'primary.light' : 'divider',
                      bgcolor: comment.id === highlightedCommentId ? 'primary.50' : 'grey.50',
                      animation: comment.id === highlightedCommentId ? 'comment-pop 360ms ease-out' : 'none',
                    }}
                  >
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: getAvatarColor(authorName || comment.auteur.email),
                            fontWeight: 700,
                          }}
                        >
                          {getInitials(comment.auteur)}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={0.75}
                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                            justifyContent="space-between"
                          >
                            <Typography variant="subtitle2" fontWeight={700}>
                              {authorName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {relativeDate(comment.createdAt)}
                            </Typography>
                          </Stack>
                          <Typography
                            variant="body2"
                            sx={{ mt: 0.75, whiteSpace: 'pre-wrap', lineHeight: 1.65, wordBreak: 'break-word' }}
                            component="div"
                          >
                            {renderCommentContent(comment.contenu)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  );
                })
              )}
            </Stack>

            <Paper
              variant="elevation"
              elevation={1}
              sx={{
                p: 1.5,
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="flex-end">
                <Autocomplete
                  fullWidth
                  freeSolo
                  options={filteredMentionOptions}
                  value={null}
                  open={!!mentionState && filteredMentionOptions.length > 0}
                  inputValue={commentDraft}
                  onChange={(_, value) => handleSelectMention(value as MentionOption | null)}
                  filterOptions={(options) => options}
                  getOptionLabel={(option) => (typeof option === 'string' ? option : option.fullName)}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id}>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar sx={{ width: 30, height: 30, bgcolor: getAvatarColor(option.fullName), fontSize: 13 }}>
                          {getInitials(option)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{option.fullName}</Typography>
                          <Typography variant="caption" color="text.secondary">@{option.mentionKey}</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Ajouter un commentaire... utilisez @ pour mentionner"
                      inputRef={commentInputRef}
                      onChange={(event) => handleCommentInputChange(event.target.value, event.target.selectionStart)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !mentionState) {
                          event.preventDefault();
                          void handleCreateComment();
                        }
                      }}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          bgcolor: 'grey.50',
                        },
                      }}
                    />
                  )}
                />
                <IconButton
                  color="primary"
                  onClick={() => void handleCreateComment()}
                  disabled={postingComment || !commentDraft.trim()}
                  sx={{
                    alignSelf: 'stretch',
                    borderRadius: 3,
                    px: 2,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
                  }}
                >
                  {postingComment ? <CircularProgress size={18} color="inherit" /> : <SendRounded fontSize="medium" />}
                </IconButton>
              </Stack>
            </Paper>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Box>
          {canManage && (
            <Button color="error" onClick={() => onDelete(task.id)} disabled={saving}>
              Supprimer
            </Button>
          )}
        </Box>
        <Box>
          <Button onClick={onClose} disabled={saving}>Annuler</Button>
          {canManage && (
            <Button onClick={handleSubmit} variant="contained" disabled={saving || !currentForm.titre.trim()}>
              Enregistrer
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailModal;
