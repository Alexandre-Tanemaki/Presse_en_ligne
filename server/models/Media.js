const db = require('../db');

class Media {
    static async create({ id_article, type_media, url, description = null }) {
        try {
            const [result] = await db.query(
                'INSERT INTO medias (id_article, type_media, url, description) VALUES (?, ?, ?, ?)',
                [id_article, type_media, url, description]
            );
            return result.insertId;
        } catch (error) {
            console.error('Erreur lors de la création du média:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await db.query('SELECT * FROM medias WHERE id_media = ?', [id]);
            return rows[0] || null;
        } catch (error) {
            console.error('Erreur lors de la recherche du média:', error);
            throw error;
        }
    }

    static async update(id, { type_media, url, description }) {
        try {
            const [result] = await db.query(
                'UPDATE medias SET type_media = ?, url = ?, description = ? WHERE id_media = ?',
                [type_media, url, description, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du média:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const [result] = await db.query('DELETE FROM medias WHERE id_media = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la suppression du média:', error);
            throw error;
        }
    }

    static async getByArticle(articleId) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM medias WHERE id_article = ? ORDER BY id_media',
                [articleId]
            );
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des médias de l\'article:', error);
            throw error;
        }
    }
}

module.exports = Media; 