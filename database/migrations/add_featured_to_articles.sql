-- Ajout de la colonne featured à la table articles
ALTER TABLE articles
ADD COLUMN featured BOOLEAN DEFAULT FALSE;

-- Création d'un index pour optimiser les requêtes sur featured
CREATE INDEX idx_articles_featured ON articles(featured); 