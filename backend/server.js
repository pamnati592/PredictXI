require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db/connection');
const { initDb } = require('./db/init');

const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/teams');
const matchRoutes = require('./routes/matches');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

// Google OAuth Strategy — only register if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const avatarUrl = profile.photos?.[0]?.value;
        const googleId = profile.id;
        const username = profile.displayName || email?.split('@')[0];

        // Upsert user
        const result = await pool.query(
        `INSERT INTO users (email, username, google_id, avatar_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (google_id) DO UPDATE
           SET avatar_url = EXCLUDED.avatar_url, username = EXCLUDED.username
         RETURNING id, email, username, avatar_url`,
        [email, username, googleId, avatarUrl]
      );

        done(null, result.rows[0]);
      } catch (err) {
        done(err);
      }
    }
  ));
  console.log('Google OAuth strategy registered');
} else {
  console.log('Google OAuth not configured (GOOGLE_CLIENT_ID missing) — skipping');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', teamRoutes);
app.use('/api', matchRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Start server
async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Football Analytics API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
