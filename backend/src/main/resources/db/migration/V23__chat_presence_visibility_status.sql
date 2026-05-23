ALTER TABLE chat_presence
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ABSENT';

UPDATE chat_presence SET status = 'LIVE' WHERE is_online = TRUE;
UPDATE chat_presence SET status = 'ABSENT' WHERE is_online = FALSE;
