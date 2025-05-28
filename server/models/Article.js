const db = require('../db');
const slugify = require('slugify');

class Article {
    static async create({ titre, contenu, id_journaliste, id_categorie, type_contenu = 'texte', featured = false, image_principale = null, statut = 'brouillon' }) {
        try {
            // Conversion des valeurs
            const featuredValue = featured ? 1 : 0;
            const typeContenuValue = ['texte', 'video', 'image', 'mixte'].includes(type_contenu) ? type_contenu : 'texte';
            const statutValue = ['brouillon', 'publie', 'archive'].includes(statut) ? statut : 'brouillon';

            const [result] = await db.query(
                `INSERT INTO articles (
                    titre, 
                    contenu, 
                    id_journaliste, 
                    id_categorie, 
                    type_contenu, 
                    featured,
                    image_principale,
                    date_publication,
                    statut
                ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
                [titre, contenu, id_journaliste || null, id_categorie || null, typeContenuValue, featuredValue, image_principale, statutValue]
            );
            
            return result.insertId;
        } catch (error) {
            console.error('Erreur lors de la création de l\'article:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await db.query(
                `SELECT a.*, 
                        j.nom as journaliste_nom, 
                        j.prenom as journaliste_prenom,
                        c.nom_categorie as categorie_nom
                FROM articles a 
                LEFT JOIN journalistes j ON a.id_journaliste = j.id_journaliste 
                LEFT JOIN categories c ON a.id_categorie = c.id_categorie 
                WHERE a.id_article = ?`,
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Erreur lors de la recherche de l\'article:', error);
            throw error;
        }
    }

    static async getAll() {
        try {
            const [rows] = await db.query(
                `SELECT a.*, 
                        j.nom as journaliste_nom, 
                        j.prenom as journaliste_prenom,
                        c.nom_categorie as categorie_nom
                FROM articles a 
                LEFT JOIN journalistes j ON a.id_journaliste = j.id_journaliste 
                LEFT JOIN categories c ON a.id_categorie = c.id_categorie 
                ORDER BY a.date_publication DESC`
            );
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des articles:', error);
            throw error;
        }
    }

    static async getFeatured(limit = 3) {
        try {
            const [rows] = await db.query(
                `SELECT a.*, 
                        j.nom as journaliste_nom, 
                        j.prenom as journaliste_prenom,
                        c.nom_categorie as categorie_nom
                FROM articles a 
                LEFT JOIN journalistes j ON a.id_journaliste = j.id_journaliste 
                LEFT JOIN categories c ON a.id_categorie = c.id_categorie 
                WHERE a.featured = ? 
                ORDER BY a.date_publication DESC 
                LIMIT ?`,
                [1, parseInt(limit)]
            );
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des articles mis en avant:', error);
            throw new Error('Erreur lors de la récupération des articles mis en avant: ' + error.message);
        }
    }

    static async update(id, { titre, contenu, id_journaliste, id_categorie, type_contenu, featured }) {
        try {
            const [result] = await db.query(
                `UPDATE articles 
                SET titre = ?, 
                    contenu = ?, 
                    id_journaliste = ?, 
                    id_categorie = ?, 
                    type_contenu = ?,
                    featured = ?
                WHERE id_article = ?`,
                [titre, contenu, id_journaliste, id_categorie, type_contenu, featured, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'article:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            console.log('Suppression demandée pour id_article =', id);
            const [result] = await db.query('DELETE FROM articles WHERE id_article = ?', [id]);
            console.log('Résultat suppression :', result);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'article:', error);
            throw error;
        }
    }

    static async setFeatured(id, featured) {
        try {
            const [result] = await db.query(
                'UPDATE articles SET featured = ? WHERE id_article = ?',
                [featured, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut featured:', error);
            throw error;
        }
    }

    static async getByCategorie(categorie, { page = 1, limit = 10 } = {}) {
        try {
            const offset = (page - 1) * limit;
            const [rows] = await db.query(`
                SELECT 
                    a.*,
                    j.nom as journaliste_nom,
                    j.prenom as journaliste_prenom,
                    c.nom_categorie as categorie_nom
                FROM articles a
                LEFT JOIN journalistes j ON a.id_journaliste = j.id_journaliste
                LEFT JOIN categories c ON a.id_categorie = c.id_categorie
                WHERE a.id_categorie = ?
                ORDER BY a.date_publication DESC
                LIMIT ? OFFSET ?
            `, [categorie, limit, offset]);

            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des articles par catégorie:', error);
            throw error;
        }
    }

    static async publier(id) {
        try {
            const [result] = await db.query(
                'UPDATE articles SET statut = "publie", date_publication = CURRENT_TIMESTAMP WHERE id_article = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la publication de l\'article:', error);
            throw error;
        }
    }

    static async archiver(id, raison = null) {
        try {
            const [result] = await db.query(
                'UPDATE articles SET statut = "archive", date_archivage = CURRENT_TIMESTAMP, raison_archivage = ? WHERE id_article = ?',
                [raison, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de l\'archivage de l\'article:', error);
            throw error;
        }
    }

    static async getArchives({ page = 1, limit = 10 } = {}) {
        try {
            const offset = (page - 1) * limit;
            const [rows] = await db.query(`
                SELECT a.*, 
                    j.nom as journaliste_nom, 
                    j.prenom as journaliste_prenom,
                    c.nom_categorie as categorie_nom
                FROM articles a 
                LEFT JOIN journalistes j ON a.id_journaliste = j.id_journaliste 
                LEFT JOIN categories c ON a.id_categorie = c.id_categorie 
                WHERE a.statut = 'archive'
                ORDER BY a.date_archivage DESC
                LIMIT ? OFFSET ?
            `, [limit, offset]);
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des articles archivés:', error);
            throw error;
        }
    }

    static async restaurer(id) {
        try {
            const [result] = await db.query(
                'UPDATE articles SET statut = "publie", date_archivage = NULL, raison_archivage = NULL WHERE id_article = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la restauration de l\'article:', error);
            throw error;
        }
    }
}

module.exports = Article; 