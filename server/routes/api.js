const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const slugify = require('slugify');

// Configuration de Multer pour l'upload des images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const type = req.path.includes('journalistes') ? 'journalistes' : 'articles';
        cb(null, path.join(__dirname, `../public/uploads/${type}`));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Seules les images sont autorisées'));
        }
    }
});

// Routes pour les articles
router.get('/articles', async (req, res) => {
    try {
        const [articles] = await pool.query(`
            SELECT a.*, j.nom as journaliste_nom, j.prenom as journaliste_prenom 
            FROM articles a 
            LEFT JOIN journalistes j ON a.journaliste_id = j.id 
            ORDER BY a.date_publication DESC
        `);
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/articles', upload.single('image'), async (req, res) => {
    try {
        const { titre, contenu, categorie, journaliste_id, tags } = req.body;
        const slug = slugify(titre, { lower: true, strict: true });
        const image_url = req.file ? `/uploads/articles/${req.file.filename}` : null;

        const [result] = await pool.query(`
            INSERT INTO articles (titre, slug, contenu, categorie, journaliste_id, image_url, statut) 
            VALUES (?, ?, ?, ?, ?, ?, 'brouillon')
        `, [titre, slug, contenu, categorie, journaliste_id, image_url]);

        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            for (const tag of tagArray) {
                await pool.query('INSERT INTO tags (nom) VALUES (?) ON DUPLICATE KEY UPDATE id=id', [tag]);
                const [tagResult] = await pool.query('SELECT id FROM tags WHERE nom = ?', [tag]);
                await pool.query('INSERT INTO articles_tags (article_id, tag_id) VALUES (?, ?)', 
                    [result.insertId, tagResult[0].id]);
            }
        }

        res.status(201).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/articles/:id', upload.single('image'), async (req, res) => {
    try {
        const { titre, contenu, categorie, journaliste_id, tags } = req.body;
        const slug = slugify(titre, { lower: true, strict: true });
        const image_url = req.file ? `/uploads/articles/${req.file.filename}` : null;

        let query = `
            UPDATE articles 
            SET titre = ?, slug = ?, contenu = ?, categorie = ?, journaliste_id = ?
        `;
        let params = [titre, slug, contenu, categorie, journaliste_id];

        if (image_url) {
            query += ', image_url = ?';
            params.push(image_url);
        }

        query += ' WHERE id = ?';
        params.push(req.params.id);

        await pool.query(query, params);

        // Mise à jour des tags
        await pool.query('DELETE FROM articles_tags WHERE article_id = ?', [req.params.id]);
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            for (const tag of tagArray) {
                await pool.query('INSERT INTO tags (nom) VALUES (?) ON DUPLICATE KEY UPDATE id=id', [tag]);
                const [tagResult] = await pool.query('SELECT id FROM tags WHERE nom = ?', [tag]);
                await pool.query('INSERT INTO articles_tags (article_id, tag_id) VALUES (?, ?)', 
                    [req.params.id, tagResult[0].id]);
            }
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/articles/:id/publier', async (req, res) => {
    try {
        await pool.query('UPDATE articles SET statut = "publie", date_publication = NOW() WHERE id = ?', 
            [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/articles/:id/archiver', async (req, res) => {
    try {
        await pool.query('UPDATE articles SET statut = "archive" WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/articles/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM articles_tags WHERE article_id = ?', [req.params.id]);
        await pool.query('DELETE FROM articles WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 