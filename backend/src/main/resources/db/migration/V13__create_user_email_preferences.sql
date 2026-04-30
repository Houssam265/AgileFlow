SET @schema_name = DATABASE();

SET @users_table_exists = (
    SELECT COUNT(1)
    FROM information_schema.tables
    WHERE table_schema = @schema_name
      AND table_name = 'users'
);

SET @preferences_table_exists = (
    SELECT COUNT(1)
    FROM information_schema.tables
    WHERE table_schema = @schema_name
      AND table_name = 'user_email_preferences'
);

SET @sql_stmt = IF(
    @users_table_exists = 1 AND @preferences_table_exists = 0,
    'CREATE TABLE user_email_preferences (
        id BIGINT NOT NULL AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        sprint_start_enabled BIT NOT NULL DEFAULT b''1'',
        task_assigned_enabled BIT NOT NULL DEFAULT b''1'',
        deadline_enabled BIT NOT NULL DEFAULT b''1'',
        mention_enabled BIT NOT NULL DEFAULT b''1'',
        PRIMARY KEY (id),
        CONSTRAINT uk_user_email_preferences_user UNIQUE (user_id),
        CONSTRAINT fk_user_email_preferences_user
            FOREIGN KEY (user_id) REFERENCES users (id)
    )',
    'SELECT 1'
);

PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
