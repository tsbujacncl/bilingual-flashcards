let flashcards = [];
let currentCard = {};
let direction = 'en-to-es'; // Default direction

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

function setRecognitionLanguage() {
  recognition.lang = direction === 'en-to-es' ? 'es-ES' : 'en-GB';
}

recognition.onresult = event => {
    const spokenAnswer = event.results[0][0].transcript.trim().toLowerCase();
  
    // Update real-time spoken answer in the UI
    $('#user-answer').text(spokenAnswer);
  
    // Check correctness
    checkAnswer(spokenAnswer);
  };

recognition.onerror = event => {
  $('#feedback').text(`Speech error: ${event.error}`);
};

$(document).ready(() => {
  $.getJSON('/api/flashcards', data => {
    flashcards = data;
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
});

function showNextCard() {
  currentCard = flashcards[Math.floor(Math.random() * flashcards.length)];
  const wordToShow = direction === 'en-to-es' ? currentCard.en : currentCard.es;
  $('#flashcard-container h2').text(wordToShow);
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

recognition.onerror = event => {
  $('#feedback').text(`Speech error: ${event.error}`);
};

$('#speak-btn').click(() => {
  setRecognitionLanguage();
  recognition.start();
});