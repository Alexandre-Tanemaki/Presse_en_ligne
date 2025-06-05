const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const Journaliste = require('../models/Journaliste');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const fs = require('fs');

// Configuration de multer pour le stockage des images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../client/images/articles');
        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Nettoyer le nom du fichier original
        const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + cleanFileName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite de 5MB
    },
    fileFilter: function (req, file, cb) {
        // Vérification du type MIME
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
            return cb(new Error('Format de fichier non autorisé. Utilisez JPEG, PNG ou WebP.'), false);
        }

        // Vérification de l'extension
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (!extname) {
            return cb(new Error('Extension de fichier non autorisée. Utilisez .jpg, .jpeg, .png ou .webp'), false);
        }

        cb(null, true);
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
            id_article: article.id_article,
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
            id_article: article.id_article,
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

// Route pour la recherche d'articles
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.json({
                success: true,
                data: []
            });
        }

        const articles = await Article.search(q);
        const formattedArticles = articles.map(article => ({
            id_article: article.id_article,
            titre: article.titre,
            contenu: article.contenu,
            image: article.image_principale,
            categorie: article.categorie_nom,
            id_categorie: article.id_categorie,
            date_publication: article.date_publication,
            journaliste_id: article.id_journaliste,
            journaliste_nom: article.journaliste_nom,
            journaliste_prenom: article.journaliste_prenom,
            statut: article.statut,
            featured: article.featured
        }));

        res.json({
            success: true,
            data: formattedArticles
        });
    } catch (error) {
        console.error('Erreur lors de la recherche d\'articles:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la recherche d\'articles',
            error: error.message
        });
    }
});

// Route pour obtenir les articles archivés
router.get('/archives', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const archives = await Article.getArchives({ page: parseInt(page), limit: parseInt(limit) });
        
        const formattedArchives = archives.map(article => ({
            id: article.id_article,
            titre: article.titre,
            contenu: article.contenu,
            image: article.image_principale,
            categorie: article.categorie_nom,
            id_categorie: article.id_categorie,
            date_publication: article.date_publication,
            date_archivage: article.date_archivage,
            raison_archivage: article.raison_archivage,
            journaliste_id: article.id_journaliste,
            journaliste_nom: article.journaliste_nom,
            journaliste_prenom: article.journaliste_prenom,
            statut: 'archive'
        }));

        res.json({
            success: true,
            data: formattedArchives
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des archives:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des archives'
        });
    }
});

// Créer un nouvel article
router.post('/', upload.single('image'), async (req, res) => {
    try {
        console.log('=== Début de la création d\'article ===');
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        console.log('File:', req.file);

        const { titre, contenu, id_categorie, id_journaliste, type_contenu = 'texte', featured = false } = req.body;

        console.log('Données extraites:');
        console.log('- titre:', titre);
        console.log('- contenu:', contenu);
        console.log('- id_categorie:', id_categorie);
        console.log('- id_journaliste:', id_journaliste);
        console.log('- type_contenu:', type_contenu);
        console.log('- featured:', featured);

        // Validation des champs obligatoires
        const validationErrors = [];
        
        console.log('Validation des champs...');
        
        if (!titre || titre.trim() === '') {
            console.log('Erreur: titre manquant');
            validationErrors.push('Le titre est obligatoire');
        }
        if (!contenu || contenu.trim() === '') {
            console.log('Erreur: contenu manquant');
            validationErrors.push('Le contenu est obligatoire');
        }
        if (!id_categorie) {
            console.log('Erreur: catégorie manquante');
            validationErrors.push('La catégorie est obligatoire');
        }
        if (!id_journaliste) {
            console.log('Erreur: journaliste manquant');
            validationErrors.push('Le journaliste est obligatoire');
        }

        // Validation des types de données
        if (id_categorie && isNaN(parseInt(id_categorie))) {
            console.log('Erreur: id_categorie n\'est pas un nombre:', id_categorie);
            validationErrors.push('L\'ID de la catégorie doit être un nombre');
        }
        if (id_journaliste && isNaN(parseInt(id_journaliste))) {
            console.log('Erreur: id_journaliste n\'est pas un nombre:', id_journaliste);
            validationErrors.push('L\'ID du journaliste doit être un nombre');
        }

        // Si des erreurs de validation sont présentes
        if (validationErrors.length > 0) {
            console.log('Erreurs de validation trouvées:', validationErrors);
            // Si une image a été uploadée, la supprimer
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                    console.log('Image supprimée:', req.file.path);
                } catch (unlinkError) {
                    console.error('Erreur lors de la suppression du fichier:', unlinkError);
                }
            }
            return res.status(400).json({ 
                success: false,
                message: 'Erreurs de validation',
                errors: validationErrors
            });
        }

        // Gestion de l'image
        const image_principale = req.file ? `/images/articles/${req.file.filename}` : null;
        console.log('Image principale:', image_principale);

        // Création de l'article
        try {
            console.log('Tentative de création de l\'article...');
            const articleData = {
                titre: titre.trim(),
                contenu: contenu.trim(),
                id_categorie: parseInt(id_categorie),
                id_journaliste: parseInt(id_journaliste),
                type_contenu: type_contenu || 'texte',
                featured: featured === 'true' || featured === true,
                image_principale
            };
            console.log('Données de l\'article à créer:', articleData);

            const articleId = await Article.create(articleData);
            console.log('Article créé avec succès, ID:', articleId);

            res.status(201).json({ 
                success: true,
                message: 'Article créé avec succès',
                data: {
                    id_article: articleId,
                    ...articleData
                }
            });
        } catch (createError) {
            console.error('Erreur lors de la création de l\'article:', createError);
            // Si une erreur survient lors de la création, supprimer l'image si elle existe
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                    console.log('Image supprimée après erreur:', req.file.path);
                } catch (unlinkError) {
                    console.error('Erreur lors de la suppression du fichier:', unlinkError);
                }
            }
            throw createError;
        }
    } catch (error) {
        console.error('Erreur globale:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Erreur lors de la création de l\'article'
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
        return res.status(400).json({ 
            success: false,
            message: 'ID d\'article invalide' 
        });
    }
    try {
        const success = await Article.delete(id);
        if (!success) {
            return res.status(404).json({ 
                success: false,
                message: 'Article non trouvé' 
            });
        }
        res.json({ 
            success: true,
            message: 'Article supprimé avec succès' 
        });
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur lors de la suppression de l\'article', 
            error: error.message 
        });
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

// Route pour archiver un article
router.post('/:id/archiver', async (req, res) => {
    try {
        const { raison } = req.body;
        const success = await Article.archiver(req.params.id, raison);
        
        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Article non trouvé'
            });
        }

        res.json({
            success: true,
            message: 'Article archivé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de l\'archivage:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'archivage de l\'article'
        });
    }
});

// Route pour restaurer un article archivé
router.post('/:id/restaurer', async (req, res) => {
    try {
        const success = await Article.restaurer(req.params.id);
        
        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Article non trouvé'
            });
        }

        res.json({
            success: true,
            message: 'Article restauré avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la restauration:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la restauration de l\'article'
        });
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