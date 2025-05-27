class FloatingImage {
    constructor(src, parent) {
        this.element = document.createElement('div');
        this.element.className = 'floating-image';
        
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Image flottante';
        // Gestion des erreurs de chargement d'image
        img.onerror = () => {
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjQwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjYiPkltYWdlIG5vbiBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
        };
        this.element.appendChild(img);

        this.parent = parent;
        this.parent.appendChild(this.element);

        // Position aléatoire
        this.x = Math.random() * 100;
        this.y = Math.random() * 100;
        this.z = Math.random() * 50 - 25;
        
        // Vitesse de déplacement augmentée
        this.vx = (Math.random() - 0.5) * 0.15;
        this.vy = (Math.random() - 0.5) * 0.15;
        
        this.rotate = Math.random() * 360;
        this.scale = 0.5 + Math.random() * 0.5;
        
        this.update();
        this.initMouseTracking();
    }

    update() {
        // Mise à jour de la position
        this.x += this.vx;
        this.y += this.vy;

        // Rebond sur les bords
        if (this.x < 0 || this.x > 100) this.vx *= -1;
        if (this.y < 0 || this.y > 100) this.vy *= -1;

        // Application des transformations
        this.element.style.transform = `
            translate3d(${this.x}vw, ${this.y}vh, ${this.z}px)
            rotate(${this.rotate}deg)
            scale(${this.scale})
        `;
    }

    initMouseTracking() {
        document.addEventListener('mousemove', (e) => {
            const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            const mouseY = (e.clientY / window.innerHeight) * 2 - 1;

            // Effet parallaxe augmenté (20 -> 30)
            const parallaxX = mouseX * 30;
            const parallaxY = mouseY * 30;
            
            // Calcul de la distance entre la souris et l'image
            const dx = (e.clientX / window.innerWidth) - (this.x / 100);
            const dy = (e.clientY / window.innerHeight) - (this.y / 100);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Effet de répulsion augmenté (0.01 -> 0.03)
            const repulsionForce = Math.max(0, 1 - distance * 2);
            this.vx -= dx * repulsionForce * 0.03;
            this.vy -= dy * repulsionForce * 0.03;

            this.element.style.transform = `
                translate3d(${this.x + parallaxX}vw, ${this.y + parallaxY}vh, ${this.z}px)
                rotate(${this.rotate + mouseX * 10}deg)
                scale(${this.scale + Math.abs(mouseX) * 0.2})
            `;
        });
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    const background = document.createElement('div');
    background.className = 'floating-background';
    document.body.appendChild(background);

    // Images par défaut (en attendant l'API)
    const defaultImages = [
        'https://picsum.photos/800/500?random=1',
        'https://picsum.photos/800/500?random=2',
        'https://picsum.photos/800/500?random=3',
        'https://picsum.photos/800/500?random=4',
        'https://picsum.photos/800/500?random=5'
    ];

    // Création des images flottantes avec les images par défaut
    const floatingImages = defaultImages.map(src => new FloatingImage(src, background));

    // Animation continue
    function animate() {
        floatingImages.forEach(img => img.update());
        requestAnimationFrame(animate);
    }
    animate();

    // Tentative de chargement des articles depuis l'API
    async function loadArticleImages() {
        try {
            const response = await fetch('/api/articles');
            if (!response.ok) throw new Error('Erreur API');
            
            const articles = await response.json();
            const articleImages = articles
                .filter(article => article.image)
                .map(article => article.image);

            if (articleImages.length > 0) {
                // Remplacer les images par défaut par les images des articles
                background.innerHTML = '';
                articleImages.forEach(src => new FloatingImage(src, background));
            }
        } catch (error) {
            console.log('Utilisation des images par défaut');
        }
    }

    // Essayer de charger les vraies images d'articles
    loadArticleImages();
}); 