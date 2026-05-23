CREATE TABLE project_members (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_project_member UNIQUE (project_id, user_id),
  CONSTRAINT fk_project_member_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_project_member_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE project_invitations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT NOT NULL,
  invited_by_id BIGINT NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  accepted_user_id BIGINT NULL,
  CONSTRAINT fk_project_invitation_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_project_invitation_inviter FOREIGN KEY (invited_by_id) REFERENCES users(id),
  CONSTRAINT fk_project_invitation_accepted_user FOREIGN KEY (accepted_user_id) REFERENCES users(id)
);

UPDATE users SET role = 'ROLE_DEVELOPER' WHERE role = 'ROLE_MANAGER';
