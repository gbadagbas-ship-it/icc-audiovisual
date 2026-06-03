
-- Création de la base de données
CREATE DATABASE IF NOT EXISTS icc_audiovisual;
USE icc_audiovisual;

-- =============================================
-- 1. TABLE DES PÔLES
-- =============================================
CREATE TABLE IF NOT EXISTS poles (    
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 2. TABLE DES UTILISATEURS
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('SUPER_ADMIN', 'POLE_MANAGER', 'MEMBER') DEFAULT 'MEMBER',
    pole_id BIGINT,
    -- Nouveaux champs pour coordinateur général
    is_general_coordinator BOOLEAN DEFAULT FALSE,
    active_week_number INT NULL,
    active_year INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pole_id) REFERENCES poles(id) ON DELETE SET NULL
);

-- =============================================
-- 3. TABLE DES ACTIVITÉS (avec statut de validation)
-- =============================================
CREATE TABLE IF NOT EXISTS activities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    pole_id BIGINT NOT NULL,
    coordinator_id BIGINT,
    created_by BIGINT NOT NULL,
    -- Nouveaux champs pour la validation
    status ENUM('draft', 'pending', 'validated') DEFAULT 'draft',
    validated_by BIGINT NULL,
    validated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pole_id) REFERENCES poles(id) ON DELETE CASCADE,
    FOREIGN KEY (coordinator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- 4. TABLE DES AFFECTATIONS (membres programmés)
-- =============================================
CREATE TABLE IF NOT EXISTS assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    activity_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (activity_id, user_id)
);

-- =============================================
-- 6. TABLE DES RAPPORTS PAR ACTIVITÉ
-- =============================================
CREATE TABLE IF NOT EXISTS activity_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    activity_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    attendance TEXT,
    technical_issues TEXT,
    suggestions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- 5. TABLE DES PROGRAMMATIONS HEBDOMADAIRES (avec validation)
-- =============================================
CREATE TABLE IF NOT EXISTS weekly_programs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    week_number INT NOT NULL,
    year INT NOT NULL,
    pole_id BIGINT NOT NULL,
    status ENUM('pending', 'validated') DEFAULT 'pending',
    validated_by BIGINT NULL,
    validated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pole_id) REFERENCES poles(id) ON DELETE CASCADE,
    FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_week_pole (week_number, year, pole_id)
);

-- =============================================
-- 6. TABLE DES RAPPORTS DES COORDINATEURS GÉNÉRAUX
-- =============================================
CREATE TABLE IF NOT EXISTS weekly_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    week_number INT NOT NULL,
    year INT NOT NULL,
    coordinator_id BIGINT NOT NULL,
    what_worked TEXT,
    what_didnt_work TEXT,
    observations TEXT,
    attendance TEXT,
    technical_issues TEXT,
    suggestions TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coordinator_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_weekly_report (week_number, year, coordinator_id)
);

-- =============================================
-- 7. TABLE DES COORDINATEURS GÉNÉRAUX PAR SEMAINE
-- =============================================
CREATE TABLE IF NOT EXISTS weekly_coordinators (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    week_number INT NOT NULL,
    year INT NOT NULL,
    user_id BIGINT NOT NULL,
    assigned_by BIGINT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_weekly_coordinator (week_number, year)
);

-- =============================================
-- 8. TABLE DES PROGRAMMATIONS HEBDOMADAIRES (ancienne, conservée pour compatibilité)
-- =============================================
CREATE TABLE IF NOT EXISTS weekly_schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    week_number INT NOT NULL,
    year INT NOT NULL,
    general_coordinator_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (general_coordinator_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_week (week_number, year)
);

-- =============================================
-- INSERTION DES DONNÉES INITIALES
-- =============================================

-- Insertion des pôles par défaut
INSERT INTO poles (name, description) VALUES
('Régie', 'Gestion des caméras et de la réalisation'),
('Cadrage', 'Cadrage des caméras et suivi des plans'),
('Titrage', 'Gestion des titres et des graphismes'),
('Sono', 'Gestion du son et de la régie sonore')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insertion d'un super admin par défaut
-- Mot de passe: deptaudio2026
-- Hash généré avec bcrypt pour "deptaudio2026"
INSERT INTO users (email, password_hash, full_name, role, is_general_coordinator) VALUES
('audioadmin@icc.com', '$2b$10$DRrN49YfdGEaewDp5K2sCOPYjvcRh9CbJ7zcGUG1NoFEh18/rjqCC', 'Super Admin', 'SUPER_ADMIN', FALSE)
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- =============================================
-- VUES UTILES
-- =============================================

-- Vue des activités validées pour le public
CREATE OR REPLACE VIEW view_public_activities AS
SELECT 
    a.id,
    a.name,
    a.date,
    a.start_time,
    a.end_time,
    a.location,
    p.name as pole_name,
    u.full_name as coordinator_name,
    (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', u2.id, 'name', u2.full_name))
     FROM assignments ass
     JOIN users u2 ON ass.user_id = u2.id
     WHERE ass.activity_id = a.id) as members
