// app.js (Root level)
const express = require('express');
const app = express();
const port = 3000;

// EJS setup
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/api/flashcards', (req, res) => {
  const flashcards = require('./flashcards.json');
  res.json(flashcards);
});

app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});