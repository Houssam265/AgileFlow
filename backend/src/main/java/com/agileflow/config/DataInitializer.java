package com.agileflow.config;

import com.agileflow.entity.*;
import com.agileflow.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
@Profile("seed")
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProjectRepository projectRepository;
    private final BacklogRepository backlogRepository;
    private final UserStoryRepository userStoryRepository;
    private final SprintRepository sprintRepository;
    private final TaskRepository taskRepository;
    private final ActivityLogRepository activityLogRepository;
    private final DiagramRepository diagramRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Nettoyage de la base de données avant initialisation...");
        
        // Supprimer dans l'ordre inverse des dépendances
        activityLogRepository.deleteAll();
        notificationRepository.deleteAll();
        diagramRepository.deleteAll();
        taskRepository.deleteAll();
        userStoryRepository.deleteAll();
        sprintRepository.deleteAll();
        backlogRepository.deleteAll();
        projectRepository.deleteAll();
        teamMemberRepository.deleteAll();
        teamRepository.deleteAll();
        // On ne supprime pas forcément tous les utilisateurs si on veut garder l'admin, 
        // mais pour un seed "propre", on vide tout.
        userRepository.deleteAll();

        log.info("Début de l'initialisation des données de test...");

        // 1. Création des utilisateurs
        User admin = User.builder()
                .nom("Admin")
                .prenom("System")
                .email("admin@agileflow.com")
                .password(passwordEncoder.encode("Password@2024"))
                .role(User.Role.ROLE_ADMIN)
                .actif(true)
                .dateCreation(LocalDateTime.now())
                .build();

        User manager = User.builder()
                .nom("Manager")
                .prenom("Project")
                .email("manager@agileflow.com")
                .password(passwordEncoder.encode("Password@2024"))
                .role(User.Role.ROLE_MANAGER)
                .actif(true)
                .dateCreation(LocalDateTime.now())
                .build();

        User dev1 = User.builder()
                .nom("Dev")
                .prenom("Alice")
                .email("alice@agileflow.com")
                .password(passwordEncoder.encode("Password@2024"))
                .role(User.Role.ROLE_DEVELOPER)
                .actif(true)
                .dateCreation(LocalDateTime.now())
                .build();

        User dev2 = User.builder()
                .nom("Dev")
                .prenom("Bob")
                .email("bob@agileflow.com")
                .password(passwordEncoder.encode("Password@2024"))
                .role(User.Role.ROLE_DEVELOPER)
                .actif(true)
                .dateCreation(LocalDateTime.now())
                .build();

        userRepository.saveAll(List.of(admin, manager, dev1, dev2));

        // 2. Création d'une équipe
        Team team = Team.builder()
                .name("Alpha Team")
                .description("Équipe de développement principale")
                .manager(manager)
                .createdAt(LocalDateTime.now())
                .build();
        teamRepository.save(team);

        // Ajout des membres à l'équipe
        TeamMember tm1 = TeamMember.builder().team(team).user(dev1).joinedAt(LocalDateTime.now()).build();
        TeamMember tm2 = TeamMember.builder().team(team).user(dev2).joinedAt(LocalDateTime.now()).build();
        teamMemberRepository.saveAll(List.of(tm1, tm2));

        // 3. Création d'un projet
        Project project = Project.builder()
                .nom("AgileFlow Platform")
                .description("Développement de la plateforme de gestion de projet Agile")
                .dateDebut(LocalDate.now())
                .dateFin(LocalDate.now().plusMonths(6))
                .statut(Project.Statut.ACTIF)
                .manager(manager)
                .build();
        projectRepository.save(project);

        // 4. Création du Backlog
        Backlog backlog = Backlog.builder()
                .project(project)
                .build();
        backlogRepository.save(backlog);
        project.setBacklog(backlog);

        // 5. Création de User Stories
        UserStory us1 = UserStory.builder()
                .titre("Gestion des utilisateurs")
                .description("En tant qu'admin, je veux pouvoir gérer les utilisateurs.")
                .priority(UserStory.Priority.HIGH)
                .storyPoints(5)
                .backlog(backlog)
                .createdAt(LocalDateTime.now())
                .build();

        UserStory us2 = UserStory.builder()
                .titre("Tableau Kanban")
                .description("En tant que développeur, je veux voir mes tâches sur un tableau Kanban.")
                .priority(UserStory.Priority.CRITICAL)
                .storyPoints(8)
                .backlog(backlog)
                .createdAt(LocalDateTime.now())
                .build();

        UserStory us3 = UserStory.builder()
                .titre("Notifications par email")
                .description("En tant qu'utilisateur, je veux recevoir un email lors d'une assignation.")
                .priority(UserStory.Priority.MEDIUM)
                .storyPoints(3)
                .backlog(backlog)
                .createdAt(LocalDateTime.now())
                .build();

        userStoryRepository.saveAll(List.of(us1, us2, us3));

        // 6. Création d'un Sprint
        Sprint sprint = Sprint.builder()
                .nom("Sprint 1 - Foundation")
                .description("Mise en place des bases du projet")
                .dateDebut(LocalDate.now())
                .dateFin(LocalDate.now().plusWeeks(2))
                .statut(Sprint.Statut.ACTIF)
                .project(project)
                .capacitePoints(20)
                .build();
        sprintRepository.save(sprint);

        // Assigner des stories au sprint
        us1.setSprint(sprint);
        us2.setSprint(sprint);
        userStoryRepository.saveAll(List.of(us1, us2));

        // 7. Création de tâches
        Task task1 = Task.builder()
                .titre("Implémenter l'authentification JWT")
                .description("Mettre en place la sécurité avec Spring Security et JWT")
                .statut(Task.Statut.DONE)
                .priorite(Task.Priorite.HIGH)
                .sprint(sprint)
                .story(us1)
                .assignedTo(dev1)
                .labels(Set.of("Backend", "Sécurité"))
                .build();

        Task task2 = Task.builder()
                .titre("Design du dashboard")
                .description("Créer la maquette du tableau de bord")
                .statut(Task.Statut.IN_PROGRESS)
                .priorite(Task.Priorite.MEDIUM)
                .sprint(sprint)
                .story(us2)
                .assignedTo(dev2)
                .labels(Set.of("Frontend", "UI/UX"))
                .build();

        Task task3 = Task.builder()
                .titre("Fix bug lazy loading labels")
                .description("Correction de l'erreur LazyInitializationException sur les labels des tâches")
                .statut(Task.Statut.TODO)
                .priorite(Task.Priorite.CRITICAL)
                .sprint(sprint)
                .story(us2)
                .assignedTo(dev1)
                .labels(Set.of("Bugfix", "Hibernate"))
                .build();

        taskRepository.saveAll(List.of(task1, task2, task3));

        ActivityLog log1 = ActivityLog.builder()
                .actor(dev1)
                .project(project)
                .sprint(sprint)
                .task(task1)
                .action(ActivityLog.Action.TASK_COMPLETED)
                .message("Tache terminee: " + task1.getTitre())
                .activityDate(LocalDate.now().minusDays(2))
                .createdAt(LocalDateTime.now().minusDays(2))
                .build();
        ActivityLog log2 = ActivityLog.builder()
                .actor(dev2)
                .project(project)
                .sprint(sprint)
                .task(task2)
                .action(ActivityLog.Action.TASK_MOVED)
                .message("Tache en cours: " + task2.getTitre())
                .activityDate(LocalDate.now().minusDays(1))
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();
        ActivityLog log3 = ActivityLog.builder()
                .actor(manager)
                .project(project)
                .sprint(sprint)
                .action(ActivityLog.Action.STORY_PLANNED)
                .message("Stories planifiees pour " + sprint.getNom())
                .activityDate(LocalDate.now())
                .createdAt(LocalDateTime.now())
                .build();
        activityLogRepository.saveAll(List.of(log1, log2, log3));

        log.info("Initialisation des données terminée avec succès !");
    }
}
