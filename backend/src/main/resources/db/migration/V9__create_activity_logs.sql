CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    actor_id BIGINT NOT NULL,
    project_id BIGINT NULL,
    sprint_id BIGINT NULL,
    task_id BIGINT NULL,
    action VARCHAR(50) NOT NULL,
    message VARCHAR(500) NULL,
    activity_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

SET @schema_name = DATABASE();

SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'activity_logs'
      AND index_name = 'idx_activity_logs_date'
);
SET @sql_stmt = IF(
    @idx_exists = 0,
    'CREATE INDEX idx_activity_logs_date ON activity_logs (activity_date)',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'activity_logs'
      AND index_name = 'idx_activity_logs_actor'
);
SET @sql_stmt = IF(
    @idx_exists = 0,
    'CREATE INDEX idx_activity_logs_actor ON activity_logs (actor_id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'activity_logs'
      AND index_name = 'idx_activity_logs_project'
);
SET @sql_stmt = IF(
    @idx_exists = 0,
    'CREATE INDEX idx_activity_logs_project ON activity_logs (project_id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'activity_logs'
      AND index_name = 'idx_activity_logs_sprint'
);
SET @sql_stmt = IF(
    @idx_exists = 0,
    'CREATE INDEX idx_activity_logs_sprint ON activity_logs (sprint_id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
