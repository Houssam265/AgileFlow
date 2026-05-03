ALTER TABLE tasks
MODIFY COLUMN date_echeance DATETIME NULL;

ALTER TABLE tasks
ADD COLUMN deadline24h_reminder_sent BIT(1) NOT NULL DEFAULT b'0',
ADD COLUMN deadline1h_reminder_sent BIT(1) NOT NULL DEFAULT b'0';

UPDATE tasks
SET is_urgent = b'0'
WHERE statut = 'DONE';
