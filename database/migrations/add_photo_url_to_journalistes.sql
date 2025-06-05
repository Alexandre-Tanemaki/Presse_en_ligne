-- Ajout de la colonne photo_url à la table journalistes
ALTER TABLE journalistes
ADD COLUMN photo_url VARCHAR(255) NULL; 