class AuthController {
    // ... existing methods ...

    static async checkAuth(req, res) {
        try {
            // Vérifier si la session existe et contient un utilisateur
            if (req.session && req.session.user) {
                res.json({
                    authenticated: true,
                    user: {
                        id: req.session.user.id,
                        email: req.session.user.email,
                        nom: req.session.user.nom,
                        prenom: req.session.user.prenom
                    }
                });
            } else {
                res.json({
                    authenticated: false
                });
            }
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'authentification:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la vérification de l\'authentification'
            });
        }
    }
}

module.exports = AuthController; 