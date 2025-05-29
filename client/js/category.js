// Configuration
const ARTICLES_PER_PAGE = 6;
let currentPage = 1;

// Obtenir la catégorie à partir de l'URL
const categorySlug = window.location.pathname.split('/').pop().replace('.html', '');

document.addEventListener('DOMContentLoaded', function() {
    // Charger les articles de la catégorie
    loadCategoryArticles(categorySlug, currentPage);
    
    // Mettre à jour le titre de la page
    updatePageTitle(categorySlug);
});

async function loadCategoryArticles(category, page) {
    try {
        const response = await fetch(`http://localhost:3000/api/articles?category=${category}&page=${page}&limit=${ARTICLES_PER_PAGE}`);
        const data = await response.json();
        
        if (data.success) {
            displayCategoryArticles(data.data);
            updatePagination(data.total, page);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des articles:', error);
        document.getElementById('category-articles').innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    Une erreur est survenue lors du chargement des articles.
                </div>
            </div>
        `;
    }
}

function displayCategoryArticles(articles) {
    const container = document.getElementById('category-articles');
    
    if (articles.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    Aucun article disponible dans cette catégorie.
                </div>
            </div>
        `;
        return;
    }

    const articlesHTML = articles.map(article => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card article-card h-100">
                ${article.type_contenu === 'image' || article.type_contenu === 'mixte' 
                    ? `<img src="${article.media_url || '../images/default.jpg'}" class="card-img-top article-image" alt="${article.titre}">`
                    : ''}
                <div class="card-body">
                    <h5 class="card-title">${article.titre}</h5>
                    <p class="card-text">${article.contenu.substring(0, 150)}...</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">Par ${article.prenom} ${article.nom}</small>
                        <small class="text-muted">${new Date(article.date_publication).toLocaleDateString()}</small>
                    </div>
                </div>
                <div class="card-footer">
                    <a href="../article.html?id=${article.id_article}" class="btn btn-primary btn-sm">Lire la suite</a>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = articlesHTML;
}

function updatePagination(total, currentPage) {
    const totalPages = Math.ceil(total / ARTICLES_PER_PAGE);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }

    let paginationHTML = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">Précédent</a>
        </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }

    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">Suivant</a>
        </li>
    `;

    pagination.innerHTML = paginationHTML;

    // Ajouter les événements de clic
    pagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', function() {
    
            const newPage = parseInt(this.getAttribute('data-page'));
            if (newPage !== currentPage && newPage > 0 && newPage <= totalPages) {
                currentPage = newPage;
                loadCategoryArticles(categorySlug, currentPage);
            }
        });
    });
}

function updatePageTitle(category) {
    const categoryNames = {
        'politique': 'Politique',
        'economie': 'Économie',
        'faits-divers': 'Faits divers',
        'sports': 'Sports',
        'sante': 'Santé',
        'culture': 'Culture',
        'international': 'International'
    };

    const categoryName = categoryNames[category] || category;
    document.title = `${categoryName} - Ma Presse`;
    document.querySelector('header h1').textContent = categoryName;
    document.querySelector('header p.lead').textContent = `Les dernières actualités ${categoryName.toLowerCase()}`;
} 