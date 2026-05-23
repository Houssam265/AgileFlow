ALTER TABLE users
  ADD COLUMN password_reset_otp_hash VARCHAR(255) NULL,
  ADD COLUMN password_reset_otp_expires_at TIMESTAMP NULL;
