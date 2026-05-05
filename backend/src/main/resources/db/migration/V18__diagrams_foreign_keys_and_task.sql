-- Align diagrams with JPA: optional task link + referential integrity (project, owner, task).

SET @schema_name = DATABASE();

SET @task_col = (
    SELECT COUNT(1)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'diagrams'
      AND COLUMN_NAME = 'task_id'
);
SET @sql_stmt = IF(
    @task_col = 0,
    'ALTER TABLE diagrams ADD COLUMN task_id BIGINT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'diagrams'
      AND INDEX_NAME = 'idx_diagrams_task'
);
SET @sql_stmt = IF(
    @idx_exists = 0,
    'CREATE INDEX idx_diagrams_task ON diagrams (task_id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
    SELECT COUNT(1)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = @schema_name
      AND TABLE_NAME = 'diagrams'
      AND CONSTRAINT_NAME = 'fk_diagrams_project'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_stmt = IF(
    @fk_exists = 0,
    'ALTER TABLE diagrams ADD CONSTRAINT fk_diagrams_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
    SELECT COUNT(1)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = @schema_name
      AND TABLE_NAME = 'diagrams'
      AND CONSTRAINT_NAME = 'fk_diagrams_owner'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_stmt = IF(
    @fk_exists = 0,
    'ALTER TABLE diagrams ADD CONSTRAINT fk_diagrams_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE RESTRICT',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
    SELECT COUNT(1)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = @schema_name
      AND TABLE_NAME = 'diagrams'
      AND CONSTRAINT_NAME = 'fk_diagrams_task_ref'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_stmt = IF(
    @fk_exists = 0,
    'ALTER TABLE diagrams ADD CONSTRAINT fk_diagrams_task_ref FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
