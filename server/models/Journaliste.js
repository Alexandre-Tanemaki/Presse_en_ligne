const db = require('../db');

class Journaliste {
    static async create({ nom, prenom, email, photo_url = null }) {
        try {
            // Vérifier si la colonne photo_url existe
            const [columns] = await db.query('SHOW COLUMNS FROM journalistes');
            const hasPhotoUrl = columns.some(col => col.Field === 'photo_url');

            let query;
            let params;

            if (hasPhotoUrl) {
                query = 'INSERT INTO journalistes (nom, prenom, email, photo_url) VALUES (?, ?, ?, ?)';
                params = [nom, prenom, email, photo_url];
            } else {
                query = 'INSERT INTO journalistes (nom, prenom, email) VALUES (?, ?, ?)';
                params = [nom, prenom, email];
            }

            const [result] = await db.query(query, params);
            return result.insertId;
        } catch (error) {
            console.error('Erreur lors de la création du journaliste:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await db.query('SELECT * FROM journalistes WHERE id_journaliste = ?', [id]);
            return rows[0] || null;
        } catch (error) {
            console.error('Erreur lors de la recherche du journaliste:', error);
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            const [rows] = await db.query('SELECT * FROM journalistes WHERE email = ?', [email]);
            return rows[0] || null;
        } catch (error) {
            console.error('Erreur lors de la recherche du journaliste par email:', error);
            throw error;
        }
    }

    static async update(id, { nom, prenom, email, photo_url }) {
        try {
            // Vérifier si la colonne photo_url existe
            const [columns] = await db.query('SHOW COLUMNS FROM journalistes');
            const hasPhotoUrl = columns.some(col => col.Field === 'photo_url');

            let query;
            let params;

            if (hasPhotoUrl) {
                query = 'UPDATE journalistes SET nom = ?, prenom = ?, email = ?, photo_url = ? WHERE id_journaliste = ?';
                params = [nom, prenom, email, photo_url, id];
            } else {
                query = 'UPDATE journalistes SET nom = ?, prenom = ?, email = ? WHERE id_journaliste = ?';
                params = [nom, prenom, email, id];
            }

            const [result] = await db.query(query, params);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du journaliste:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const [result] = await db.query('DELETE FROM journalistes WHERE id_journaliste = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la suppression du journaliste:', error);
            throw error;
        }
    }

    static async getAll() {
        try {
            const [rows] = await db.query('SELECT * FROM journalistes ORDER BY nom, prenom');
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des journalistes:', error);
            throw error;
        }
    }

    static async getAllWithArticleCount() {
        const [rows] = await db.query(`
            SELECT 
                j.*, 
                COUNT(a.id_article) AS article_count
            FROM journalistes j
            LEFT JOIN articles a 
                ON a.id_journaliste = j.id_journaliste AND a.statut = 'publie'
            GROUP BY j.id_journaliste
            ORDER BY j.nom, j.prenom
        `);
        return rows;
    }

    static async getArticles(journalisteId) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM articles WHERE id_journaliste = ? ORDER BY date_publication DESC',
                [journalisteId]
            );
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des articles du journaliste:', error);
            throw error;
        }
    }
}

module.exports = Journaliste;