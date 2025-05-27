// Configuration
const API_BASE_URL = '/api';
const ARTICLES_PER_PAGE = 6;
const DEFAULT_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjQwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjYiPkltYWdlIG5vbiBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';

// Configuration d'Axios
axios.defaults.baseURL = '/api';

// Fonctions utilitaires
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

// Fonction pour gérer les erreurs de l'API
async function handleApiResponse(response) {
    if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json();
    }
    throw new TypeError("La réponse n'est pas du JSON");
}

// Données d'exemple pour les articles
const articlesData = {
    politique: [
        {
            id: 1,
            title: "Réforme des retraites : les derniers développements",
            excerpt: "Les débats se poursuivent à l'Assemblée nationale concernant la réforme des retraites...",
            category: "Politique",
            image: "/images/articles/politique1.jpg",
            date: "2024-03-15",
            author: "Marie Dubois"
        },
        {
            id: 2,
            title: "Élections régionales : les enjeux majeurs",
            excerpt: "À l'approche des élections régionales, focus sur les principaux enjeux qui marqueront le scrutin...",
            category: "Politique",
            image: "/images/articles/politique2.jpg",
            date: "2024-03-14",
            author: "Pierre Martin"
        },
        {
            id: 3,
            title: "Nouveau projet de loi sur l'environnement",
            excerpt: "Le gouvernement présente un nouveau projet de loi ambitieux sur la protection de l'environnement...",
            category: "Politique",
            image: "/images/articles/politique3.jpg",
            date: "2024-03-13",
            author: "Sophie Bernard"
        }
    ],
    economie: [
        {
            id: 4,
            title: "La Bourse de Paris atteint un nouveau record",
            excerpt: "Le CAC 40 poursuit sa progression et établit un nouveau record historique...",
            category: "Économie",
            image: "/images/articles/economie1.jpg",
            date: "2024-03-15",
            author: "Thomas Laurent"
        },
        {
            id: 5,
            title: "Les startups françaises en plein essor",
            excerpt: "Le secteur de la tech française continue sa croissance exceptionnelle...",
            category: "Économie",
            image: "/images/articles/economie2.jpg",
            date: "2024-03-14",
            author: "Julie Moreau"
        },
        {
            id: 6,
            title: "Inflation : les dernières tendances",
            excerpt: "Analyse des derniers chiffres de l'inflation et leur impact sur le pouvoir d'achat...",
            category: "Économie",
            image: "/images/articles/economie3.jpg",
            date: "2024-03-13",
            author: "Marc Dupont"
        }
    ],
    international: [
        {
            id: 7,
            title: "Sommet européen sur le climat",
            excerpt: "Les dirigeants européens se réunissent pour discuter des objectifs climatiques...",
            category: "International",
            image: "/images/articles/international1.jpg",
            date: "2024-03-15",
            author: "Claire Martin"
        },
        {
            id: 8,
            title: "Tensions diplomatiques en Asie",
            excerpt: "Les relations se tendent entre plusieurs pays asiatiques suite à des désaccords commerciaux...",
            category: "International",
            image: "/images/articles/international2.jpg",
            date: "2024-03-14",
            author: "François Leblanc"
        },
        {
            id: 9,
            title: "Élections américaines : les primaires",
            excerpt: "Point sur les primaires américaines et les candidats en lice...",
            category: "International",
            image: "/images/articles/international3.jpg",
            date: "2024-03-13",
            author: "Anne Richard"
        }
    ],
    sports: [
        {
            id: 10,
            title: "Ligue des Champions : soirée de choc",
            excerpt: "Résumé des matchs de la soirée et analyse des performances...",
            category: "Sports",
            image: "/images/articles/sports1.jpg",
            date: "2024-03-15",
            author: "David Martin"
        },
        {
            id: 11,
            title: "Roland-Garros : les favoris",
            excerpt: "Présentation des favoris pour le prochain tournoi de Roland-Garros...",
            category: "Sports",
            image: "/images/articles/sports2.jpg",
            date: "2024-03-14",
            author: "Sophie Dubois"
        },
        {
            id: 12,
            title: "JO 2024 : Paris se prépare",
            excerpt: "État des lieux des préparatifs à 100 jours des Jeux Olympiques...",
            category: "Sports",
            image: "/images/articles/sports3.jpg",
            date: "2024-03-13",
            author: "Lucas Bernard"
        }
    ],
    culture: [
        {
            id: 13,
            title: "Festival de Cannes : la sélection dévoilée",
            excerpt: "Découvrez les films en compétition pour la prochaine édition...",
            category: "Culture",
            image: "/images/articles/culture1.jpg",
            date: "2024-03-15",
            author: "Marie Leroy"
        },
        {
            id: 14,
            title: "Nouveau roman de Michel Houellebecq",
            excerpt: "L'auteur français revient avec un roman événement...",
            category: "Culture",
            image: "/images/articles/culture2.jpg",
            date: "2024-03-14",
            author: "Paul Durand"
        },
        {
            id: 15,
            title: "Exposition événement au Louvre",
            excerpt: "Le musée accueille une exposition exceptionnelle sur la Renaissance...",
            category: "Culture",
            image: "/images/articles/culture3.jpg",
            date: "2024-03-13",
            author: "Emma Petit"
        }
    ]
};

