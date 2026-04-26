CREATE TABLE IF NOT EXISTS diagrams (
    id BIGINT NOT NULL AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    titre VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL,
    etapes_json LONGTEXT NOT NULL,
    contenu_json LONGTEXT NOT NULL,
    shared BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

SET @schema_name = DATABASE();

SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'diagrams'
      AND index_name = 'idx_diagrams_project'
);
SET @sql_stmt = IF(
    @idx_exists = 0,
    'CREATE INDEX idx_diagrams_project ON diagrams (project_id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'diagrams'
      AND index_name = 'idx_diagrams_owner'
);
SET @sql_stmt = IF(
    @idx_exists = 0,
    'CREATE INDEX idx_diagrams_owner ON diagrams (owner_id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'diagrams'
      AND index_name = 'idx_diagrams_shared'
);
SET @sql_stmt = IF(
    @idx_exists = 0,
    'CREATE INDEX idx_diagrams_shared ON diagrams (shared)',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
