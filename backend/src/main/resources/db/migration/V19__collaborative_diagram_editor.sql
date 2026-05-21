-- Collaborative DiagramFlow schema extensions.

SET @schema_name = DATABASE();

SET @col_exists = (
    SELECT COUNT(1) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'diagrams' AND COLUMN_NAME = 'title'
);
SET @sql_stmt = IF(@col_exists = 0, 'ALTER TABLE diagrams ADD COLUMN title VARCHAR(150) NULL', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(1) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'diagrams' AND COLUMN_NAME = 'description'
);
SET @sql_stmt = IF(@col_exists = 0, 'ALTER TABLE diagrams ADD COLUMN description VARCHAR(2000) NULL', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(1) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'diagrams' AND COLUMN_NAME = 'canvas_data'
);
SET @sql_stmt = IF(@col_exists = 0, 'ALTER TABLE diagrams ADD COLUMN canvas_data LONGTEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(1) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'diagrams' AND COLUMN_NAME = 'is_shared'
);
SET @sql_stmt = IF(@col_exists = 0, 'ALTER TABLE diagrams ADD COLUMN is_shared BOOLEAN NULL DEFAULT FALSE', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(1) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'diagrams' AND COLUMN_NAME = 'thumbnail_url'
);
SET @sql_stmt = IF(@col_exists = 0, 'ALTER TABLE diagrams ADD COLUMN thumbnail_url VARCHAR(1000) NULL', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(1) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'diagrams' AND COLUMN_NAME = 'created_by'
);
SET @sql_stmt = IF(@col_exists = 0, 'ALTER TABLE diagrams ADD COLUMN created_by BIGINT NULL', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE diagrams
SET title = COALESCE(title, titre),
    canvas_data = COALESCE(canvas_data, contenu_json),
    is_shared = COALESCE(is_shared, shared),
    created_by = COALESCE(created_by, owner_id);

CREATE TABLE IF NOT EXISTS diagram_nodes (
    id VARCHAR(80) NOT NULL,
    diagram_id BIGINT NOT NULL,
    type VARCHAR(80) NOT NULL,
    position_x DOUBLE,
    position_y DOUBLE,
    width DOUBLE,
    height DOUBLE,
    data TEXT,
    z_index INT,
    locked BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    CONSTRAINT fk_diagram_nodes_diagram FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS diagram_edges (
    id VARCHAR(80) NOT NULL,
    diagram_id BIGINT NOT NULL,
    source_node_id VARCHAR(80) NOT NULL,
    target_node_id VARCHAR(80) NOT NULL,
    source_handle VARCHAR(20),
    target_handle VARCHAR(20),
    edge_type VARCHAR(30),
    arrow_start VARCHAR(30),
    arrow_end VARCHAR(30),
    data TEXT,
    PRIMARY KEY (id),
    CONSTRAINT fk_diagram_edges_diagram FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS diagram_collaborators (
    id BIGINT NOT NULL AUTO_INCREMENT,
    diagram_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    permission VARCHAR(20) NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_diagram_collaborator (diagram_id, user_id),
    CONSTRAINT fk_diagram_collaborators_diagram FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE,
    CONSTRAINT fk_diagram_collaborators_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
