require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const apiRoutes = require('./routes/api');
const articlesRoutes = require('./routes/articles');
const archiveRoutes = require('./routes/archiveRoutes');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares de base
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Gestion des erreurs de parsing JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Erreur de parsing JSON:', err);
        return res.status(400).json({ 
            success: false, 
            message: 'Format JSON invalide' 
        });
    }
    next();
});

// Routes API
const journalistesRouter = require('./routes/journalistes');
const categoriesRouter = require('./routes/categories');
const statsRouter = require('./routes/stats');

app.use('/api/articles', articlesRoutes);
app.use('/api/journalistes', journalistesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/archives', archiveRoutes);

// Servir les fichiers statiques du dossier client
app.use(express.static(path.join(__dirname, '../client')));
app.use('/categories', express.static(path.join(__dirname, '../client/categories')));
app.use('/css', express.static(path.join(__dirname, '../client/css')));
app.use('/js', express.static(path.join(__dirname, '../client/js')));
app.use('/images', express.static(path.join(__dirname, '../client/images')));

// Routes API
app.use('/api', apiRoutes);

// Route de test API
app.get('/api/test', (req, res) => {
    res.json({ message: 'API fonctionne correctement' });
});

// Route catch-all pour servir les fichiers HTML de catégorie ou index.html
app.get('*', (req, res) => {
    const filePath = path.join(__dirname, '../client', req.path);
    if (req.path.endsWith('.html') && fs.existsSync(filePath)) {
        return res.sendFile(filePath);
    }
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Route de test base de données
app.get('/test-db', async (req, res) => {
    try {
        const result = await db.query('SELECT 1 as test');
        res.json({
            success: true,
            message: 'Connexion à la base de données réussie',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur de connexion à la base de données',
            error: error.message
        });
    }
});

// Route pour l'interface d'administration
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/admin/index.html'));
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erreur serveur' });
});

// Fonction pour démarrer le serveur
const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`
        =================================
        🚀 Serveur démarré sur http://localhost:${port}
        
        Routes disponibles :
        - GET / : Page d'accueil
        - GET /api/articles : Liste des articles
        - GET /categories/:category : Pages des catégories
        - GET /test-db : Test de la base de données
        =================================
        `);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️ Le port ${port} est déjà utilisé. Tentative avec le port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Erreur du serveur:', err);
        }
    });
};

// Démarrer le serveur
startServer(port);

module.exports = app;