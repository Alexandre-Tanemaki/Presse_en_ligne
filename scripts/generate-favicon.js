const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function generateFavicons() {
    const sourceDir = path.join(__dirname, '..', 'client', 'images');
    const targetDir = path.join(__dirname, '..', 'client');
    
    try {
        // Lire le SVG source
        const svgBuffer = await fs.readFile(path.join(sourceDir, 'favicon.svg'));
        
        // Générer le PNG
        await sharp(svgBuffer)
            .resize(32, 32)
            .png()
            .toFile(path.join(sourceDir, 'favicon.png'));
            
        // Générer l'ICO (PNG 32x32)
        await sharp(svgBuffer)
            .resize(32, 32)
            .png()
            .toFile(path.join(targetDir, 'favicon.ico'));
            
        console.log('✅ Favicons générés avec succès');
    } catch (error) {
        console.error('❌ Erreur lors de la génération des favicons:', error);
    }
}

generateFavicons(); 