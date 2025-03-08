const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json()); // Essential middleware

// Load flashcards from JSON
function loadFlashcards() {
  return JSON.parse(fs.readFileSync('./flashcards.json'));
}

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/api/flashcards', (req, res) => {
  const flashcards = JSON.parse(fs.readFileSync('./flashcards.json'));
  res.json(flashcards);
});

// THIS ROUTE WAS LIKELY MISSING OR INCORRECT:
app.post('/api/update-flashcard', (req, res) => {
  const updatedCard = req.body;
  const flashcards = JSON.parse(fs.readFileSync('./flashcards.json'));
  
  const index = flashcards.findIndex(c => c.id === updatedCard.id);

  if (index !== -1) {
    flashcards[index] = updatedCard;
    fs.writeFileSync('./flashcards.json', JSON.stringify(flashcards, null, 2));
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Card not found' });
  }
});

app.use(express.static('public'));
app.use(express.json()); // <-- Important to parse JSON POST requests

app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});