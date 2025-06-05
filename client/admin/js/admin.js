const { createApp } = Vue;



// Instance Bootstrap pour les modales
let articleModal, journalisteModal;
let categoriesChart, publicationsChart;

const app = createApp({
    data() {
        return {
            currentView: 'dashboard',
            showSidebar: false,
            notifications: [],
            articles: [],
            journalistes: [],
            categories: [],
            archives: [],
            stats: {
                articlesPublies: 0,
                articlesEnAttente: 0,
                journalistesActifs: 0,
                vuesTotales: 0,
                articlesTrend: 0,
                vuesTrend: 0,
                categoriesData: [],
                publicationsData: []
            },
            filters: {
                categorie: '',
                journaliste_id: '',
                search: ''
            },
            editingArticle: {
                id_article: null,
                titre: '',
                contenu: '',
                id_categorie: '',
                id_journaliste: '',
                type_contenu: 'texte',
                featured: false,
                image: null
            },
            editingJournaliste: {
                id_journaliste: null,
                nom: '',
                prenom: '',
                email: '',
                biographie: '',
                photo: null
            },
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            calendarDays: [],
            selectedDay: null,
            charts: {
                categories: null,
                publications: null
            }
        };
    },

    computed: {
        filteredArticles() {
            return this.articles.filter(article => {
                const matchCategorie = !this.filters.categorie || article.id_categorie === parseInt(this.filters.categorie);
                const matchJournaliste = !this.filters.journaliste_id || article.journaliste_id === parseInt(this.filters.journaliste_id);
                const matchSearch = !this.filters.search || 
                    article.titre.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                    article.contenu.toLowerCase().includes(this.filters.search.toLowerCase());
                return matchCategorie && matchJournaliste && matchSearch;
            });
        },

        filteredArchives() {
            return this.archives.filter(article => {
                const matchCategorie = !this.filters.categorie || article.id_categorie === parseInt(this.filters.categorie);
                const matchJournaliste = !this.filters.journaliste_id || article.journaliste_id === parseInt(this.filters.journaliste_id);
                const matchSearch = !this.filters.search || 
                    article.titre.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                    article.contenu.toLowerCase().includes(this.filters.search.toLowerCase());
                return matchCategorie && matchJournaliste && matchSearch;
            });
        },

        currentMonthName() {
            return new Date(this.currentYear, this.currentMonth).toLocaleString('fr-FR', { month: 'long' });
        }
    },

    watch: {
        currentView: {
            immediate: true,
            handler(newView, oldView) {
                // Nettoyer les graphiques si on quitte le dashboard
                if (oldView === 'dashboard') {
                    this.cleanupCharts();
                }
                
                // Charger les données appropriées pour la nouvelle vue
                switch(newView) {
                    case 'dashboard':
                        this.loadStats();
                        break;
                    case 'archives':
                        this.loadArchives();
                        break;
                    case 'articles':
                        this.loadArticles();
                        break;
                    case 'journalistes':
                        this.loadJournalistes();
                        break;
                }
            }
        }
    },

    mounted() {
        // Initialisation des modales Bootstrap
        articleModal = new bootstrap.Modal(document.getElementById('articleModal'));
        journalisteModal = new bootstrap.Modal(document.getElementById('journalisteModal'));

        // Chargement initial des données communes
        this.loadCategories();
        
        // Le chargement des autres données sera géré par le watcher de currentView
    },

    methods: {
        // Méthodes pour les notifications
        showNotification(message, type = 'info') {
            const id = Date.now();
            const notification = { id, message, type, removing: false };
            this.notifications.push(notification);

            // Démarrer le timer pour la suppression
            setTimeout(() => {
                this.closeNotification(id);
            }, 5000);

            // Supprimer définitivement après l'animation
            setTimeout(() => {
                this.removeNotification(id);
            }, 5300); // 5000ms + 300ms pour l'animation
        },

        closeNotification(id) {
            const notification = this.notifications.find(n => n.id === id);
            if (notification) {
                notification.removing = true;
            }
        },

        removeNotification(id) {
            this.notifications = this.notifications.filter(n => n.id !== id);
        },

        showSuccess(message) {
            this.showNotification(message, 'success');
        },

        showError(message) {
            this.showNotification(message, 'error');
        },

        showWarning(message) {
            this.showNotification(message, 'warning');
        },

        showInfo(message) {
            this.showNotification(message, 'info');
        },

        // Méthodes pour le tableau de bord
        async loadStats() {
            try {
                const response = await axios.get('/api/stats');
                if (!response.data || !response.data.success) {
                    throw new Error(response.data?.message || 'Format de données invalide');
                }

                // Mettre à jour les stats avec des valeurs par défaut si manquantes
                this.stats = {
                    articlesPublies: response.data.data.articlesPublies || 0,
                    articlesEnAttente: response.data.data.articlesEnAttente || 0,
                    journalistesActifs: response.data.data.journalistesActifs || 0,
                    vuesTotales: response.data.data.vuesTotales || 0,
                    articlesTrend: response.data.data.articlesTrend || 0,
                    vuesTrend: response.data.data.vuesTrend || 0,
                    categoriesData: response.data.data.categoriesData || [],
                    publicationsData: response.data.data.publicationsData || []
                };

                // Initialiser les graphiques seulement si nous sommes sur le dashboard
                if (this.currentView === 'dashboard') {
                    this.$nextTick(() => {
                        this.initCharts();
                    });
                }
            } catch (error) {
                console.error('Erreur lors du chargement des statistiques:', error);
                this.showError(error.message || 'Erreur lors du chargement des statistiques');
            }
        },

        initCharts() {
            // Vérifier si les éléments existent dans le DOM
            const categoriesElement = document.getElementById('categoriesChart');
            const publicationsElement = document.getElementById('publicationsChart');
            
            if (!categoriesElement || !publicationsElement) {
                console.log('Éléments des graphiques non trouvés dans le DOM');
                return;
            }

            // Vérifier si les données sont disponibles
            if (!this.stats.categoriesData || !this.stats.publicationsData) {
                console.log('Données des graphiques non disponibles');
                return;
            }

            // Détruire les graphiques existants s'ils existent
            if (this.charts.categories) {
                this.charts.categories.destroy();
            }
            if (this.charts.publications) {
                this.charts.publications.destroy();
            }

            // Graphique des catégories
            if (this.stats.categoriesData.length > 0) {
                const ctxCategories = categoriesElement.getContext('2d');
                this.charts.categories = new Chart(ctxCategories, {
                    type: 'doughnut',
                    data: {
                        labels: this.stats.categoriesData.map(cat => cat.label),
                        datasets: [{
                            data: this.stats.categoriesData.map(cat => cat.value),
                            backgroundColor: [
                                '#dc3545',
                                '#28a745',
                                '#007bff',
                                '#ffc107',
                                '#6f42c1',
                                '#20c997',
                                '#fd7e14',
                                '#6610f2'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    boxWidth: 15,
                                    padding: 15
                                }
                            }
                        },
                        layout: {
                            padding: {
                                top: 10,
                                right: 10,
                                bottom: 10,
                                left: 10
                            }
                        }
                    }
                });
            } else {
                console.log('Aucune donnée disponible pour le graphique des catégories');
            }

            // Graphique des publications
            if (this.stats.publicationsData.length > 0) {
                const ctxPublications = publicationsElement.getContext('2d');
                // Formater les mois pour l'affichage
                const moisLabels = this.stats.publicationsData.map(item => {
                    const [annee, mois] = item.mois.split('-');
                    return new Date(annee, mois - 1).toLocaleString('fr-FR', { month: 'short' });
                });

                this.charts.publications = new Chart(ctxPublications, {
                    type: 'line',
                    data: {
                        labels: moisLabels,
                        datasets: [{
                            label: 'Articles publiés',
                            data: this.stats.publicationsData.map(item => item.count),
                            borderColor: '#007bff',
                            backgroundColor: 'rgba(0, 123, 255, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1,
                                    padding: 10
                                },
                                grid: {
                                    drawBorder: false
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                },
                                ticks: {
                                    padding: 10
                                }
                            }
                        },
                        layout: {
                            padding: {
                                top: 10,
                                right: 10,
                                bottom: 10,
                                left: 10
                            }
                        }
                    }
                });
            } else {
                console.log('Aucune donnée disponible pour le graphique des publications');
            }
        },

        // Méthodes pour le calendrier éditorial
        previousMonth() {
            if (this.currentMonth === 0) {
                this.currentMonth = 11;
                this.currentYear--;
            } else {
                this.currentMonth--;
            }
            this.updateCalendar();
        },

        nextMonth() {
            if (this.currentMonth === 11) {
                this.currentMonth = 0;
                this.currentYear++;
            } else {
                this.currentMonth++;
            }
            this.updateCalendar();
        },

        updateCalendar() {
            const firstDay = new Date(this.currentYear, this.currentMonth, 1);
            const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
            const days = [];

            // Obtenir le premier jour de la semaine (0 = Dimanche)
            let firstDayOfWeek = firstDay.getDay();
            // Convertir pour commencer par Lundi (1 = Lundi)
            firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

            // Ajouter les jours du mois précédent
            for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                const date = new Date(firstDay);
                date.setDate(date.getDate() - i - 1);
                days.push({
                    date: date.toISOString(),
                    articles: this.getArticlesForDate(date)
                });
            }

            // Ajouter les jours du mois en cours
            for (let i = 1; i <= lastDay.getDate(); i++) {
                const date = new Date(this.currentYear, this.currentMonth, i);
                days.push({
                    date: date.toISOString(),
                    articles: this.getArticlesForDate(date)
                });
            }

            // Ajouter les jours du mois suivant
            const lastDayOfWeek = lastDay.getDay();
            const remainingDays = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
            for (let i = 1; i <= remainingDays; i++) {
                const date = new Date(lastDay);
                date.setDate(date.getDate() + i);
                days.push({
                    date: date.toISOString(),
                    articles: this.getArticlesForDate(date)
                });
            }

            this.calendarDays = days;
        },

        getArticlesForDate(date) {
            return this.articles.filter(article => {
                const articleDate = new Date(article.date_publication);
                return articleDate.getDate() === date.getDate() &&
                       articleDate.getMonth() === date.getMonth() &&
                       articleDate.getFullYear() === date.getFullYear();
            });
        },

        formatDayNumber(dateString) {
            return new Date(dateString).getDate();
        },

        isCurrentMonth(dateString) {
            const date = new Date(dateString);
            return date.getMonth() === this.currentMonth &&
                   date.getFullYear() === this.currentYear;
        },

        showDayDetails(day) {
            if (day.articles.length > 0) {
                this.selectedDay = day;
                // Si vous voulez montrer les articles dans une modale ou un panneau latéral
                // Vous pouvez ajouter cette fonctionnalité ici
            }
        },

        // Méthodes pour les articles
        async loadArticles() {
            try {
                const response = await axios.get('/api/articles');
                if (response.data && response.data.success) {
                    this.articles = response.data.data;
                }
            } catch (error) {
                this.showError('Erreur lors du chargement des articles');
                console.error('Erreur:', error);
            }
        },

        async saveArticle() {
            try {
                const formData = new FormData();
                
                // Ajouter tous les champs de l'article au FormData
                for (const [key, value] of Object.entries(this.editingArticle)) {
                    // Ne pas ajouter l'image ici car elle sera gérée séparément
                    if (key !== 'image' && value !== null && value !== undefined) {
                        formData.append(key, value);
                    }
                }

                // Ajouter l'image si elle existe
                if (this.editingArticle.image) {
                    formData.append('image', this.editingArticle.image);
                }

                console.log('Données envoyées:', Object.fromEntries(formData));

                const response = this.editingArticle.id_article
                    ? await axios.put(`/api/articles/${this.editingArticle.id_article}`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    })
                    : await axios.post('/api/articles', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });

                if (response.data.success) {
                    this.showSuccess(this.editingArticle.id_article ? 'Article modifié avec succès' : 'Article créé avec succès');
                    await this.loadArticles();
                    bootstrap.Modal.getInstance(document.getElementById('articleModal')).hide();
                } else {
                    throw new Error(response.data.message || 'Erreur lors de l\'enregistrement');
                }
            } catch (error) {
                let errorMessage = 'Erreur lors de l\'enregistrement de l\'article';
                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response?.data?.errors) {
                    errorMessage = error.response.data.errors.join('\n');
                } else if (error.message) {
                    errorMessage = error.message;
                }
                this.showError(errorMessage);
                console.error('Erreur:', error);
            }
        },

        async publierArticle(id) {
            if (!id) {
                this.showError('ID de l\'article manquant');
                return;
            }
            try {
                await axios.post(`/api/articles/${id}/publier`);
                this.loadArticles();
                this.showSuccess('Article publié avec succès');
            } catch (error) {
                this.showError('Erreur lors de la publication de l\'article');
            }
        },

        async archiverArticle(id) {
            try {
                const response = await axios.post(`/api/articles/${id}/archiver`);
                if (response.data.success) {
                    this.showSuccess('Article archivé avec succès');
                    await this.loadArticles();
                    await this.loadArchives();
                }
            } catch (error) {
                this.showError('Erreur lors de l\'archivage de l\'article');
                console.error('Erreur:', error);
            }
        },

        async supprimerArticle(id) {
            console.log('=== Début de la fonction supprimerArticle ===');
            console.log('ID reçu:', id);
            console.log('Vue actuelle:', this.currentView);
            console.log('État des listes:');
            console.log('- Articles:', this.articles);
            console.log('- Archives:', this.archives);
            
            if (!id) {
                console.error('ID manquant');
                this.showError('ID de l\'article manquant');
                return;
            }

            const article = this.currentView === 'archives' 
                ? this.archives.find(a => a.id_article === id)
                : this.articles.find(a => a.id_article === id);

            console.log('Article trouvé:', article);

            if (!article) {
                console.error('Article non trouvé dans la liste');
                this.showError('Article non trouvé');
                return;
            }

            const message = `Êtes-vous sûr de vouloir supprimer l'article "${article.titre}" ? Cette action est irréversible.`;

            if (!confirm(message)) {
                console.log('Suppression annulée par l\'utilisateur');
                return;
            }

            try {
                console.log('Envoi de la requête DELETE /api/articles/' + id);
                const response = await axios.delete(`/api/articles/${id}`);
                console.log('Réponse reçue:', response);

                if (response.data.success) {
                    this.showSuccess('Article supprimé avec succès');
                    
                    // Mise à jour optimiste des listes
                    if (this.currentView === 'archives') {
                        this.archives = this.archives.filter(a => a.id_article !== id);
                    } else {
                        this.articles = this.articles.filter(a => a.id_article !== id);
                    }
                    
                    // Recharger les données pour s'assurer de la cohérence
                    await this.loadArticles();
                    if (this.currentView === 'archives') {
                        await this.loadArchives();
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                console.error('Détails de l\'erreur:', error.response?.data);
                
                let errorMessage = 'Erreur lors de la suppression de l\'article';
                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                this.showError(errorMessage);
                
                // Recharger les données en cas d'erreur pour s'assurer de la cohérence
                await this.loadArticles();
                if (this.currentView === 'archives') {
                    await this.loadArchives();
                }
            }
        },

        // Méthodes pour les journalistes
        async loadJournalistes() {
            try {
                const response = await axios.get('/api/journalistes');
                if (response.data.success) {
                    this.journalistes = response.data.data;
                } else {
                    throw new Error(response.data.message || 'Erreur lors du chargement des journalistes');
                }
            } catch (error) {
                this.showError('Erreur lors du chargement des journalistes');
                console.error('Erreur:', error);
            }
        },

        async saveJournaliste() {
            try {
                const formData = new FormData();
                Object.keys(this.editingJournaliste).forEach(key => {
                    if (this.editingJournaliste[key] !== null) {
                        formData.append(key, this.editingJournaliste[key]);
                    }
                });

                const response = this.editingJournaliste.id_journaliste
                    ? await axios.put(`/api/journalistes/${this.editingJournaliste.id_journaliste}`, formData)
                    : await axios.post('/api/journalistes', formData);

                if (response.data.success) {
                    this.showSuccess(this.editingJournaliste.id_journaliste ? 'Journaliste modifié avec succès' : 'Journaliste créé avec succès');
                    await this.loadJournalistes();
                    bootstrap.Modal.getInstance(document.getElementById('journalisteModal')).hide();
                }
            } catch (error) {
                this.showError('Erreur lors de l\'enregistrement du journaliste');
                console.error('Erreur:', error);
            }
        },

        async supprimerJournaliste(id) {
            console.log('Tentative de suppression du journaliste:', id);
            
            if (!id) {
                this.showError('ID du journaliste manquant');
                return;
            }

            const journaliste = this.journalistes.find(j => j.id_journaliste === id);
            if (!journaliste) {
                this.showError('Journaliste non trouvé');
                return;
            }

            const message = `Êtes-vous sûr de vouloir supprimer le journaliste ${journaliste.prenom} ${journaliste.nom} ?`;
            
            if (confirm(message)) {
                try {
                    const response = await axios.delete(`/api/journalistes/${id}`);
                    
                    if (response.data.success) {
                        await this.loadJournalistes();
                        this.showSuccess('Journaliste supprimé avec succès');
                    } else {
                        throw new Error(response.data.message || 'Erreur lors de la suppression');
                    }
                } catch (error) {
                    const errorMessage = error.response?.data?.message || 
                                      error.message || 
                                      'Erreur lors de la suppression du journaliste';
                    console.error('Erreur détaillée:', error.response?.data || error);
                    this.showError(errorMessage);
                }
            }
        },

        async voirArticles(id) {
            if (!id) {
                this.showError('ID du journaliste manquant');
                return;
            }
            
            try {
                const response = await axios.get(`/api/journalistes/${id}/articles`);
                // TODO: Afficher les articles dans une modale ou une nouvelle vue
                console.log(response.data);
            } catch (error) {
                console.error('Erreur détaillée:', error.response?.data || error);
                this.showError('Erreur lors du chargement des articles du journaliste');
            }
        },

        // Méthodes utilitaires
        showArticleModal(article = null) {
            this.editingArticle = article ? { ...article } : {
                id_article: null,
                titre: '',
                contenu: '',
                id_categorie: '',
                id_journaliste: '',
                type_contenu: 'texte',
                featured: false,
                image: null
            };
            // Réinitialiser l'input file
            const imageInput = document.querySelector('#articleImage');
            if (imageInput) {
                imageInput.value = '';
            }
            new bootstrap.Modal(document.getElementById('articleModal')).show();
        },

        showJournalisteModal(journaliste = null) {
            this.editingJournaliste = journaliste ? { ...journaliste } : {
                id_journaliste: null,
                nom: '',
                prenom: '',
                email: '',
                biographie: '',
                photo: null
            };
            new bootstrap.Modal(document.getElementById('journalisteModal')).show();
        },

        handleImageUpload(event) {
            const file = event.target.files[0];
            if (file) {
                // Vérification du type de fichier
                if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                    this.showError('Format de fichier non supporté. Utilisez JPEG, PNG ou WebP.');
                    event.target.value = ''; // Réinitialiser l'input
                    return;
                }

                // Vérification de la taille (5MB max)
                if (file.size > 5 * 1024 * 1024) {
                    this.showError('L\'image ne doit pas dépasser 5MB.');
                    event.target.value = ''; // Réinitialiser l'input
                    return;
                }

                this.editingArticle.image = file;
            }
        },

        handlePhotoUpload(event) {
            const file = event.target.files[0];
            if (file) {
                this.editingJournaliste.photo = file;
            }
        },

        formatDate(date) {
            return new Date(date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        getCategorieClass(categorie) {
            const categorieSlug = categorie.toLowerCase()
                .replace(/[éèê]/g, 'e')
                .replace(/[àâ]/g, 'a')
                .replace(/[ïî]/g, 'i')
                .replace(/[ôö]/g, 'o')
                .replace(/[ùû]/g, 'u')
                .replace(/[^a-z0-9]/g, '');
            return `badge-${categorieSlug}`;
        },

        getStatutClass(statut) {
            return `badge-${statut.toLowerCase()}`;
        },

        // Ajout de la méthode pour charger les catégories
        async loadCategories() {
            try {
                const response = await axios.get('/api/categories');
                this.categories = response.data;
            } catch (error) {
                this.showError('Erreur lors du chargement des catégories');
                console.error('Erreur:', error);
            }
        },

        async loadArchives() {
            try {
                const response = await axios.get('/api/archives');
                if (response.data && response.data.success) {
                    this.archives = response.data.data;
                }
            } catch (error) {
                this.showError('Erreur lors du chargement des archives');
                console.error('Erreur:', error);
            }
        },

        async restaurerArticle(id) {
            try {
                const response = await axios.post(`/api/articles/${id}/restaurer`);
                if (response.data.success) {
                    this.showSuccess('Article restauré avec succès');
                    await this.loadArchives();
                    await this.loadArticles();
                }
            } catch (error) {
                this.showError('Erreur lors de la restauration de l\'article');
                console.error('Erreur:', error);
            }
        },

        updateCharts() {
            // Graphique des catégories
            const ctxCategories = document.getElementById('categoriesChart')?.getContext('2d');
            if (ctxCategories) {
                new Chart(ctxCategories, {
                    type: 'doughnut',
                    data: {
                        labels: this.stats.categoriesData.map(d => d.label),
                        datasets: [{
                            data: this.stats.categoriesData.map(d => d.value),
                            backgroundColor: [
                                '#dc3545', // Rouge pour Politique
                                '#28a745', // Vert pour Économie
                                '#007bff', // Bleu pour International
                                '#ffc107', // Jaune pour Sports
                                '#6f42c1'  // Violet pour Culture
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }

            // Graphique des publications
            const ctxPublications = document.getElementById('publicationsChart')?.getContext('2d');
            if (ctxPublications) {
                new Chart(ctxPublications, {
                    type: 'line',
                    data: {
                        labels: this.stats.publicationsData.map(d => d.label),
                        datasets: [{
                            label: 'Publications',
                            data: this.stats.publicationsData.map(d => d.value),
                            borderColor: '#007bff',
                            tension: 0.1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                });
            }
        },

        // Méthode pour nettoyer les graphiques lors du changement de vue
        cleanupCharts() {
            if (this.charts.categories) {
                this.charts.categories.destroy();
                this.charts.categories = null;
            }
            if (this.charts.publications) {
                this.charts.publications.destroy();
                this.charts.publications = null;
            }
        }
    }
});

app.mount('#app'); 