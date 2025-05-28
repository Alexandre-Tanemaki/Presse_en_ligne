const express = require('express');
const router = express.Router();
const ArchiveController = require('../controllers/archiveController');

// Route pour archiver un article
router.post('/:id', ArchiveController.archiverArticle);

// Route pour récupérer les articles archivés
router.get('/', ArchiveController.getArchives);

// Route pour restaurer un article archivé
router.post('/:id/restaurer', ArchiveController.restaurerArticle);

module.exports = router; 