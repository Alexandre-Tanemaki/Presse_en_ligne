const express = require('express');
const router = express.Router();
const db = require('../db');

// Route pour obtenir les statistiques globales
router.get('/', async (req, res) => {
    try {
        // Récupérer le nombre total d'articles
        const [articlesCount] = await db.query(
            'SELECT COUNT(*) as total FROM articles'
        );

        // Récupérer le nombre d'articles par catégorie
        const [articlesByCategory] = await db.query(`
            SELECT c.nom_categorie, COUNT(a.id_article) as count
            FROM categories c
            LEFT JOIN articles a ON c.id_categorie = a.id_categorie
            GROUP BY c.id_categorie, c.nom_categorie
            ORDER BY count DESC
        `);

        // Récupérer le nombre d'articles par journaliste
        const [articlesByJournalist] = await db.query(`
            SELECT 
                j.nom,
                j.prenom,
                COUNT(a.id_article) as count
            FROM journalistes j
            LEFT JOIN articles a ON j.id_journaliste = a.id_journaliste
            GROUP BY j.id_journaliste, j.nom, j.prenom
            ORDER BY count DESC
        `);

        // Récupérer les articles les plus récents
        const [recentArticles] = await db.query(`
            SELECT 
                a.titre,
                a.date_publication,
                c.nom_categorie,
                CONCAT(j.prenom, ' ', j.nom) as auteur
            FROM articles a
            LEFT JOIN categories c ON a.id_categorie = c.id_categorie
            LEFT JOIN journalistes j ON a.id_journaliste = j.id_journaliste
            ORDER BY a.date_publication DESC
            LIMIT 5
        `);

        // Récupérer le nombre total de journalistes et de catégories
        const [counts] = await db.query(`
            SELECT
                (SELECT COUNT(*) FROM journalistes) as journalistes_count,
                (SELECT COUNT(*) FROM categories) as categories_count
        `);

        res.json({
            success: true,
            data: {
                total_articles: articlesCount[0].total,
                articles_by_category: articlesByCategory,
                articles_by_journalist: articlesByJournalist,
                recent_articles: recentArticles,
                total_journalistes: counts[0].journalistes_count,
                total_categories: counts[0].categories_count
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
});

module.exports = router; 