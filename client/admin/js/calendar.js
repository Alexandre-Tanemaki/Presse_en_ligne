// Méthodes pour le calendrier éditorial
const calendarMethods = {
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
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        return this.articles.filter(article => {
            const articleDate = new Date(article.date_publication);
            return articleDate >= startOfDay && articleDate <= endOfDay;
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
            // Afficher les articles dans une modale
            const modalContent = `
                <div class="modal-header">
                    <h5 class="modal-title">Articles du ${new Date(day.date).toLocaleDateString('fr-FR')}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="list-group">
                        ${day.articles.map(article => `
                            <div class="list-group-item">
                                <h6>${article.titre}</h6>
                                <p class="mb-1">${article.contenu.substring(0, 100)}...</p>
                                <small class="text-muted">
                                    Par ${article.journaliste_prenom} ${article.journaliste_nom}
                                </small>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            const modal = document.getElementById('articleModal');
            modal.querySelector('.modal-content').innerHTML = modalContent;
            new bootstrap.Modal(modal).show();
        }
    }
}; 