// Fonction pour créer un article à la une
function createFeaturedArticle(article) {
    return `
        <div class="featured-article">
            <img src="${article.image_principale || DEFAULT_IMAGE}" alt="${article.titre}">
            <div class="featured-content">
                <h3 class="featured-title">${article.titre}</h3>
                <div class="article-meta">
                    <span class="article-author">${article.journaliste_nom || 'Auteur inconnu'}</span>
                    <span class="article-date">${formatDate(article.date_publication)}</span>
                </div>
            </div>
        </div>
    `;
}

// Fonction pour créer une carte d'article
function createArticleCard(article) {
    return `
        <div class="article-card">
            <img class="article-image" src="${article.image_principale || DEFAULT_IMAGE}" alt="${article.titre}">
            <div class="article-content">
                <h3 class="article-title">${article.titre}</h3>
                <p class="article-excerpt">${article.contenu ? article.contenu.substring(0, 150) + '...' : ''}</p>
                <div class="article-meta">
                    <span class="article-author">${article.journaliste_nom || 'Auteur inconnu'}</span>
                    <span class="article-date">${formatDate(article.date_publication)}</span>
                </div>
            </div>
        </div>
    `;
}

// Fonction pour afficher les articles d'une catégorie
function displayArticles(category) {
    const articles = articlesData[category] || [];
    const container = document.querySelector('.articles-grid');
    
    if (!container) return;

    if (articles.length === 0) {
        container.innerHTML = `
            <div class="no-articles">
                <p>Aucun article disponible dans cette catégorie.</p>
                <p>Revenez bientôt pour découvrir nos nouveaux articles.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = articles.map(article => createArticleCard(article)).join('');
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Détecter la page actuelle
    const currentPath = window.location.pathname;
    const category = currentPath.split('/').pop().replace('.html', '');
    
    if (articlesData[category]) {
        displayArticles(category);
    }

    // Gestion des filtres
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            
            // Mise à jour des classes actives
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Filtrer les articles
            if (filter === 'all') {
                displayArticles(category);
            } else {
                const filteredArticles = articlesData[category].filter(article => {
                    return article.subcategory === filter;
                });
                displayFilteredArticles(filteredArticles);
            }
        });
    });

    loadFeaturedArticles();
    loadLatestArticles();
});

// Fonction pour afficher les articles filtrés
function displayFilteredArticles(articles) {
    const container = document.querySelector('.articles-grid');
    
    if (!container) return;

    if (articles.length === 0) {
        container.innerHTML = `
            <div class="no-articles">
                <p>Aucun article disponible dans cette catégorie.</p>
                <p>Revenez bientôt pour découvrir nos nouveaux articles.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = articles.map(article => createArticleCard(article)).join('');
    observeArticles();
}

// Animation au scroll pour les articles
const observeArticles = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('article-visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.article-card').forEach(article => {
        observer.observe(article);
    });
};

// Appliquer les animations
document.addEventListener('DOMContentLoaded', observeArticles);

