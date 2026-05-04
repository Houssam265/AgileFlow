CREATE TABLE chat_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sender_id BIGINT NOT NULL,
  channel_type ENUM('GLOBAL', 'PROJECT', 'PRIVATE') NOT NULL,
  project_id BIGINT,
  recipient_id BIGINT,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_sender FOREIGN KEY (sender_id) REFERENCES users(id),
  CONSTRAINT fk_chat_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_chat_recipient FOREIGN KEY (recipient_id) REFERENCES users(id)
);

CREATE TABLE chat_presence (
  user_id BIGINT PRIMARY KEY,
  last_seen TIMESTAMP,
  is_online BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_presence_user FOREIGN KEY (user_id) REFERENCES users(id)
);
