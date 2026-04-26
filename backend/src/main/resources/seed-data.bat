@echo off
echo [AgileFlow] Initialisation des donnees de test...
:: Naviguer vers la racine du projet depuis backend/src/main/resources
cd /d "%~dp0"
cd ..\..\..\..
echo Dossier racine : %cd%
cd backend
call mvnw spring-boot:run -Dspring-boot.run.profiles=seed -Dspring-boot.run.arguments="--spring.main.web-application-type=none"
pause