// Charger les articles à la une
async function loadFeaturedArticles() {
    try {
        const response = await axios.get('/articles?featured=true');
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
            const featuredArticlesContainer = document.getElementById('featured-articles');
            if (featuredArticlesContainer) {
                featuredArticlesContainer.innerHTML = response.data.data
                    .map(article => createFeaturedArticle(article))
                    .join('');
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des articles à la une:', error);
    }
}

// Charger les derniers articles
async function loadLatestArticles() {
    try {
        const response = await axios.get('/articles');
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
            const latestArticlesContainer = document.getElementById('latest-articles');
            if (latestArticlesContainer) {
                latestArticlesContainer.innerHTML = response.data.data
                    .filter(article => !article.featured)
                    .slice(0, 6)
                    .map(article => createArticleCard(article))
                    .join('');
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des derniers articles:', error);
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await handleApiResponse(response);
        
        const list = document.getElementById('categories-list');
        if (!list) return;

        if (data.success && data.data) {
            data.data.forEach(category => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = `
                    <a href="#" data-category="${category.id_categorie}">${category.nom_categorie}</a>
                    <span class="badge bg-primary rounded-pill">${category.article_count || 0}</span>
                `;
                list.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
    }
}

function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
            </div>
        `;
    }
}

// Fonction pour charger les articles
async function loadArticles(categoryId = null) {
    const container = document.getElementById('articles-container');
    if (!container) return;

    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'block';
    
    try {
        let url = `${API_BASE_URL}/articles`;
        if (categoryId) {
            url += `?category=${categoryId}`;
        }
        
        const response = await fetch(url);
        const data = await handleApiResponse(response);
        
        if (!data.success) {
            throw new Error(data.message || 'Erreur lors du chargement des articles');
        }

        displayArticles(data.data);
    } catch (error) {
        console.error('Erreur lors du chargement des articles:', error);
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-danger">
                    Une erreur est survenue lors du chargement des articles.
                </div>
            </div>
        `;
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

// Fonction pour afficher les articles
function displayArticles(articles) {
    const container = document.getElementById('articles-container');
    if (!container) return;
    
    if (!articles || articles.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <p>Aucun article disponible pour le moment.</p>
            </div>
        `;
        return;
    }

    const articlesHTML = articles.map(article => `
        <div class="col-md-4 mb-4">
            <div class="card article-card h-100">
                ${article.type_contenu === 'image' || article.type_contenu === 'mixte' 
                    ? `<img src="${article.image_principale || '/images/default.jpg'}" class="card-img-top article-image" alt="${article.titre}">`
                    : ''}
                <div class="card-body">
                    <h5 class="card-title">${article.titre}</h5>
                    <p class="card-text">${article.contenu ? article.contenu.substring(0, 150) + '...' : ''}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">Par ${article.journaliste_prenom || ''} ${article.journaliste_nom || 'Auteur inconnu'}</small>
                        <small class="text-muted">${article.date_publication ? new Date(article.date_publication).toLocaleDateString('fr-FR') : ''}</small>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = articlesHTML;
}

// Initialisation unique au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedArticles();
    loadLatestArticles();
    loadCategories();
    loadArticles();
    loadJournalistes();

    // Gestion du menu actif
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Gestion des clics sur les catégories
    document.querySelectorAll('[data-category]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const categoryId = this.getAttribute('data-category');
            loadArticles(categoryId === 'all' ? null : categoryId);
        });
    });
});

async function loadJournalistes() {
    const list = document.getElementById('journalistes-list');
    if (!list) return; // Si l'élément n'existe pas, on arrête la fonction
    
    try {
        const response = await fetch('/api/journalistes');
        const data = await handleApiResponse(response);
        
        if (!data.success || !data.data) {
            throw new Error(data.message || 'Erreur lors du chargement des journalistes');
        }

        const journalistes = data.data;
        list.innerHTML = ''; // On vide la liste avant d'ajouter les nouveaux éléments
        
        journalistes.forEach(journaliste => {
            const item = document.createElement('a');
            item.href = '#';
            item.className = 'list-group-item list-group-item-action';
            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${journaliste.prenom} ${journaliste.nom}</h6>
                    <small>${journaliste.article_count || 0} articles</small>
                </div>
                <small class="text-muted">${journaliste.email}</small>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des journalistes:', error);
        if (list) {
            list.innerHTML = `
                <div class="alert alert-danger">
                    Erreur lors du chargement des journalistes
                </div>
            `;
        }
    }
}