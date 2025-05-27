const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function initializeDatabase() {
    try {
        // Charger la configuration de la base de données
        const dbConfig = require('../server/config/database');
        
        // Créer une connexion sans sélectionner de base de données
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });

        console.log('🔌 Connexion à MySQL établie');

        // Lire le fichier de schéma
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');

        // Diviser le schéma en commandes individuelles et nettoyer les commentaires
        const commands = schema
            .split(';')
            .map(command => {
                // Supprimer les commentaires et les espaces inutiles
                return command
                    .split('\n')
                    .filter(line => !line.trim().startsWith('--'))
                    .join('\n')
                    .trim();
            })
            .filter(command => command.length > 0);

        // Exécuter chaque commande
        for (const command of commands) {
            try {
                await connection.query(command);
                console.log('✅ Commande exécutée:', command.substring(0, 50) + '...');
            } catch (error) {
                console.error('❌ Erreur lors de l\'exécution de la commande:', command);
                throw error;
            }
        }

        console.log('✅ Base de données initialisée avec succès');
        await connection.end();

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
        process.exit(1);
    }
}

initializeDatabase(); 