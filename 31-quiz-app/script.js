// --- 1. Question Data (Local JSON structure) ---
const questions = [
  {
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Preprocessor",
      "Hyper Text Markup Language",
      "Hyper Text Multiple Language",
      "Hyper Tool Multi Language",
    ],
    correctIndex: 1,
  },
  {
    question: "Which CSS property controls text size?",
    options: ["font-style", "text-size", "font-size", "text-style"],
    correctIndex: 2,
  },
  {
    question: "Inside which HTML element do we put the JavaScript?",
    options: ["<script>", "<javascript>", "<js>", "<scripting>"],
    correctIndex: 0,
  },
  {
    question: "How do you declare a JavaScript variable?",
    options: [
      "v carName;",
      "variable carName;",
      "var carName;",
      "dim carName;",
    ],
    correctIndex: 2,
  },
  {
    question: "Which event occurs when the user clicks on an HTML element?",
    options: ["onchange", "onmouseclick", "onmouseover", "onclick"],
    correctIndex: 3,
  },
];

// --- 2. State Management ---
let currentState = {
  currentQuestionIndex: 0,
  score: 0,
  answers: [], // Optional: Track specific answers if needed later
};

// --- 3. DOM Elements ---
// Screens
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

// Header elements
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");
const questionCountDisplay = document.getElementById("question-count");

// Quiz elements
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const nextBtn = document.getElementById("next-btn");
const feedback = document.getElementById("feedback");

// Buttons
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");

// Results
const finalScore = document.getElementById("final-score");
const scoreMessage = document.getElementById("score-message");

// --- 4. Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
  startBtn.addEventListener("click", startQuiz);
  nextBtn.addEventListener("click", handleNextButton);
  restartBtn.addEventListener("click", restartQuiz);
});

// --- 5. Core Functions ---

function startQuiz() {
  // Reset state
  currentState.currentQuestionIndex = 0;
  currentState.score = 0;

  // Switch Views
  startScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");
  progressContainer.classList.remove("hidden");

  // Load first question
  loadQuestion();
}

function loadQuestion() {
  const questionData = questions[currentState.currentQuestionIndex];

  // Update UI text
  questionText.textContent = questionData.question;
  questionCountDisplay.textContent = `Question ${currentState.currentQuestionIndex + 1} of ${questions.length}`;

  // Update Progress Bar
  const progressPercent =
    (currentState.currentQuestionIndex / questions.length) * 100;
  progressBar.style.width = `${progressPercent}%`;

  // Reset Controls
  nextBtn.disabled = true;
  feedback.classList.add("hidden");
  feedback.textContent = "";

  // Clear and Render Options
  optionsContainer.innerHTML = "";

  questionData.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.classList.add("option-btn");
    button.textContent = option;

    // Add click handler for selection
    button.onclick = () => selectOption(index, button);

    optionsContainer.appendChild(button);
  });
}

function selectOption(selectedIndex, selectedButton) {
  const currentQuestion = questions[currentState.currentQuestionIndex];
  const correctIndex = currentQuestion.correctIndex;

  // Disable all buttons to prevent re-selection
  const allOptions = optionsContainer.querySelectorAll(".option-btn");
  allOptions.forEach((btn) => (btn.disabled = true));

  // Validate Answer
  if (selectedIndex === correctIndex) {
    currentState.score++;
    selectedButton.classList.add("correct");
    feedback.textContent = "Correct! 🎉";
    feedback.style.color = "var(--success)";
  } else {
    selectedButton.classList.add("incorrect");
    feedback.textContent = "Incorrect!";
    feedback.style.color = "var(--error)";

    // Highlight the correct answer for learning
    allOptions[correctIndex].classList.add("correct");
  }

  // Show feedback and enable next button
  feedback.classList.remove("hidden");
  nextBtn.disabled = false;
}

function handleNextButton() {
  currentState.currentQuestionIndex++;

  if (currentState.currentQuestionIndex < questions.length) {
    loadQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  // Hide Quiz, Show Results
  quizScreen.classList.add("hidden");
  progressContainer.classList.add("hidden"); // Hide progress in result view
  resultScreen.classList.remove("hidden");

  // Update Score UI
  finalScore.textContent = `${currentState.score} / ${questions.length}`;

  // Generate dynamic message
  const percentage = (currentState.score / questions.length) * 100;
  if (percentage === 100) {
    scoreMessage.textContent = "Perfect Score! You're a master! 🏆";
  } else if (percentage >= 70) {
    scoreMessage.textContent = "Great job! You know your stuff. 👍";
  } else {
    scoreMessage.textContent = "Keep practicing! You'll get there. 📚";
  }
}

function restartQuiz() {
  startQuiz();
}
