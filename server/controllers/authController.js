const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

exports.register = async (req, res) => {
    try {
        const { email, password, fullName, role, poleId } = req.body;
        
        // Vérifier si l'utilisateur existe déjà
        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
        
        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Créer l'utilisateur
        const [result] = await db.query(
            `INSERT INTO users (email, password_hash, full_name, role, pole_id) 
             VALUES (?, ?, ?, ?, ?)`,
            [email, hashedPassword, fullName, role || 'MEMBER', poleId || null]
        );
        
        const [newUser] = await db.query(
            `SELECT id, email, full_name, role, pole_id FROM users WHERE id = ?`,
            [result.insertId]
        );
        
        // Générer le token
        const token = jwt.sign(
            { id: newUser[0].id, email: newUser[0].email, role: newUser[0].role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            user: newUser[0],
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
    }
};

// =============================================
// ⚠️ VERSION AVEC LOGS - REMPLACEZ COMPLÈTEMENT
// =============================================
exports.login = async (req, res) => {
    console.log("🔵 ===== TENTATIVE DE LOGIN =====");
    console.log("📥 Email reçu:", req.body.email);
    console.log("📥 Password reçu:", req.body.password ? "✅ Oui" : "❌ Non");
    
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            console.log("❌ Email ou mot de passe manquant");
            return res.status(400).json({ message: 'Email et mot de passe requis' });
        }

        console.log("🔍 Recherche de l'utilisateur dans la DB...");
        const [users] = await db.query(
            `SELECT u.*, p.name as pole_name 
             FROM users u 
             LEFT JOIN poles p ON u.pole_id = p.id 
             WHERE u.email = ?`,
            [email]
        );
        
        console.log("👤 Utilisateurs trouvés:", users.length);
        
        if (users.length === 0) {
            console.log("❌ Aucun utilisateur trouvé pour:", email);
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }
        
        const user = users[0];
        console.log("✅ Utilisateur trouvé:", user.email);
        console.log("🔑 Hash en base:", user.password_hash ? user.password_hash.substring(0, 20) + "..." : "NULL");
        
        console.log("🔐 Vérification du mot de passe...");
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        console.log("🔐 Résultat comparaison:", isValidPassword ? "✅ OK" : "❌ ÉCHEC");
        
        if (!isValidPassword) {
            console.log("❌ Mot de passe incorrect pour:", email);
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }
        
        console.log("🎉 Connexion réussie pour:", email);
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        res.json({
            message: 'Connexion réussie',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                poleId: user.pole_id,
                poleName: user.pole_name
            },
            token
        });
    } catch (error) {
        console.error("💥 ERREUR lors de la connexion:", error);
        console.error("📚 Stack:", error.stack);
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
};