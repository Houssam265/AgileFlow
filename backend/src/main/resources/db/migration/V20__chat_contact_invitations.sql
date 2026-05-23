CREATE TABLE chat_contact_invitations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  requester_id BIGINT NOT NULL,
  recipient_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP NULL,
  CONSTRAINT uk_chat_contact_pair UNIQUE (requester_id, recipient_id),
  CONSTRAINT fk_chat_contact_requester FOREIGN KEY (requester_id) REFERENCES users(id),
  CONSTRAINT fk_chat_contact_recipient FOREIGN KEY (recipient_id) REFERENCES users(id)
);

CREATE INDEX idx_chat_contact_recipient_status ON chat_contact_invitations (recipient_id, status);
CREATE INDEX idx_chat_contact_requester_status ON chat_contact_invitations (requester_id, status);
