SET @schema_name = DATABASE();

SET @projects_table_exists = (
    SELECT COUNT(1)
    FROM information_schema.tables
    WHERE table_schema = @schema_name
      AND table_name = 'projects'
);

SET @teams_table_exists = (
    SELECT COUNT(1)
    FROM information_schema.tables
    WHERE table_schema = @schema_name
      AND table_name = 'teams'
);

SET @tasks_table_exists = (
    SELECT COUNT(1)
    FROM information_schema.tables
    WHERE table_schema = @schema_name
      AND table_name = 'tasks'
);

SET @users_table_exists = (
    SELECT COUNT(1)
    FROM information_schema.tables
    WHERE table_schema = @schema_name
      AND table_name = 'users'
);

SET @comments_table_exists = (
    SELECT COUNT(1)
    FROM information_schema.tables
    WHERE table_schema = @schema_name
      AND table_name = 'comments'
);

SET @comment_mentions_table_exists = (
    SELECT COUNT(1)
    FROM information_schema.tables
    WHERE table_schema = @schema_name
      AND table_name = 'comment_mentions'
);

SET @project_team_column_exists = (
    SELECT COUNT(1)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'projects'
      AND column_name = 'team_id'
);

SET @sql_stmt = IF(
    @projects_table_exists = 1 AND @teams_table_exists = 1 AND @project_team_column_exists = 0,
    'ALTER TABLE projects ADD COLUMN team_id BIGINT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
    SELECT COUNT(1)
    FROM information_schema.table_constraints
    WHERE table_schema = @schema_name
      AND table_name = 'projects'
      AND constraint_name = 'fk_projects_team'
      AND constraint_type = 'FOREIGN KEY'
);
SET @sql_stmt = IF(
    @projects_table_exists = 1 AND @teams_table_exists = 1 AND @project_team_column_exists <= 1 AND @fk_exists = 0,
    'ALTER TABLE projects ADD CONSTRAINT fk_projects_team FOREIGN KEY (team_id) REFERENCES teams (id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'projects'
      AND index_name = 'idx_projects_team'
);
SET @sql_stmt = IF(
    @projects_table_exists = 1 AND @project_team_column_exists <= 1 AND @idx_exists = 0,
    'CREATE INDEX idx_projects_team ON projects (team_id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql_stmt = IF(
    @tasks_table_exists = 1 AND @users_table_exists = 1 AND @comments_table_exists = 0,
    'CREATE TABLE comments (
        id BIGINT NOT NULL AUTO_INCREMENT,
        contenu VARCHAR(4000) NOT NULL,
        task_id BIGINT NOT NULL,
        author_id BIGINT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_comments_task FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
        CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users (id)
    )',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql_stmt = IF(
    @comments_table_exists = 0,
    'SELECT 1',
    'SELECT 1'
);

SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'comments'
      AND index_name = 'idx_comments_task_created_at'
);
SET @sql_stmt = IF(
    @comments_table_exists <= 1 AND @idx_exists = 0,
    'CREATE INDEX idx_comments_task_created_at ON comments (task_id, created_at)',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql_stmt = IF(
    @users_table_exists = 1 AND @comment_mentions_table_exists = 0,
    'CREATE TABLE comment_mentions (
        id BIGINT NOT NULL AUTO_INCREMENT,
        comment_id BIGINT NOT NULL,
        user_id BIGINT NOT NULL,
        mention_key VARCHAR(120) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT uk_comment_mentions_comment_user UNIQUE (comment_id, user_id),
        CONSTRAINT fk_comment_mentions_comment FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE CASCADE,
        CONSTRAINT fk_comment_mentions_user FOREIGN KEY (user_id) REFERENCES users (id)
    )',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @comment_mentions_table_exists_after = (
    SELECT COUNT(1)
    FROM information_schema.tables
    WHERE table_schema = @schema_name
      AND table_name = 'comment_mentions'
);

SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'comment_mentions'
      AND index_name = 'idx_comment_mentions_user'
);
SET @sql_stmt = IF(
    @comment_mentions_table_exists_after = 1 AND @idx_exists = 0,
    'CREATE INDEX idx_comment_mentions_user ON comment_mentions (user_id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE projects p
LEFT JOIN (
    SELECT MIN(t.id) AS team_id, t.manager_id
    FROM teams t
    GROUP BY t.manager_id
) candidate_team ON candidate_team.manager_id = p.manager_id
SET p.team_id = candidate_team.team_id
WHERE p.team_id IS NULL;
