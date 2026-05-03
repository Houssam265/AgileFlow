ALTER TABLE tasks
ADD COLUMN is_urgent BIT(1) NOT NULL DEFAULT b'0';

UPDATE tasks
SET is_urgent = b'1'
WHERE date_echeance IS NOT NULL
  AND date_echeance <= (CURRENT_DATE + INTERVAL 1 DAY)
  AND statut <> 'DONE';
