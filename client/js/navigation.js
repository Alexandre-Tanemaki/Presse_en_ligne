// Gestion de la navigation
document.addEventListener('DOMContentLoaded', function() {
    // Mise à jour du lien actif dans la navigation
    updateActiveNavLink();
    
    // Gestion des filtres
    initializeFilters();
    
    // Gestion du menu mobile
    initializeMobileMenu();
});

function updateActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Retirer la classe active de tous les boutons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Ajouter la classe active au bouton cliqué
            this.classList.add('active');
            
            // Récupérer le filtre
            const filter = this.getAttribute('data-filter');
            
            // Recharger les articles avec le filtre
            if (typeof loadCategoryArticles === 'function') {
                const categorySlug = window.location.pathname.split('/').pop().replace('.html', '');
                loadCategoryArticles(categorySlug, 1, filter);
            }
        });
    });
}

function initializeMobileMenu() {
    const menuButton = document.querySelector('.navbar-toggler');
    const mobileMenu = document.querySelector('.nav-links');
    
    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('show');
        });
    }
}

// Fonction pour charger les articles filtrés
async function loadFilteredArticles(category, filter) {
    try {
        const response = await fetch(`http://localhost:3000/api/articles/category/${category}?filter=${filter}`);
        const data = await response.json();
        
        if (data.success) {
            // Mettre à jour l'affichage des articles
            const articlesContainer = document.querySelector('.articles-grid');
            if (data.articles.length === 0) {
                articlesContainer.innerHTML = '<p class="no-articles">Aucun article trouvé pour ce filtre.</p>';
            } else {
                displayArticles(data.articles);
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des articles filtrés:', error);
    }
}

// Fonction pour afficher les articles
function displayArticles(articles) {
    const container = document.querySelector('.articles-grid');
    
    const articlesHTML = articles.map(article => `
        <article class="article-card">
            <div class="article-image">
                <img src="${article.image_url || '/images/default.jpg'}" alt="${article.titre}">
            </div>
            <div class="article-content">
                <h3>${article.titre}</h3>
                <p>${article.contenu.substring(0, 150)}...</p>
                <div class="article-meta">
                    <span class="date">${new Date(article.date_publication).toLocaleDateString()}</span>
                    <span class="author">Par ${article.auteur}</span>
                </div>
                <a href="/article/${article.id}" class="read-more">Lire la suite</a>
            </div>
        </article>
    `).join('');
    
    container.innerHTML = articlesHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    const subnav = document.querySelector('.subnav');
    const navLinks = document.querySelectorAll('.nav-link[data-category]');
    let currentCategory = null;
    let subnavTimeout;

    // Gestion du scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Gestion de la sous-navigation
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', (e) => {
            const category = e.target.dataset.category;
            showSubnav(category);
        });
    });

    // Afficher la sous-navigation
    function showSubnav(category) {
        clearTimeout(subnavTimeout);
        
        if (currentCategory === category) return;
        currentCategory = category;

        // Masquer toutes les sections
        document.querySelectorAll('.subnav-section').forEach(section => {
            section.style.display = 'none';
        });

        // Afficher la section correspondante
        const targetSection = document.querySelector(`.subnav-section[data-category="${category}"]`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Afficher la sous-navigation
        subnav.classList.add('visible');
    }

    // Masquer la sous-navigation
    function hideSubnav() {
        subnavTimeout = setTimeout(() => {
            subnav.classList.remove('visible');
            currentCategory = null;
        }, 300);
    }

    // Gestion du survol de la sous-navigation
    subnav.addEventListener('mouseenter', () => {
        clearTimeout(subnavTimeout);
    });

    subnav.addEventListener('mouseleave', hideSubnav);
    navbar.addEventListener('mouseleave', hideSubnav);

    // Gestion des liens actifs
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-link')) {
            navLinks.forEach(link => link.classList.remove('active'));
            e.target.classList.add('active');
        }
    });

    // Animation de la page au chargement
    document.querySelector('main').classList.add('page-transition');
});
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === path) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}); 
