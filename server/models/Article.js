const db = require('../db');
const slugify = require('slugify');
const path = require('path');
const fs = require('fs');

class Article {
    static async create({ titre, contenu, id_journaliste, id_categorie, type_contenu = 'texte', featured = false, image_principale = null, statut = 'brouillon' }) {
        console.log('=== Début de Article.create ===');
        console.log('Paramètres reçus:', {
            titre,
            contenu: contenu ? contenu.substring(0, 50) + '...' : null,
            id_journaliste,
            id_categorie,
            type_contenu,
            featured,
            image_principale,
            statut
        });

        let connection;
        try {
            console.log('Obtention de la connexion...');
            connection = await db.getConnection();
            console.log('Connexion obtenue');

            console.log('Début de la transaction...');
            await connection.beginTransaction();
            console.log('Transaction démarrée');

            // Validation des données
            console.log('Validation des données...');
            if (!titre || !contenu) {
                throw new Error('Le titre et le contenu sont obligatoires');
            }

            // Vérification de l'existence du journaliste
            if (id_journaliste) {
                console.log('Vérification du journaliste:', id_journaliste);
                const [journalistes] = await connection.query(
                    'SELECT id_journaliste FROM journalistes WHERE id_journaliste = ?',
                    [id_journaliste]
                );
                if (journalistes.length === 0) {
                    throw new Error('Le journaliste spécifié n\'existe pas');
                }
                console.log('Journaliste trouvé');
            }

            // Vérification de l'existence de la catégorie
            if (id_categorie) {
                console.log('Vérification de la catégorie:', id_categorie);
                const [categories] = await connection.query(
                    'SELECT id_categorie FROM categories WHERE id_categorie = ?',
                    [id_categorie]
                );
                if (categories.length === 0) {
                    throw new Error('La catégorie spécifiée n\'existe pas');
                }
                console.log('Catégorie trouvée');
            }

            // Conversion des valeurs
            console.log('Conversion des valeurs...');
            const featuredValue = featured ? 1 : 0;
            const typeContenuValue = ['texte', 'video', 'image', 'mixte'].includes(type_contenu) ? type_contenu : 'texte';
            const statutValue = ['brouillon', 'publie', 'archive'].includes(statut) ? statut : 'brouillon';

            // Insertion de l'article
            console.log('Tentative d\'insertion...');
            const [result] = await connection.query(
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
            
            console.log('Article inséré avec succès');
            console.log('Validation de la transaction...');
            await connection.commit();
            console.log('Transaction validée');
            
            return result.insertId;
        } catch (error) {
            console.error('Erreur dans Article.create:', error);
            console.error('Stack trace:', error.stack);
            if (connection) {
                console.log('Rollback de la transaction...');
                await connection.rollback();
                console.log('Transaction annulée');
            }
            throw error;
        } finally {
            if (connection) {
                console.log('Libération de la connexion...');
                connection.release();
                console.log('Connexion libérée');
            }
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
            
            // Vérifier si l'article existe
            const [article] = await db.query(
                'SELECT id_article, image_principale FROM articles WHERE id_article = ?',
                [id]
            );

            if (!article || article.length === 0) {
                console.log('Article non trouvé:', id);
                return false;
            }

            // Supprimer l'image associée si elle existe
            if (article[0].image_principale) {
                const imagePath = path.join(__dirname, '../../client', article[0].image_principale);
                try {
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                        console.log('Image supprimée:', imagePath);
                    }
                } catch (error) {
                    console.error('Erreur lors de la suppression de l\'image:', error);
                }
            }

            // Supprimer l'article
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
                SELECT 
                    a.*, 
                    j.nom as journaliste_nom, 
                    j.prenom as journaliste_prenom,
                    c.nom_categorie as categorie_nom,
                    c.id_categorie,
                    DATE_FORMAT(a.date_publication, '%Y-%m-%d %H:%i:%s') as date_publication,
                    DATE_FORMAT(a.date_archivage, '%Y-%m-%d %H:%i:%s') as date_archivage
                FROM articles a 
                LEFT JOIN journalistes j ON a.id_journaliste = j.id_journaliste 
                LEFT JOIN categories c ON a.id_categorie = c.id_categorie 
                WHERE a.statut = 'archive'
                ORDER BY a.date_archivage DESC 
                LIMIT ? OFFSET ?`,
                [limit, offset]
            );
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des archives:', error);
            throw error;
        }
    }

    static async restaurer(id) {
        try {
            const [result] = await db.query(
                'UPDATE articles SET statut = "brouillon", date_archivage = NULL, raison_archivage = NULL WHERE id_article = ?',
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