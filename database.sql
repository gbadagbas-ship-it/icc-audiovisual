-- Création de la base de données
CREATE DATABASE IF NOT EXISTS icc_audiovisual;
USE icc_audiovisual;

-- Table des pôles
CREATE TABLE poles (    
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des utilisateurs
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('SUPER_ADMIN', 'POLE_MANAGER', 'MEMBER') DEFAULT 'MEMBER',
    pole_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pole_id) REFERENCES poles(id) ON DELETE SET NULL
);

-- Table des activités
CREATE TABLE activities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    pole_id BIGINT NOT NULL,
    coordinator_id BIGINT,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pole_id) REFERENCES poles(id) ON DELETE CASCADE,
    FOREIGN KEY (coordinator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des affectations (membres programmés)
CREATE TABLE assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    activity_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (activity_id, user_id)
);

-- Table des programmations hebdomadaires
CREATE TABLE weekly_schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    week_number INT NOT NULL,
    year INT NOT NULL,
    general_coordinator_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (general_coordinator_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_week (week_number, year)
);

-- Insertion des pôles par défaut
INSERT INTO poles (name, description) VALUES
('Régie', 'Gestion des caméras et de la réalisation'),
('Cadrage', 'Cadrage des caméras et suivi des plans'),
('Titrage', 'Gestion des titres et des graphismes'),
('Sono', 'Gestion du son et de la régie sonore');

-- Insertion d'un super admin par défaut (mot de passe: deptaudio2026)
INSERT INTO users (email, password_hash, full_name, role) VALUES
('audioadmin@icc.com', '$2b$10$DRrN49YfdGEaewDp5K2sCOPYjvcRh9CbJ7zcGUG1NoFEh18/rjqCC', 'Super Admin', 'SUPER_ADMIN');

-- Note: Pour générer le hash du mot de passe admin123, utilisez bcrypt
-- Vous devrez créer un script pour insérer le premier admin avec un vrai hash