const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const Journaliste = require('../models/Journaliste');
const multer = require('multer');
const path = require('path');

// Configuration de multer pour le stockage des images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../client/images/articles'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite de 5MB
    },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Seules les images (jpeg, jpg, png, webp) sont autorisées'));
    }
});

// Récupérer tous les articles d'une catégorie
router.get('/categorie/:categorie', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const articles = await Article.getByCategorie(req.params.categorie, {
            page: parseInt(page),
            limit: parseInt(limit)
        });
        res.json(articles);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des articles', error: error.message });
    }
});

// Récupérer un article par son slug
router.get('/slug/:slug', async (req, res) => {
    try {
        const article = await Article.findBySlug(req.params.slug);
        if (!article) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }
        res.json(article);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération de l\'article', error: error.message });
    }
});

// Récupérer les articles à la une
router.get('/', async (req, res) => {
    try {
        const articles = await Article.getAll();
        // Formater les articles pour le front-end
        const formattedArticles = articles.map(article => ({
            id: article.id_article,
            titre: article.titre,
            contenu: article.contenu,
            image: article.image_principale,
            categorie: article.categorie_nom,
            id_categorie: article.id_categorie,
            date_publication: article.date_publication,
            journaliste_id: article.id_journaliste,
            journaliste_nom: article.journaliste_nom,
            journaliste_prenom: article.journaliste_prenom,
            statut: article.statut || 'brouillon',
            featured: article.featured
        }));
        res.json({
            success: true,
            data: formattedArticles
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des articles:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// Route pour obtenir les articles mis en avant
router.get('/featured', async (req, res) => {
    try {
        const articles = await Article.getFeatured(5);
        const formattedArticles = articles.map(article => ({
            id: article.id_article,
            title: article.titre,
            excerpt: article.contenu.substring(0, 150) + '...',
            image: article.image_principale,
            category: article.categorie_nom,
            date: article.date_publication,
            author: `${article.journaliste_prenom} ${article.journaliste_nom}`
        }));
        res.json(formattedArticles);
    } catch (error) {
        console.error('Erreur lors de la récupération des articles mis en avant:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour obtenir un article spécifique
router.get('/:id', async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }
        const formattedArticle = {
            id: article.id_article,
            title: article.titre,
            content: article.contenu,
            image: article.image_principale,
            category: article.categorie_nom,
            date: article.date_publication,
            author: `${article.journaliste_prenom} ${article.journaliste_nom}`,
            featured: article.featured
        };
        res.json(formattedArticle);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'article:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Créer un nouvel article
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { titre, contenu, id_categorie, id_journaliste, type_contenu = 'texte', featured = false } = req.body;

        // Validation du titre (seul champ obligatoire)
        if (!titre) {
            return res.status(400).json({ 
                success: false,
                message: 'Le titre est obligatoire'
            });
        }

        // Gestion de l'image
        const image_principale = req.file ? `/images/articles/${req.file.filename}` : null;

        // Conversion des valeurs numériques
        const articleData = {
            titre,
            contenu: contenu || null,
            id_categorie: id_categorie ? parseInt(id_categorie) : null,
            id_journaliste: id_journaliste ? parseInt(id_journaliste) : null,
            type_contenu: type_contenu || 'texte',
            featured: featured === 'true' || featured === true ? 1 : 0,
            image_principale
        };

        const articleId = await Article.create(articleData);

        res.status(201).json({ 
            success: true,
            id: articleId, 
            message: 'Article créé avec succès' 
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'article:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur lors de la création de l\'article', 
            error: error.message 
        });
    }
});

// Mettre à jour un article
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { titre, contenu, categorie, tags } = req.body;
        const image_principale = req.file ? `/images/articles/${req.file.filename}` : req.body.image_principale;

        const success = await Article.update(req.params.id, {
            titre,
            contenu,
            categorie,
            image_principale,
            tags: tags ? JSON.parse(tags) : []
        });

        if (!success) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }

        res.json({ message: 'Article mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'article', error: error.message });
    }
});

// Supprimer un article
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    if (!id || isNaN(id) || parseInt(id) <= 0) {
        return res.status(400).json({ message: 'ID d\'article invalide' });
    }
    try {
        const success = await Article.delete(id);
        if (!success) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }
        res.json({ message: 'Article supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'article', error: error.message });
    }
});

// Publier un article
router.post('/:id/publier', async (req, res) => {
    try {
        const success = await Article.publier(req.params.id);
        if (!success) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }
        res.json({ message: 'Article publié avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la publication de l\'article', error: error.message });
    }
});

// Archiver un article
router.post('/:id/archiver', async (req, res) => {
    try {
        const success = await Article.archiver(req.params.id);
        if (!success) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }
        res.json({ message: 'Article archivé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'archivage de l\'article', error: error.message });
    }
});

// Marquer un article comme featured
router.post('/:id/featured', async (req, res) => {
    try {
        const { featured } = req.body;
        const success = await Article.setFeatured(req.params.id, featured);
        if (!success) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }
        res.json({ message: featured ? 'Article mis en avant avec succès' : 'Article retiré des articles mis en avant' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour du statut featured', error: error.message });
    }
});

module.exports = router;