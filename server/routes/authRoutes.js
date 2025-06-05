const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Route pour vérifier l'état d'authentification
router.get('/check', AuthController.checkAuth);

// ... existing routes ...

module.exports = router; 