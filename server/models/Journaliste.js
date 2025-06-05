const db = require('../db');

class Journaliste {
    static async create({ nom, prenom, email, photo_url = null }) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Validation des données
            if (!nom || !prenom || !email) {
                throw new Error('Nom, prénom et email sont requis');
            }

            // Vérification de l'email unique
            const [existingJournalistes] = await connection.query(
                'SELECT id_journaliste FROM journalistes WHERE email = ?',
                [email]
            );
            if (existingJournalistes.length > 0) {
                throw new Error('Cet email est déjà utilisé');
            }

            // Insertion du journaliste
            const [result] = await connection.query(
                'INSERT INTO journalistes (nom, prenom, email, photo_url) VALUES (?, ?, ?, ?)',
                [nom, prenom, email, photo_url]
            );

            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            console.error('Erreur lors de la création du journaliste:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    static async findById(id) {
        try {
            const [rows] = await db.query(
                `SELECT j.*, COUNT(a.id_article) as article_count 
                 FROM journalistes j 
                 LEFT JOIN articles a ON j.id_journaliste = a.id_journaliste 
                 WHERE j.id_journaliste = ?
                 GROUP BY j.id_journaliste`,
                [id]
            );
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
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Validation des données
            if (!nom || !prenom || !email) {
                throw new Error('Nom, prénom et email sont requis');
            }

            // Vérification de l'email unique (sauf pour le même journaliste)
            const [existingJournalistes] = await connection.query(
                'SELECT id_journaliste FROM journalistes WHERE email = ? AND id_journaliste != ?',
                [email, id]
            );
            if (existingJournalistes.length > 0) {
                throw new Error('Cet email est déjà utilisé par un autre journaliste');
            }

            // Mise à jour du journaliste
            const [result] = await connection.query(
                'UPDATE journalistes SET nom = ?, prenom = ?, email = ?, photo_url = ? WHERE id_journaliste = ?',
                [nom, prenom, email, photo_url, id]
            );

            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            console.error('Erreur lors de la mise à jour du journaliste:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    static async delete(id) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Vérifier si le journaliste a des articles
            const [articles] = await connection.query(
                'SELECT COUNT(*) as count FROM articles WHERE id_journaliste = ?',
                [id]
            );
            
            if (articles[0].count > 0) {
                throw new Error('Impossible de supprimer ce journaliste : il/elle possède encore des articles.');
            }

            const [result] = await connection.query(
                'DELETE FROM journalistes WHERE id_journaliste = ?',
                [id]
            );

            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            console.error('Erreur lors de la suppression du journaliste:', error);
            throw error;
        } finally {
            connection.release();
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
        try {
            const [rows] = await db.query(`
                SELECT 
                    j.*, 
                    COUNT(a.id_article) AS article_count,
                    MAX(a.date_publication) as derniere_publication
                FROM journalistes j
                LEFT JOIN articles a 
                    ON a.id_journaliste = j.id_journaliste 
                    AND a.statut = 'publie'
                GROUP BY j.id_journaliste
                ORDER BY j.nom, j.prenom
            `);
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des journalistes:', error);
            throw error;
        }
    }

    static async getArticles(journalisteId) {
        try {
            const [rows] = await db.query(`
                SELECT 
                    a.*,
                    c.nom_categorie as categorie_nom
                FROM articles a
                LEFT JOIN categories c ON a.id_categorie = c.id_categorie
                WHERE a.id_journaliste = ?
                ORDER BY a.date_publication DESC
            `, [journalisteId]);
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des articles du journaliste:', error);
            throw error;
        }
    }
}

module.exports = Journaliste;