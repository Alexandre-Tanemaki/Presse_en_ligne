const express = require('express');
const router = express.Router();
const Journaliste = require('../models/Journaliste');
const multer = require('multer');
const path = require('path');

// Configuration de multer pour le stockage des photos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../client/images/journalistes'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // Limite de 2MB
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

// Récupérer tous les journalistes
router.get('/', async (req, res) => {
    try {
        const journalistes = await Journaliste.getAll();
        res.json(journalistes);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des journalistes', error: error.message });
    }
});

// Récupérer un journaliste par son ID
router.get('/:id', async (req, res) => {
    try {
        const journaliste = await Journaliste.findById(req.params.id);
        if (!journaliste) {
            return res.status(404).json({ message: 'Journaliste non trouvé' });
        }
        res.json(journaliste);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération du journaliste', error: error.message });
    }
});

// Récupérer les articles d'un journaliste
router.get('/:id/articles', async (req, res) => {
    try {
        const articles = await Journaliste.getArticles(req.params.id);
        res.json(articles);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des articles', error: error.message });
    }
});

// Créer un nouveau journaliste
router.post('/', upload.single('photo'), async (req, res) => {
    try {
        const { nom, prenom, email } = req.body;
        const photo_url = req.file ? `/images/journalistes/${req.file.filename}` : null;

        const journalisteId = await Journaliste.create({
            nom,
            prenom,
            email,
            photo_url
        });

        res.status(201).json({ id: journalisteId, message: 'Journaliste créé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création du journaliste', error: error.message });
    }
});

// Mettre à jour un journaliste
router.put('/:id', upload.single('photo'), async (req, res) => {
    try {
        const { nom, prenom, email } = req.body;
        const photo_url = req.file ? `/images/journalistes/${req.file.filename}` : req.body.photo_url;

        const success = await Journaliste.update(req.params.id, {
            nom,
            prenom,
            email,
            photo_url
        });

        if (!success) {
            return res.status(404).json({ message: 'Journaliste non trouvé' });
        }

        res.json({ message: 'Journaliste mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour du journaliste', error: error.message });
    }
});

// Supprimer un journaliste
router.delete('/:id', async (req, res) => {
    try {
        const success = await Journaliste.delete(req.params.id);
        if (!success) {
            return res.status(404).json({ message: 'Journaliste non trouvé' });
        }
        res.json({ message: 'Journaliste supprimé avec succès' });
    } catch (error) {
        // Gestion explicite de l'erreur de clé étrangère MySQL
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
            return res.status(400).json({ message: 'Impossible de supprimer ce journaliste : il/elle possède encore des articles.' });
        }
        res.status(500).json({ message: 'Erreur lors de la suppression du journaliste', error: error.message });
    }
});

module.exports = router;