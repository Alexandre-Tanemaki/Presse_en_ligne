const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigrations() {
    try {
        // Charger la configuration de la base de données
        const dbConfig = require('../server/config/database');
        
        // Créer une connexion
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            database: dbConfig.database
        });

        console.log('🔌 Connexion à MySQL établie');

        // Lire le dossier des migrations
        const migrationsDir = path.join(__dirname, 'migrations');
        const files = await fs.readdir(migrationsDir);

        // Exécuter chaque fichier de migration
        for (const file of files) {
            if (file.endsWith('.sql')) {
                console.log(`📦 Exécution de la migration: ${file}`);
                const migrationPath = path.join(migrationsDir, file);
                const migration = await fs.readFile(migrationPath, 'utf8');

                // Diviser le fichier en commandes individuelles
                const commands = migration
                    .split(';')
                    .map(command => command.trim())
                    .filter(command => command.length > 0);

                // Exécuter chaque commande
                for (const command of commands) {
                    try {
                        await connection.query(command);
                        console.log('✅ Commande exécutée avec succès');
                    } catch (error) {
                        console.error('❌ Erreur lors de l\'exécution de la commande:', error);
                        throw error;
                    }
                }
            }
        }

        console.log('✅ Migrations terminées avec succès');
        await connection.end();

    } catch (error) {
        console.error('❌ Erreur lors de l\'exécution des migrations:', error);
        process.exit(1);
    }
}

runMigrations(); 