ALTER TABLE project_invitations
  ADD COLUMN invited_user_id BIGINT NULL,
  ADD CONSTRAINT fk_project_invitation_invited_user FOREIGN KEY (invited_user_id) REFERENCES users(id);
