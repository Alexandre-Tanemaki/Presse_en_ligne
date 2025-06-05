const db = require('../db');
const slugify = require('slugify');

class Categorie {
    static async create({ nom_categorie }) {
        try {
            const slug = slugify(nom_categorie, { lower: true, strict: true });
            const [result] = await db.query(
                'INSERT INTO categories (nom_categorie, slug) VALUES (?, ?)',
                [nom_categorie, slug]
            );
            return result.insertId;
        } catch (error) {
            console.error('Erreur lors de la création de la catégorie:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await db.query('SELECT * FROM categories WHERE id_categorie = ?', [id]);
            return rows[0] || null;
        } catch (error) {
            console.error('Erreur lors de la recherche de la catégorie:', error);
            throw error;
        }
    }

    static async findBySlug(slug) {
        try {
            const [rows] = await db.query('SELECT * FROM categories WHERE slug = ?', [slug]);
            return rows[0] || null;
        } catch (error) {
            console.error('Erreur lors de la recherche de la catégorie par slug:', error);
            throw error;
        }
    }

    static async update(id, { nom_categorie }) {
        try {
            const slug = slugify(nom_categorie, { lower: true, strict: true });
            const [result] = await db.query(
                'UPDATE categories SET nom_categorie = ?, slug = ? WHERE id_categorie = ?',
                [nom_categorie, slug, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la catégorie:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const [result] = await db.query('DELETE FROM categories WHERE id_categorie = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la suppression de la catégorie:', error);
            throw error;
        }
    }

    static async getAll() {
        try {
            const [rows] = await db.query('SELECT * FROM categories ORDER BY nom_categorie');
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des catégories:', error);
            throw error;
        }
    }

    static async getArticles(categorieId) {
        try {
            const [rows] = await db.query(
                `SELECT a.*, 
                        j.nom as journaliste_nom, 
                        j.prenom as journaliste_prenom
                FROM articles a
                LEFT JOIN journalistes j ON a.id_journaliste = j.id_journaliste
                WHERE a.id_categorie = ?
                ORDER BY a.date_publication DESC`,
                [categorieId]
            );
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des articles de la catégorie:', error);
            throw error;
        }
    }
}

module.exports = Categorie; 