FROM activities a
LEFT JOIN poles p ON a.pole_id = p.id
LEFT JOIN users u ON a.coordinator_id = u.id
WHERE a.status = 'validated'
ORDER BY a.date ASC, a.start_time ASC;

-- Vue des programmations par semaine
CREATE OR REPLACE VIEW view_weekly_schedule AS
SELECT 
    wp.week_number,
    wp.year,
    wp.status as week_status,
    wp.validated_at,
    COUNT(a.id) as total_activities,
    (SELECT COUNT(DISTINCT user_id) FROM assignments ass 
     JOIN activities act ON ass.activity_id = act.id 
     WHERE YEAR(act.date) = wp.year AND WEEK(act.date) = wp.week_number) as total_members
FROM weekly_programs wp
LEFT JOIN activities a ON YEAR(a.date) = wp.year AND WEEK(a.date) = wp.week_number
GROUP BY wp.id, wp.week_number, wp.year, wp.status, wp.validated_at
ORDER BY wp.year DESC, wp.week_number DESC;

-- =============================================
-- PROCÉDURES STOCKÉES
-- =============================================

DELIMITER //

-- Procédure pour valider une semaine entière
CREATE PROCEDURE ValidateWeek(IN p_week_number INT, IN p_year INT, IN p_admin_id BIGINT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Mettre à jour ou insérer dans weekly_programs
    INSERT INTO weekly_programs (week_number, year, status, validated_by, validated_at)
    VALUES (p_week_number, p_year, 'validated', p_admin_id, NOW())
    ON DUPLICATE KEY UPDATE 
        status = 'validated',
        validated_by = p_admin_id,
        validated_at = NOW();
    
    -- Mettre à jour le statut des activités de la semaine
    UPDATE activities 
    SET status = 'validated', validated_by = p_admin_id, validated_at = NOW()
    WHERE YEAR(date) = p_year AND WEEK(date) = p_week_number;
    
    COMMIT;
END //

-- Procédure pour obtenir la semaine courante
CREATE FUNCTION GetCurrentWeekNumber() 
RETURNS INT
DETERMINISTIC
BEGIN
    RETURN WEEK(CURDATE(), 1);
END //

-- Procédure pour obtenir l'année courante
CREATE FUNCTION GetCurrentYear() 
RETURNS INT
DETERMINISTIC
BEGIN
    RETURN YEAR(CURDATE());
END //

DELIMITER ;

-- =============================================
-- INDEX POUR OPTIMISATION
-- =============================================

-- Index sur les activités
CREATE INDEX idx_activities_date ON activities(date);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_pole_id ON activities(pole_id);
CREATE INDEX idx_activities_created_by ON activities(created_by);

-- Index sur les utilisateurs
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_pole_id ON users(pole_id);
CREATE INDEX idx_users_is_gc ON users(is_general_coordinator);

-- Index sur les affectations
CREATE INDEX idx_assignments_activity_id ON assignments(activity_id);
CREATE INDEX idx_assignments_user_id ON assignments(user_id);

-- Index sur les programmations hebdomadaires
CREATE INDEX idx_weekly_programs_week_year ON weekly_programs(week_number, year);
CREATE INDEX idx_weekly_reports_week_year ON weekly_reports(week_number, year);
CREATE INDEX idx_weekly_coordinators_week_year ON weekly_coordinators(week_number, year);

-- =============================================
-- DONNÉES DE TEST (optionnel)
-- =============================================

-- Exemple d'insertion de membres de test (décommentez si nécessaire)
-- INSERT INTO users (email, password_hash, full_name, role, pole_id) VALUES
-- ('jean.dupont@icc.com', '$2b$10$DRrN49YfdGEaewDp5K2sCOPYjvcRh9CbJ7zcGUG1NoFEh18/rjqCC', 'Jean Dupont', 'MEMBER', 1),
-- ('pierre.martin@icc.com', '$2b$10$DRrN49YfdGEaewDp5K2sCOPYjvcRh9CbJ7zcGUG1NoFEh18/rjqCC', 'Pierre Martin', 'MEMBER', 1),
-- ('marie.lambert@icc.com', '$2b$10$DRrN49YfdGEaewDp5K2sCOPYjvcRh9CbJ7zcGUG1NoFEh18/rjqCC', 'Marie Lambert', 'POLE_MANAGER', 2);

-- =============================================
-- AFFICHAGE DES INFORMATIONS
-- =============================================

SELECT 'Base de données créée avec succès !' as Message;
SELECT COUNT(*) as Nombre_poles FROM poles;
SELECT COUNT(*) as Nombre_utilisateurs FROM users;
SELECT TABLE_NAME as Tables_crées FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'icc_audiovisual' 
ORDER BY TABLE_NAME;