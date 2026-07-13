const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  "http://localhost:3000",
  "http://localhost:3001",
  "https://icc-audiovisual-bbcs.vercel.app"
].filter(Boolean);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/i.test(origin)
      ) {
        callback(null, true);
      } else {
        console.log(`❌ CORS bloqué pour: ${origin}`);
        callback(new Error(`Origin not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const poleRoutes = require("./routes/poleRoutes");
const activityRoutes = require("./routes/activityRoutes");
const activityReportRoutes = require("./routes/activityReportRoutes");
const validationRoutes = require("./routes/validationRoutes");
const reportRoutes = require("./routes/reportRoutes");
const coordinatorRoutes = require("./routes/coordinatorRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/poles", poleRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/activity-reports", activityReportRoutes);
app.use("/api/validation", validationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/coordinators", coordinatorRoutes);

// Route de santé
app.get("/health", async (req, res) => {
  try {
    const db = require("./config/database");
    const [result] = await db.query("SELECT 1 as test, NOW() as time");
    res.json({
      status: "OK",
      message: "API ICC Audiovisual",
      database: "Connectée ✅",
      timestamp: result[0].time
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Erreur de connexion à la base",
      error: error.message
    });
  }
});

// Route racine
app.get("/", (req, res) => {
  res.json({
    name: "ICC Audiovisual API",
    version: "1.0.0",
    status: "online",
    endpoints: {
      auth: "/api/auth/login, /api/auth/register",
      users: "/api/users",
      poles: "/api/poles",
      activities: "/api/activities",
      health: "/health"
    }
  });
});

// Gestion 404
app.use((req, res) => {
  res.status(404).json({
    message: "Route non trouvée",
    requestedUrl: req.originalUrl
  });
});

// Gestion erreurs
app.use((err, req, res, next) => {
  console.error("💥 Erreur:", err.stack);
  res.status(500).json({
    message: "Une erreur est survenue",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 URL: https://icc-audiovisual-1.onrender.com`);
  console.log(`🔗 CORS autorisé pour : ${allowedOrigins.join(", ")}`);
});



// ROUTE DE DEBUG - À SUPPRIMER APRÈS
app.get("/debug/users", async (req, res) => {
  try {
    const db = require("./config/database");
    const [users] = await db.query("SELECT id, email, LEFT(password_hash, 30) as hash_preview, role FROM users");
    res.json({
      count: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});