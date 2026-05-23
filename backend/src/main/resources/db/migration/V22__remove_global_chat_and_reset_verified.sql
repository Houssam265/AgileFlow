DELETE FROM chat_messages WHERE channel_type = 'GLOBAL';

ALTER TABLE users
  ADD COLUMN password_reset_verified_until TIMESTAMP NULL;
