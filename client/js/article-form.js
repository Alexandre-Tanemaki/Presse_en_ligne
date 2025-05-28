// Fonction pour charger les catégories
async function loadCategories() {
    try {
        const response = await fetch('http://localhost:3000/api/categories');
        const categories = await response.json();
        
        const select = document.getElementById('id_categorie');
        select.innerHTML = '<option value="">Sélectionnez une catégorie</option>';
        
        categories.forEach(categorie => {
            const option = document.createElement('option');
            option.value = categorie.id_categorie;
            option.textContent = categorie.nom_categorie;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        alert('Erreur lors du chargement des catégories');
    }
}

// Fonction pour charger les journalistes
async function loadJournalistes() {
    try {
        const response = await fetch('http://localhost:3000/api/journalistes');
        const journalistes = await response.json();
        
        const select = document.getElementById('id_journaliste');
        select.innerHTML = '<option value="">Sélectionnez un journaliste</option>';
        
        journalistes.forEach(journaliste => {
            const option = document.createElement('option');
            option.value = journaliste.id_journaliste;
            option.textContent = `${journaliste.prenom} ${journaliste.nom}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des journalistes:', error);
        alert('Erreur lors du chargement des journalistes');
    }
}

// Fonction pour gérer la soumission du formulaire
async function handleSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    // Validation des champs requis
    const titre = formData.get('titre');
    const contenu = formData.get('contenu');
    const id_categorie = formData.get('id_categorie');
    const id_journaliste = formData.get('id_journaliste');
    
    // Vérification des champs requis
    const champsManquants = [];
    if (!titre) champsManquants.push('titre');
    if (!contenu) champsManquants.push('contenu');
    if (!id_categorie) champsManquants.push('catégorie');
    if (!id_journaliste) champsManquants.push('journaliste');
    
    if (champsManquants.length > 0) {
        alert(`Veuillez remplir les champs suivants : ${champsManquants.join(', ')}`);
        return;
    }
    
    try {
        // Conversion des valeurs numériques
        formData.set('id_categorie', parseInt(id_categorie));
        formData.set('id_journaliste', parseInt(id_journaliste));
        
        // Ajout des champs optionnels avec valeurs par défaut
        if (!formData.has('type_contenu')) {
            formData.set('type_contenu', 'texte');
        }
        if (!formData.has('featured')) {
            formData.set('featured', false);
        }
        
        const response = await fetch('http://localhost:3000/api/articles', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            alert('Article créé avec succès !');
            // Redirection vers la liste des articles ou la page d'accueil
            window.location.href = '/';
        } else {
            throw new Error(result.message || 'Erreur lors de la création de l\'article');
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la création de l\'article: ' + error.message);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadJournalistes();
    
    const form = document.getElementById('formArticle');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});

function isLoggedIn() {
    return !!localStorage.getItem('userToken');
}

document.addEventListener('DOMContentLoaded', function() {
    if (!isLoggedIn()) {
        document.getElementById('article-content').innerHTML = `
            <div class="alert alert-info">
                <p>Vous devez être connecté pour lire l'intégralité de cet article.</p>
                <a href="/login.html" class="btn btn-primary">Se connecter</a>
                <a href="/register.html" class="btn btn-secondary">S'inscrire</a>
            </div>
        `;
    } else {
        // Ici, tu charges et affiches le contenu complet de l'article
        // Exemple : fetch('/api/articles/ID') puis affichage dans #article-content
    }
}); 