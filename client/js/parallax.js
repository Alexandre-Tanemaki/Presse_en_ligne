// Configuration
const config = {
    mouseMovement: {
        strength: 0.05,
        ease: 'cubic-bezier(0.23, 1, 0.32, 1)',
        duration: 0.8
    },
    parallax: {
        perspective: 1000,
        scale: 1.1,
        ease: 'cubic-bezier(0.23, 1, 0.32, 1)'
    }
};

// Création des images d'arrière-plan
function createBackgroundImages() {
    const wrapper = document.createElement('div');
    wrapper.className = 'background-wrapper';
    
    // Utiliser les 3 premières images des articles
    const articleImages = document.querySelectorAll('.article-image');
    for (let i = 0; i < Math.min(3, articleImages.length); i++) {
        const bgImage = document.createElement('img');
        bgImage.className = 'background-image';
        bgImage.src = articleImages[i].src;
        wrapper.appendChild(bgImage);
    }
    
    document.body.insertBefore(wrapper, document.body.firstChild);
    return wrapper.querySelectorAll('.background-image');
}

// Initialisation après le chargement du DOM
let backgroundImages;
document.addEventListener('DOMContentLoaded', () => {
    backgroundImages = createBackgroundImages();
    initMouseTracking();
});

// Suivi de la souris
function initMouseTracking() {
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) / window.innerWidth;
        mouseY = (e.clientY - window.innerHeight / 2) / window.innerHeight;
        
        requestAnimationFrame(() => updateBackgroundImages(mouseX, mouseY));
    });

    // Animation fluide
    function updateBackgroundImages(targetX, targetY) {
        backgroundImages.forEach((image, index) => {
            const strength = config.mouseMovement.strength * (index + 1);
            const x = targetX * 100 * strength;
            const y = targetY * 100 * strength;

            image.style.transition = `transform ${config.mouseMovement.duration}s ${config.mouseMovement.ease}`;
            image.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${config.parallax.scale})`;
        });
    }
}

// Effet de parallaxe au défilement
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(() => {
            const scrolled = window.scrollY;
            
            backgroundImages.forEach((image, index) => {
                const speed = 0.15 * (index + 1);
                const yPos = scrolled * speed;
                const scale = 1 + (scrolled * 0.0005);
                
                image.style.transform = `translate3d(0, ${yPos}px, 0) scale(${scale})`;
            });
            
            ticking = false;
        });
        ticking = true;
    }
});

// Effet sur les articles
const articles = document.querySelectorAll('.article-card, .featured-article');

articles.forEach(article => {
    article.addEventListener('mousemove', (e) => {
        const rect = article.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        
        const rotateX = y * 10;
        const rotateY = -x * 10;
        
        article.style.transform = `
            perspective(${config.parallax.perspective}px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            scale3d(1.05, 1.05, 1.05)
        `;
        
        // Effet sur l'image à l'intérieur
        const image = article.querySelector('img');
        if (image) {
            image.style.transform = `
                translate3d(${x * 20}px, ${y * 20}px, 0)
                scale(1.1)
            `;
        }
    });
    
    article.addEventListener('mouseleave', () => {
        article.style.transform = 'none';
        const image = article.querySelector('img');
        if (image) {
            image.style.transform = 'none';
        }
    });
}); 