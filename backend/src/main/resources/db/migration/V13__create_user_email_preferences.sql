CREATE TABLE user_email_preferences (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    sprint_start_enabled BIT NOT NULL DEFAULT b'1',
    task_assigned_enabled BIT NOT NULL DEFAULT b'1',
    deadline_enabled BIT NOT NULL DEFAULT b'1',
    mention_enabled BIT NOT NULL DEFAULT b'1',
    PRIMARY KEY (id),
    CONSTRAINT uk_user_email_preferences_user UNIQUE (user_id),
    CONSTRAINT fk_user_email_preferences_user
        FOREIGN KEY (user_id) REFERENCES users (id)
);
