require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();


app.use(cors());
app.use(express.json());
app.use(async (req, res, next) => {
  try { await connectDB(); next(); } catch (e) { next(e); }
});

// Routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/skills',       require('./routes/skills'));
app.use('/api/requests',     require('./routes/requests'));
app.use('/api/offers',       require('./routes/offers'));
app.use('/api/agreements',   require('./routes/agreements'));
app.use('/api/reviews',      require('./routes/reviews'));
app.use('/api/disputes',     require('./routes/disputes'));
app.use('/api/transactions', require('./routes/transactions'));

app.get('/', (req, res) => res.json({ message: 'SkillBarter API running' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
module.exports = app;
