const express = require('express');
const router = express.Router();
const Journaliste = require('../models/Journaliste');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration de multer pour le stockage des photos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../client/images/journalistes');
        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
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

// Récupérer tous les journalistes
router.get('/', async (req, res) => {
    try {
        const journalistes = await Journaliste.getAllWithArticleCount();
        res.json({ success: true, data: journalistes });
    } catch (error) {
        console.error('Erreur lors de la récupération des journalistes:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des journalistes', 
            error: error.message 
        });
    }
});

// Récupérer un journaliste par son ID
router.get('/:id', async (req, res) => {
    try {
        const journaliste = await Journaliste.findById(req.params.id);
        if (!journaliste) {
            return res.status(404).json({ 
                success: false, 
                message: 'Journaliste non trouvé' 
            });
        }
        res.json({ 
            success: true, 
            data: journaliste 
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du journaliste:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération du journaliste', 
            error: error.message 
        });
    }
});

// Récupérer les articles d'un journaliste
router.get('/:id/articles', async (req, res) => {
    try {
        const articles = await Journaliste.getArticles(req.params.id);
        res.json({ 
            success: true, 
            data: articles 
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des articles:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des articles', 
            error: error.message 
        });
    }
});

// Créer un nouveau journaliste
router.post('/', upload.single('photo'), async (req, res) => {
    try {
        const { nom, prenom, email } = req.body;
        
        // Validation des champs obligatoires
        const validationErrors = [];
        if (!nom || nom.trim() === '') {
            validationErrors.push('Le nom est obligatoire');
        }
        if (!prenom || prenom.trim() === '') {
            validationErrors.push('Le prénom est obligatoire');
        }
        if (!email || email.trim() === '') {
            validationErrors.push('L\'email est obligatoire');
        }
        
        // Validation du format de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            validationErrors.push('Format d\'email invalide');
        }
        
        // Vérifier si l'email existe déjà
        if (email) {
            const existingJournaliste = await Journaliste.findByEmail(email);
            if (existingJournaliste) {
                validationErrors.push('Cet email est déjà utilisé');
            }
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Erreurs de validation',
                errors: validationErrors
            });
        }

        const photo_url = req.file ? `/images/journalistes/${req.file.filename}` : null;

        const journalisteId = await Journaliste.create({
            nom: nom.trim(),
            prenom: prenom.trim(),
            email: email.trim(),
            photo_url
        });

        res.status(201).json({ 
            success: true,
            message: 'Journaliste créé avec succès',
            data: {
                id: journalisteId,
                nom: nom.trim(),
                prenom: prenom.trim(),
                email: email.trim(),
                photo_url
            }
        });
    } catch (error) {
        // Suppression de l'image en cas d'erreur
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Erreur lors de la suppression du fichier:', unlinkError);
            }
        }

        console.error('Erreur lors de la création du journaliste:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur lors de la création du journaliste', 
            error: error.message 
        });
    }
});

// Mettre à jour un journaliste
router.put('/:id', upload.single('photo'), async (req, res) => {
    try {
        const { nom, prenom, email } = req.body;
        const photo_url = req.file ? `/images/journalistes/${req.file.filename}` : req.body.photo_url;

        // Validation des champs
        const validationErrors = [];
        if (!nom || nom.trim() === '') {
            validationErrors.push('Le nom est obligatoire');
        }
        if (!prenom || prenom.trim() === '') {
            validationErrors.push('Le prénom est obligatoire');
        }
        if (!email || email.trim() === '') {
            validationErrors.push('L\'email est obligatoire');
        }

        // Validation du format de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            validationErrors.push('Format d\'email invalide');
        }

        // Vérifier si l'email existe déjà (sauf pour le même journaliste)
        if (email) {
            const existingJournaliste = await Journaliste.findByEmail(email);
            if (existingJournaliste && existingJournaliste.id_journaliste !== parseInt(req.params.id)) {
                validationErrors.push('Cet email est déjà utilisé par un autre journaliste');
            }
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Erreurs de validation',
                errors: validationErrors
            });
        }

        const success = await Journaliste.update(req.params.id, {
            nom: nom.trim(),
            prenom: prenom.trim(),
            email: email.trim(),
            photo_url
        });

        if (!success) {
            return res.status(404).json({ 
                success: false,
                message: 'Journaliste non trouvé' 
            });
        }

        res.json({ 
            success: true,
            message: 'Journaliste mis à jour avec succès' 
        });
    } catch (error) {
        // Suppression de l'image en cas d'erreur
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Erreur lors de la suppression du fichier:', unlinkError);
            }
        }

        console.error('Erreur lors de la mise à jour du journaliste:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur lors de la mise à jour du journaliste', 
            error: error.message 
        });
    }
});

// Supprimer un journaliste
router.delete('/:id', async (req, res) => {
    try {
        const success = await Journaliste.delete(req.params.id);
        if (!success) {
            return res.status(404).json({ 
                success: false,
                message: 'Journaliste non trouvé' 
            });
        }
        res.json({ 
            success: true,
            message: 'Journaliste supprimé avec succès' 
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du journaliste:', error);
        // Gestion explicite de l'erreur de clé étrangère MySQL
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
            return res.status(400).json({ 
                success: false,
                message: 'Impossible de supprimer ce journaliste : il/elle possède encore des articles.' 
            });
        }
        res.status(500).json({ 
            success: false,
            message: 'Erreur lors de la suppression du journaliste', 
            error: error.message 
        });
    }
});

module.exports = router;