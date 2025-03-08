// ==========================
// Flashcard App - Client-Side Logic
// ==========================

let flashcards = [];  // Stores flashcards fetched from the server
let currentCard = {}; // The flashcard currently being tested
let direction = 'en-to-es'; // Default direction (English → Spanish)

// Initialize Speech Recognition
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.running = false; // Prevents multiple starts

/**
 * Sets the recognition language based on the current flashcard direction.
 */
function setRecognitionLanguage() {
  recognition.lang = direction === 'en-to-es' ? 'es-ES' : 'en-GB';
}

// Event handler for when speech recognition starts
recognition.onstart = () => {
  recognition.running = true;
};

// Event handler for when speech recognition ends
recognition.onend = () => {
  recognition.running = false;
};

// Handles speech recognition results
recognition.onresult = event => {
  if (!event.results || !event.results[0] || !event.results[0][0].transcript) {
    $('#user-answer').text("❌ No speech detected!");
    return;
  }

  const spokenAnswer = event.results[0][0].transcript.trim().toLowerCase();
  $('#user-answer').text(spokenAnswer);
  checkAnswer(spokenAnswer);
};

// Handles speech recognition errors
recognition.onerror = event => {
  $('#feedback').text(`Speech error: ${event.error}`);
};

// Start speech recognition when "Speak Answer" button is clicked
$('#speak-btn').click(() => {
  if (recognition.running) return; // Prevent multiple recognition starts
  setRecognitionLanguage();
  recognition.start();
});

// Fetch flashcards from the server on page load
$(document).ready(() => {
  $.getJSON('/api/flashcards', data => {
    flashcards = [];

    const today = new Date();

    // Separate English → Spanish and Spanish → English cards
    data.forEach(card => {
      if (new Date(card.nextReview) <= today) {
        flashcards.push({ ...card, direction: 'en-to-es' });
        flashcards.push({ ...card, direction: 'es-to-en' });
      }
    });

    // Shuffle flashcards for varied practice
    flashcards.sort(() => Math.random() - 0.5);

    if (flashcards.length > 0) {
      showNextCard();
    } else {
      $('#flashcard-direction').text("No flashcards available.");
      $('#flashcard-word').text("");
    }
  }).fail(() => {
    $('#flashcard-direction').text("❌ Error loading flashcards!");
    $('#flashcard-word').text("");
  });

  // Attach event listeners for FSRS buttons
  $('#again-btn').click(() => updateFSRS('again'));
  $('#good-btn').click(() => updateFSRS('good'));
  $('#next-btn').click(() => showNextCard());
});

/**
 * Displays the next flashcard from the shuffled deck.
 */
function showNextCard() {
  if (flashcards.length === 0) {
    $('#flashcard-direction').text("No flashcards available!");
    $('#flashcard-word').text("");
    return;
  }

  currentCard = flashcards[Math.floor(Math.random() * flashcards.length)];
  direction = currentCard.direction;

  $('#flashcard-direction').text(direction === 'en-to-es' ? "Translate English → Spanish" : "Translate Spanish → English");
  $('#flashcard-word').text(direction === 'en-to-es' ? currentCard.en : currentCard.es);
  $('#feedback').text('');
  $('#spoken-text').text('');
}

/**
 * Checks if the spoken answer matches the correct translation.
 * @param {string} userAnswer - The spoken answer from the user.
 */
function checkAnswer(userAnswer) {
  const correctAnswer = direction === 'en-to-es'
    ? currentCard.es.toLowerCase()
    : currentCard.en.toLowerCase();

  if (userAnswer === correctAnswer) {
    $('#feedback').text('✅ Correct!');
  } else {
    $('#feedback').text(`❌ Incorrect! Correct answer: ${correctAnswer}`);
  }
}

/**
 * Updates the flashcard's FSRS (spaced repetition) properties.
 * @param {string} response - The user's response ("again" or "good").
 */
function updateFSRS(response) {
  if (response === 'again') {
    currentCard.interval = 1; // Reset interval to 1 day
    currentCard.ease = Math.max(1.3, currentCard.ease - 0.2);
  } else if (response === 'good') {
    currentCard.interval = Math.ceil(currentCard.interval * currentCard.ease);
    currentCard.ease = Math.min(currentCard.ease + 0.1, 2.5);
  }

  // Ensure next review date is valid
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + (currentCard.interval || 1)); 
  currentCard.nextReview = nextReviewDate.toISOString();

  // Send updated flashcard data to the server
  $.ajax({
    url: '/api/update-flashcard',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(currentCard),
    success: () => {
      $('#feedback').text('✅ Card updated successfully!');
      showNextCard();
    },
    error: err => {
      $('#feedback').text(`❌ Error updating card: ${err.responseText}`);
    }
  });
}