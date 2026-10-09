
CREATE TABLE IF NOT EXISTS poles (    
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('SUPER_ADMIN', 'POLE_MANAGER', 'MEMBER') DEFAULT 'MEMBER',
    pole_id BIGINT,
    is_general_coordinator BOOLEAN DEFAULT FALSE,
    active_week_number INT NULL,
    active_year INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pole_id) REFERENCES poles(id) ON DELETE SET NULL
);


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


CREATE TABLE IF NOT EXISTS assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    activity_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (activity_id, user_id)
);


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


CREATE TABLE IF NOT EXISTS weekly_schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    week_number INT NOT NULL,
    year INT NOT NULL,
    general_coordinator_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (general_coordinator_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_week (week_number, year)
);



-- Insertion des pôles
INSERT INTO `poles` (`name`, `description`) VALUES
('Régie', 'Gestion des caméras et de la réalisation'),
('Cadrage', 'Cadrage des caméras et suivi des plans'),
('Titrage', 'Gestion des titres et des graphismes'),
('Sono', 'Gestion du son et de la régie sonore')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);


SELECT '✅ Base de données O2switch créée avec succès !' as Status;
SELECT COUNT(*) as Nombre_poles FROM poles;
SELECT COUNT(*) as Nombre_utilisateurs FROM users;
SELECT id, email, full_name, role FROM users;