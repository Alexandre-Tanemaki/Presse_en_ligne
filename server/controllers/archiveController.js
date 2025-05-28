const Article = require('../models/Article');

class ArchiveController {
    static async archiverArticle(req, res) {
        try {
            const { id } = req.params;
            const { raison } = req.body;

            const success = await Article.archiver(id, raison);
            
            if (success) {
                res.json({ message: 'Article archivé avec succès' });
            } else {
                res.status(404).json({ message: 'Article non trouvé' });
            }
        } catch (error) {
            console.error('Erreur lors de l\'archivage:', error);
            res.status(500).json({ message: 'Erreur lors de l\'archivage de l\'article' });
        }
    }

    static async getArchives(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const articles = await Article.getArchives({ 
                page: parseInt(page), 
                limit: parseInt(limit) 
            });
            res.json(articles);
        } catch (error) {
            console.error('Erreur lors de la récupération des archives:', error);
            res.status(500).json({ message: 'Erreur lors de la récupération des articles archivés' });
        }
    }

    static async restaurerArticle(req, res) {
        try {
            const { id } = req.params;
            const success = await Article.restaurer(id);
            
            if (success) {
                res.json({ message: 'Article restauré avec succès' });
            } else {
                res.status(404).json({ message: 'Article non trouvé' });
            }
        } catch (error) {
            console.error('Erreur lors de la restauration:', error);
            res.status(500).json({ message: 'Erreur lors de la restauration de l\'article' });
        }
    }
}

module.exports = ArchiveController; 