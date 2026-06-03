const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const poleRoutes = require('./routes/poleRoutes');
const activityRoutes = require('./routes/activityRoutes');
const activityReportRoutes = require('./routes/activityReportRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/poles', poleRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/activity-reports', activityReportRoutes);

// Route de santé
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Serveur démarré avec succès' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Une erreur est survenue' });
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});



// Ajouter après les autres routes
const validationRoutes = require('./routes/validationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const coordinatorRoutes = require('./routes/coordinatorRoutes');

app.use('/api/validation', validationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/coordinators', coordinatorRoutes);