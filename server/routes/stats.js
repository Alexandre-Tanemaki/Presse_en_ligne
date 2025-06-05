const express = require('express');
const router = express.Router();
const db = require('../db');

// Route pour obtenir les statistiques globales
router.get('/', async (req, res) => {
    try {
        // Statistiques des articles
        const [articlesStats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN statut = 'publie' THEN 1 ELSE 0 END) as articlesPublies,
                SUM(CASE WHEN statut = 'brouillon' THEN 1 ELSE 0 END) as articlesEnAttente,
                COUNT(DISTINCT id_journaliste) as journalistesActifs
            FROM articles
        `);

        // Statistiques des vues (à implémenter plus tard)
        const vuesTotales = 0;
        const vuesTrend = 0;

        // Articles par catégorie pour le graphique
        const [articlesByCategory] = await db.query(`
            SELECT 
                c.nom_categorie as label,
                COUNT(a.id_article) as value
            FROM categories c
            LEFT JOIN articles a ON c.id_categorie = a.id_categorie
            GROUP BY c.id_categorie, c.nom_categorie
            ORDER BY value DESC
        `);

        // Publications par mois pour le graphique
        const [articlesByMonth] = await db.query(`
            SELECT 
                DATE_FORMAT(date_publication, '%Y-%m') as mois,
                COUNT(*) as count
            FROM articles
            WHERE date_publication >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(date_publication, '%Y-%m')
            ORDER BY mois ASC
        `);

        // Calculer la tendance des articles
        const [lastMonthArticles] = await db.query(`
            SELECT COUNT(*) as count
            FROM articles
            WHERE date_publication >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `);

        const [previousMonthArticles] = await db.query(`
            SELECT COUNT(*) as count
            FROM articles
            WHERE date_publication >= DATE_SUB(NOW(), INTERVAL 2 MONTH)
            AND date_publication < DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `);

        const articlesTrend = previousMonthArticles[0].count === 0 ? 0 :
            ((lastMonthArticles[0].count - previousMonthArticles[0].count) / previousMonthArticles[0].count) * 100;

        res.json({
            success: true,
            data: {
                articlesPublies: articlesStats[0].articlesPublies || 0,
                articlesEnAttente: articlesStats[0].articlesEnAttente || 0,
                journalistesActifs: articlesStats[0].journalistesActifs || 0,
                vuesTotales: vuesTotales,
                articlesTrend: Math.round(articlesTrend),
                vuesTrend: vuesTrend,
                categoriesData: articlesByCategory,
                publicationsData: articlesByMonth
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