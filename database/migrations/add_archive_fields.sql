-- Ajout des champs pour l'archivage
ALTER TABLE articles
ADD COLUMN date_archivage DATETIME NULL AFTER date_publication,
ADD COLUMN raison_archivage TEXT NULL AFTER date_archivage;

-- Création d'un index pour optimiser les requêtes sur la date d'archivage
CREATE INDEX idx_articles_date_archivage ON articles(date_archivage); 