const mysql = require('mysql2/promise');
const config = require('./config/database');

let pool;

async function initPool() {
    try {
        console.log('Tentative de connexion à la base de données...');

        pool = mysql.createPool({
            ...config,
            enableKeepAlive: true,
            keepAliveInitialDelay: 10000
        });

        // Test de la connexion
        const connection = await pool.getConnection();
        console.log('✅ Connexion à la base de données établie avec succès');
        
        // Vérifier la structure de la table articles
        const [columns] = await connection.query('SHOW COLUMNS FROM articles');
        const requiredColumns = ['id_article', 'titre', 'contenu', 'date_publication', 'featured'];
        const missingColumns = requiredColumns.filter(col => 
            !columns.some(c => c.Field === col)
        );

        if (missingColumns.length > 0) {
            console.error('❌ Colonnes manquantes dans la table articles:', missingColumns);
            throw new Error(`Colonnes manquantes dans la table articles: ${missingColumns.join(', ')}`);
        }

        console.log('✅ Structure de la table articles validée');
        connection.release();
        return pool;
    } catch (error) {
        console.error('❌ Erreur lors de la connexion à la base de données:', error);
        throw error;
    }
}

// Initialiser le pool au démarrage
initPool().catch(error => {
    console.error('❌ Erreur fatale lors de l\'initialisation du pool:', error);
    process.exit(1);
});

// Fonction pour obtenir une connexion du pool
async function getConnection() {
    if (!pool) {
        await initPool();
    }
    return pool.getConnection();
}

// Exporter les fonctions de base de données
module.exports = {
    query: async (...args) => {
        if (!pool) {
            await initPool();
        }
        return pool.query(...args);
    },
    getConnection,
    pool: () => pool
};