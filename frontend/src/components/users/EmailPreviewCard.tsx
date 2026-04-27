import { Card, CardContent, Divider, Typography } from '@mui/material';
import type { EmailPreview } from '../../types';

type Props = {
  preview: EmailPreview | null;
};

const EmailPreviewCard = ({ preview }: Props) => {
  if (!preview) {
    return null;
  }

  return (
    <Card variant="outlined" data-testid="email-preview-card">
      <CardContent>
        <Typography variant="overline" color="text.secondary">Apercu email</Typography>
        <Typography variant="h6" sx={{ mb: 1 }}>{preview.subject}</Typography>
        <Divider sx={{ mb: 2 }} />
        <div dangerouslySetInnerHTML={{ __html: preview.html }} />
      </CardContent>
    </Card>
  );
};

export default EmailPreviewCard;
