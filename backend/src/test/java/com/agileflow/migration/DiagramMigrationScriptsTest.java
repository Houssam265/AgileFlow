package com.agileflow.migration;

import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Valide que les scripts Flyway des diagrammes décrivent la table attendue et les contraintes de clés étrangères
 * (sans exécuter Flyway sur MySQL dans les tests unitaires).
 */
class DiagramMigrationScriptsTest {

    private static String readMigration(String classpathResource) throws Exception {
        try (InputStream in = DiagramMigrationScriptsTest.class.getClassLoader().getResourceAsStream(classpathResource)) {
            assertThat(in).as("classpath:" + classpathResource).isNotNull();
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    @Test
    void v12_definesDiagramsTableWithProjectAndOwner() throws Exception {
        String sql = readMigration("db/migration/V12__create_diagrams.sql");
        assertThat(sql).containsIgnoringCase("CREATE TABLE");
        assertThat(sql).containsIgnoringCase("diagrams");
        assertThat(sql).contains("project_id");
        assertThat(sql).contains("owner_id");
    }

    @Test
    void v18_addsTaskColumnAndForeignKeys() throws Exception {
        String sql = readMigration("db/migration/V18__diagrams_foreign_keys_and_task.sql");
        assertThat(sql).containsIgnoringCase("task_id");
        assertThat(sql).contains("fk_diagrams_project");
        assertThat(sql).contains("fk_diagrams_owner");
        assertThat(sql).contains("fk_diagrams_task_ref");
        assertThat(sql).containsIgnoringCase("FOREIGN KEY");
        assertThat(sql).contains("REFERENCES projects");
        assertThat(sql).contains("REFERENCES users");
        assertThat(sql).contains("REFERENCES tasks");
    }
}
