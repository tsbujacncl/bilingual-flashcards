let flashcards = [];
let currentCard = {};
let direction = 'en-to-es';

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

function setRecognitionLanguage() {
  recognition.lang = direction === 'en-to-es' ? 'es-ES' : 'en-GB';
}

recognition.onresult = event => {
  const spokenAnswer = event.results[0][0].transcript.trim().toLowerCase();

  // THIS LINE WAS MISSING
  $('#user-answer').text(spokenAnswer);

  checkAnswer(spokenAnswer);
};

recognition.onerror = event => {
  $('#feedback').text(`Speech error: ${event.error}`);
};

$('#speak-btn').click(() => {
  setRecognitionLanguage();
  recognition.start();
});

$(document).ready(() => {
  $.getJSON('/api/flashcards', data => {
    flashcards = data.filter(card => new Date(card.nextReview) <= new Date());
    showNextCard();
  });

  $('#en-to-es').click(() => {
    direction = 'en-to-es';
    showNextCard();
  });

  $('#es-to-en').click(() => {
    direction = 'es-to-en';
    showNextCard();
  });

  $('#next-btn').click(() => showNextCard());

  $('#speak-btn').click(() => {
    setRecognitionLanguage();
    recognition.start();
  });

  // FSRS button events
  $('#again-btn').click(() => handleFSRS('again'));
  $('#good-btn').click(() => handleFSRS('good'));
});

function showNextCard() {
  const dueFlashcards = flashcards.filter(card => new Date(card.nextReview) <= new Date());
  currentCard = dueFlashcards[Math.floor(Math.random() * dueFlashcards.length)];
  const wordToShow = direction === 'en-to-es' ? currentCard.en : currentCard.es;
  $('#flashcard-word').text(wordToShow);
  $('#feedback').text('');
  $('#spoken-text').text('');
}

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

// FSRS logic
$('#again-btn').click(() => updateFSRS('again'));
$('#good-btn').click(() => updateFSRS('good'));

function updateFSRS(response) {
    if (response === 'again') {
      currentCard.interval = 1;
      currentCard.ease = Math.max(1.3, currentCard.ease - 0.2);
    } else if (response === 'good') {
      currentCard.interval = Math.ceil(currentCard.interval * currentCard.ease);
      currentCard.ease = Math.min(currentCard.ease + 0.1, 2.5);
    }
  
    currentCard.nextReview = new Date(Date.now() + currentCard.interval * 24 * 60 * 60 * 1000).toISOString();
  
    $.ajax({
      url: '/api/update-flashcard',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(currentCard),
      success: () => {
        $('#feedback').text('✅ Card updated successfully!');
        showNextCard();
      },
      error: (xhr, status, error) => {
        $('#feedback').text(`❌ Error updating card: ${xhr.responseText}`);
      }
    });
}