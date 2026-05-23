CREATE TABLE epics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(160) NOT NULL,
    description TEXT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'TODO',
    color VARCHAR(7) NOT NULL DEFAULT '#6366F1',
    sort_order INT NOT NULL DEFAULT 0,
    date_debut DATE NULL,
    date_fin DATE NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    project_id BIGINT NOT NULL,
    CONSTRAINT fk_epic_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

ALTER TABLE user_stories
    ADD COLUMN epic_id BIGINT NULL,
    ADD CONSTRAINT fk_user_story_epic FOREIGN KEY (epic_id) REFERENCES epics(id) ON DELETE SET NULL;
