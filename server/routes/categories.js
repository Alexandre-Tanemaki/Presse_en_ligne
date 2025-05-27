const express = require('express');
const router = express.Router();
const Categorie = require('../models/Categorie');

// Récupérer toutes les catégories
router.get('/', async (req, res) => {
    try {
        const categories = await Categorie.getAll();
        res.json(categories);
    } catch (error) {
        console.error('Erreur lors de la récupération des catégories:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des catégories', error: error.message });
    }
});

// Récupérer une catégorie par son ID
router.get('/:id', async (req, res) => {
    try {
        const categorie = await Categorie.findById(req.params.id);
        if (!categorie) {
            return res.status(404).json({ message: 'Catégorie non trouvée' });
        }
        res.json(categorie);
    } catch (error) {
        console.error('Erreur lors de la récupération de la catégorie:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération de la catégorie', error: error.message });
    }
});

// Récupérer une catégorie par son slug
router.get('/slug/:slug', async (req, res) => {
    try {
        const categorie = await Categorie.findBySlug(req.params.slug);
        if (!categorie) {
            return res.status(404).json({ message: 'Catégorie non trouvée' });
        }
        res.json(categorie);
    } catch (error) {
        console.error('Erreur lors de la récupération de la catégorie:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération de la catégorie', error: error.message });
    }
});

// Créer une nouvelle catégorie
router.post('/', async (req, res) => {
    try {
        const { nom_categorie } = req.body;
        if (!nom_categorie) {
            return res.status(400).json({ message: 'Le nom de la catégorie est requis' });
        }
        const id = await Categorie.create({ nom_categorie });
        res.status(201).json({ id, message: 'Catégorie créée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la création de la catégorie:', error);
        res.status(500).json({ message: 'Erreur lors de la création de la catégorie', error: error.message });
    }
});

// Mettre à jour une catégorie
router.put('/:id', async (req, res) => {
    try {
        const { nom_categorie } = req.body;
        if (!nom_categorie) {
            return res.status(400).json({ message: 'Le nom de la catégorie est requis' });
        }
        const success = await Categorie.update(req.params.id, { nom_categorie });
        if (!success) {
            return res.status(404).json({ message: 'Catégorie non trouvée' });
        }
        res.json({ message: 'Catégorie mise à jour avec succès' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la catégorie:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la catégorie', error: error.message });
    }
});

// Supprimer une catégorie
router.delete('/:id', async (req, res) => {
    try {
        const success = await Categorie.delete(req.params.id);
        if (!success) {
            return res.status(404).json({ message: 'Catégorie non trouvée' });
        }
        res.json({ message: 'Catégorie supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de la catégorie:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression de la catégorie', error: error.message });
    }
});

// Récupérer tous les articles d'une catégorie
router.get('/:id/articles', async (req, res) => {
    try {
        const articles = await Categorie.getArticles(req.params.id);
        res.json(articles);
    } catch (error) {
        console.error('Erreur lors de la récupération des articles de la catégorie:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des articles', error: error.message });
    }
});

module.exports = router;