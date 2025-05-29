const { createApp } = Vue;



// Instance Bootstrap pour les modales
let articleModal, journalisteModal;
let categoriesChart, publicationsChart;

const app = createApp({
    data() {
        return {
            currentView: 'dashboard',
            articles: [],
            archives: [],
            journalistes: [],
            categories: [],
            notifications: [],
            stats: {
                articlesPublies: 0,
                articlesEnAttente: 0,
                journalistesActifs: 0,
                vuesTotales: 0,
                articlesTrend: 0,
                vuesTrend: 0
            },
            filters: {
                categorie: '',
                statut: '',
                journaliste_id: '',
                search: ''
            },
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            calendarDays: [],
            editingArticle: {
                titre: '',
                contenu: '',
                id_categorie: '',
                id_journaliste: '',
                type_contenu: 'texte',
                statut: '',
                featured: 0,
                tagsInput: ''
            },
            editingJournaliste: {
                nom: '',
                prenom: '',
                email: '',
                biographie: '',
                photo_url: ''
            }
        };
    },

    computed: {
        filteredArticles() {
            return this.articles.filter(article => {
                if (this.filters.categorie && article.categorie !== this.filters.categorie) return false;
                if (this.filters.statut && article.statut !== this.filters.statut) return false;
                if (this.filters.journaliste_id && article.journaliste_id !== this.filters.journaliste_id) return false;
                if (this.filters.search) {
                    const searchTerm = this.filters.search.toLowerCase();
                    return article.titre.toLowerCase().includes(searchTerm) ||
                           article.contenu.toLowerCase().includes(searchTerm);
                }
                return true;
            });
        },

        filteredArchives() {
            return this.archives.filter(article => {
                if (this.filters.categorie && article.id_categorie !== this.filters.categorie) return false;
                if (this.filters.journaliste_id && article.id_journaliste !== this.filters.journaliste_id) return false;
                if (this.filters.search) {
                    const searchTerm = this.filters.search.toLowerCase();
                    return article.titre.toLowerCase().includes(searchTerm) ||
                           article.contenu.toLowerCase().includes(searchTerm) ||
                           (article.raison_archivage && article.raison_archivage.toLowerCase().includes(searchTerm));
                }
                return true;
            });
        },

        currentMonthName() {
            return new Date(this.currentYear, this.currentMonth).toLocaleString('fr-FR', { month: 'long' });
        }
    },

    watch: {
        currentView(newView) {
            if (newView === 'dashboard') {
                this.$nextTick(() => {
                    this.initCharts();
                });
            } else if (newView === 'archives') {
                this.loadArchives();
            }
        }
    },

    mounted() {
        // Initialisation des modales Bootstrap
        articleModal = new bootstrap.Modal(document.getElementById('articleModal'));
        journalisteModal = new bootstrap.Modal(document.getElementById('journalisteModal'));

        // Chargement initial des données
        this.loadArticles();
        this.loadJournalistes();
        this.loadCategories();
        this.loadStats();
        this.updateCalendar();

        if (this.currentView === 'dashboard') {
            this.$nextTick(() => {
                this.initCharts();
            });
        }
    },

    methods: {
        // Méthodes pour les notifications
        showNotification(message, type = 'info') {
            const id = Date.now();
            this.notifications.push({ id, message, type, removing: false });
            setTimeout(() => this.closeNotification(id), 5000);
        },

        closeNotification(id) {
            const index = this.notifications.findIndex(n => n.id === id);
            if (index !== -1) {
                this.notifications[index].removing = true;
            }
        },

        removeNotification(id) {
            const notification = this.notifications.find(n => n.id === id);
            if (notification && notification.removing) {
                this.notifications = this.notifications.filter(n => n.id !== id);
            }
        },

        showSuccess(message) {
            this.showNotification(message, 'success');
        },

        showError(message) {
            this.showNotification(message, 'error');
        },

        // Méthodes pour le tableau de bord
        async loadStats() {
            try {
                const response = await axios.get('/api/stats');
                if (response.data && response.data.success) {
                    this.stats = response.data.data;
                    this.$nextTick(() => {
                        this.initCharts();
                    });
                } else {
                    throw new Error('Format de données invalide');
                }
            } catch (error) {
                console.error('Erreur lors du chargement des statistiques:', error);
                this.showError('Erreur lors du chargement des statistiques');
            }
        },

        initCharts() {
            if (!document.getElementById('categoriesChart') || !document.getElementById('publicationsChart')) {
                return;
            }

            // Graphique des catégories
            const ctxCategories = document.getElementById('categoriesChart').getContext('2d');
            if (categoriesChart) {
                categoriesChart.destroy();
            }
            categoriesChart = new Chart(ctxCategories, {
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

            // Graphique des publications
            const ctxPublications = document.getElementById('publicationsChart').getContext('2d');
            if (publicationsChart) {
                publicationsChart.destroy();
            }

            // Formater les mois pour l'affichage
            const moisLabels = this.stats.publicationsData.map(item => {
                const [annee, mois] = item.mois.split('-');
                return new Date(annee, mois - 1).toLocaleString('fr-FR', { month: 'short' });
            });

            publicationsChart = new Chart(ctxPublications, {
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

            // Ajouter les jours du mois
            for (let d = 1; d <= lastDay.getDate(); d++) {
                const date = new Date(this.currentYear, this.currentMonth, d);
                days.push({
                    date: date,
                    articles: this.getArticlesForDate(date)
                });
            }

            this.calendarDays = days;
        },

        getArticlesForDate(date) {
            return this.articles.filter(article => {
                if (!article.date_publication) return false;
                const pubDate = new Date(article.date_publication);
                return pubDate.getDate() === date.getDate() &&
                       pubDate.getMonth() === date.getMonth() &&
                       pubDate.getFullYear() === date.getFullYear();
            });
        },

        // Méthodes pour les articles
        async loadArticles() {
            try {
                const response = await axios.get('/api/articles');
                if (response.data && response.data.success && Array.isArray(response.data.data)) {
                    this.articles = response.data.data;
                    this.updateCalendar();
                } else {
                    throw new Error('Format de données invalide');
                }
            } catch (error) {
                this.showError('Erreur lors du chargement des articles');
                console.error('Détails de l\'erreur:', error);
            }
        },

        async saveArticle() {
            try {
                const formData = new FormData();
                formData.append('titre', this.editingArticle.titre);
                formData.append('contenu', this.editingArticle.contenu);
                formData.append('id_categorie', this.editingArticle.id_categorie);
                formData.append('id_journaliste', this.editingArticle.id_journaliste);
                formData.append('type_contenu', this.editingArticle.type_contenu);
                formData.append('statut', this.editingArticle.statut);
                formData.append('featured', this.editingArticle.featured);
                formData.append('tags', this.editingArticle.tagsInput);

                if (this.editingArticle.imageFile) {
                    formData.append('image', this.editingArticle.imageFile);
                }

                if (this.editingArticle.id) {
                    await axios.put(`/api/articles/${this.editingArticle.id}`, formData);
                } else {
                    await axios.post('/api/articles', formData);
                }

                articleModal.hide();
                this.loadArticles();
                this.showSuccess('Article enregistré avec succès');
            } catch (error) {
                console.error('Erreur détaillée:', error.response?.data || error);
                this.showError('Erreur lors de l\'enregistrement de l\'article');
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
                const raison = prompt("Pourquoi archiver cet article ? (optionnel)");
                await axios.post(`/api/archives/${id}`, { raison });
                this.loadArticles();
                this.showSuccess('Article archivé avec succès');
            } catch (error) {
                this.showError('Erreur lors de l\'archivage de l\'article');
            }
        },

        async supprimerArticle(id) {
            if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
                try {
                    await axios.delete(`/api/articles/${id}`);
                    this.loadArticles();
                    this.showSuccess('Article supprimé avec succès');
                } catch (error) {
                    this.showError('Erreur lors de la suppression de l\'article');
                }
            }
        },

        // Méthodes pour les journalistes
        async loadJournalistes() {
            try {
                const response = await axios.get('/api/journalistes');
                console.log('Réponse complète:', response);
                console.log('Structure de la réponse:', {
                    success: response.data.success,
                    dataType: typeof response.data.data,
                    isArray: Array.isArray(response.data.data),
                    dataLength: response.data.data?.length,
                    firstItem: response.data.data?.[0]
                });
                
                if (response.data && response.data.success && Array.isArray(response.data.data)) {
                    this.journalistes = response.data.data.map(j => {
                        console.log('Journaliste brut:', j);
                        return {
                            id_journaliste: j.id_journaliste,
                            nom: j.nom,
                            prenom: j.prenom,
                            email: j.email,
                            biographie: j.biographie,
                            photo_url: j.photo_url
                        };
                    });
                    console.log('Journalistes transformés:', this.journalistes);
                } else {
                    console.error('Format de données invalide:', response.data);
                    this.showError('Format de données invalide pour les journalistes');
                }
            } catch (error) {
                console.error('Erreur détaillée:', error.response?.data || error);
                this.showError('Erreur lors du chargement des journalistes');
            }
        },

        async saveJournaliste() {
            try {
                const formData = new FormData();
                formData.append('nom', this.editingJournaliste.nom);
                formData.append('prenom', this.editingJournaliste.prenom);
                formData.append('email', this.editingJournaliste.email);
                formData.append('biographie', this.editingJournaliste.biographie);

                if (this.editingJournaliste.photoFile) {
                    formData.append('photo', this.editingJournaliste.photoFile);
                }

                if (this.editingJournaliste.id_journaliste) {
                    await axios.put(`/api/journalistes/${this.editingJournaliste.id_journaliste}`, formData);
                } else {
                    await axios.post('/api/journalistes', formData);
                }

                journalisteModal.hide();
                this.loadJournalistes();
                this.showSuccess('Journaliste enregistré avec succès');
            } catch (error) {
                console.error('Erreur détaillée:', error.response?.data || error);
                
                // Gestion spécifique des erreurs
                if (error.response?.data?.error?.includes('Duplicate entry') && error.response?.data?.error?.includes('email')) {
                    this.showError('Cette adresse email est déjà utilisée par un autre journaliste');
                } else {
                    this.showError('Erreur lors de l\'enregistrement du journaliste');
                }
            }
        },

        async supprimerJournaliste(id) {
            if (!id) {
                this.showError('ID du journaliste manquant');
                return;
            }
            
            if (confirm('Êtes-vous sûr de vouloir supprimer ce journaliste ?')) {
                try {
                    await axios.delete(`/api/journalistes/${id}`);
                    this.loadJournalistes();
                    this.showSuccess('Journaliste supprimé avec succès');
                } catch (error) {
                    console.error('Erreur détaillée:', error.response?.data || error);
                    this.showError('Erreur lors de la suppression du journaliste');
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
            if (article) {
                this.editingArticle = { ...article };
                this.editingArticle.id = article.id_article;
                this.editingArticle.tagsInput = article.tags ? article.tags.join(', ') : '';
            } else {
                this.editingArticle = {
                    titre: '',
                    contenu: '',
                    id_categorie: this.categories.length > 0 ? this.categories[0].id_categorie : '',
                    id_journaliste: '',
                    type_contenu: 'texte',
                    statut: '',
                    featured: 0,
                    tagsInput: ''
                };
            }
            articleModal.show();
        },

        showJournalisteModal(journaliste = null) {
            if (journaliste) {
                this.editingJournaliste = { ...journaliste };
            } else {
                this.editingJournaliste = {
                    nom: '',
                    prenom: '',
                    email: '',
                    biographie: '',
                    photo_url: ''
                };
            }
            journalisteModal.show();
        },

        handleImageUpload(event) {
            this.editingArticle.imageFile = event.target.files[0];
        },

        handlePhotoUpload(event) {
            this.editingJournaliste.photoFile = event.target.files[0];
        },

        formatDate(date) {
            if (!date) return '-';
            return new Date(date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        getCategorieClass(categorie) {
            return `badge-${categorie}`;
        },

        getStatutClass(statut) {
            return `badge-${statut}`;
        },

        // Ajout de la méthode pour charger les catégories
        async loadCategories() {
            try {
                const response = await axios.get('/api/categories');
                if (response.data && Array.isArray(response.data)) {
                    this.categories = response.data;
                } else {
                    throw new Error('Format de données invalide pour les catégories');
                }
            } catch (error) {
                console.error('Erreur lors du chargement des catégories:', error);
                this.showError('Erreur lors du chargement des catégories');
            }
        },

        async loadArchives() {
            try {
                const response = await axios.get('/api/archives');
                if (response.data && Array.isArray(response.data)) {
                    this.archives = response.data;
                } else {
                    throw new Error('Format de données invalide');
                }
            } catch (error) {
                console.error('Erreur lors du chargement des archives:', error);
                this.showError('Erreur lors du chargement des archives');
            }
        },

        async restaurerArticle(id) {
            if (!id) {
                this.showError('ID de l\'article manquant');
                return;
            }
            try {
                await axios.post(`/api/archives/${id}/restaurer`);
                this.loadArchives();
                this.loadArticles();
                this.showSuccess('Article restauré avec succès');
            } catch (error) {
                this.showError('Erreur lors de la restauration de l\'article');
            }
        }
    }
});

app.mount('#app'); 