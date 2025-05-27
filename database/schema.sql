-- Création de la base de données
CREATE DATABASE IF NOT EXISTS ma_presse;
USE ma_presse;

-- Table des catégories
CREATE TABLE IF NOT EXISTS categories (
    id_categorie INT PRIMARY KEY AUTO_INCREMENT,
    nom_categorie VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE
);

-- Table des journalistes
CREATE TABLE IF NOT EXISTS journalistes (
    id_journaliste INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    photo_url VARCHAR(255)
);

-- Table des articles
CREATE TABLE IF NOT EXISTS articles (
    id_article INT(11) PRIMARY KEY AUTO_INCREMENT,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT,
    date_publication DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_journaliste INT(11),
    id_categorie INT(11),
    type_contenu ENUM('texte', 'video', 'image', 'mixte') NOT NULL DEFAULT 'texte',
    featured TINYINT(1) DEFAULT 0,
    image_principale VARCHAR(255),
    statut ENUM('brouillon', 'publie', 'archive') DEFAULT 'brouillon',
    FOREIGN KEY (id_journaliste) REFERENCES journalistes(id_journaliste) ON DELETE SET NULL,
    FOREIGN KEY (id_categorie) REFERENCES categories(id_categorie) ON DELETE SET NULL
);

-- Table des tags
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE
);

-- Table des médias
CREATE TABLE IF NOT EXISTS medias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    article_id INT,
    type_media ENUM('image', 'video') NOT NULL,
    url VARCHAR(255) NOT NULL,
    description TEXT,
    FOREIGN KEY (article_id) REFERENCES articles(id_article) ON DELETE CASCADE
);

-- Table de liaison articles-tags
CREATE TABLE IF NOT EXISTS articles_tags (
    article_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (article_id, tag_id),
    FOREIGN KEY (article_id) REFERENCES articles(id_article) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Insertion des catégories de base
INSERT INTO categories (nom_categorie, slug) VALUES
('Politique', 'politique'),
('Économie', 'economie'),
('Faits divers', 'faits-divers'),
('Sports', 'sports'),
('Santé', 'sante'),
('Culture', 'culture'),
('International', 'international');

-- Index pour améliorer les performances
CREATE INDEX idx_articles_categorie ON articles(id_categorie);
CREATE INDEX idx_articles_date_publication ON articles(date_publication);
CREATE INDEX idx_articles_statut ON articles(statut);
CREATE INDEX idx_articles_featured ON articles(featured); 