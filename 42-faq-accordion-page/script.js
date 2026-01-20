/* --- 1. FAQ Data (Hardcoded JSON style) --- */
const faqData = [
  {
    question: "Is there a free trial available?",
    answer:
      "Yes, you can try us for free for 30 days. If you want, we’ll provide you with a free, personalized 30-minute onboarding call to get you up and running as soon as possible.",
  },
  {
    question: "Can I change my plan later?",
    answer:
      "Absolutely. You can upgrade or downgrade your plan at any time directly from the dashboard. Changes will take effect at the start of the next billing cycle.",
  },
  {
    question: "What is your cancellation policy?",
    answer:
      "We believe in easy access. You can cancel your subscription at any time without any hidden fees or penalties. You will retain access until the end of your billing period.",
  },
  {
    question: "Do you offer technical support?",
    answer:
      "Yes! Our support team is available 24/7 via email and live chat. Enterprise plans also include a dedicated account manager for priority support.",
  },
];

// Select DOM elements
const faqList = document.getElementById("faq-list");
const modeToggle = document.getElementById("mode-toggle");

/* --- 2. Render Functions --- */

// Function to generate HTML for FAQs
function renderFAQs() {
  faqList.innerHTML = faqData
    .map((faq, index) => {
      return `
            <div class="faq-item">
                <button class="faq-question" aria-expanded="false" aria-controls="faq-${index}">
                    ${faq.question}
                    <svg class="icon" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                <div class="faq-answer" id="faq-${index}" aria-hidden="true">
                    <p>${faq.answer}</p>
                </div>
            </div>
        `;
    })
    .join("");

  attachEventListeners();
}

/* --- 3. Event Handling & Logic --- */

function attachEventListeners() {
  const questions = document.querySelectorAll(".faq-question");

  questions.forEach((questionBtn) => {
    questionBtn.addEventListener("click", () => {
      const answer = questionBtn.nextElementSibling;
      const isExpanded = questionBtn.getAttribute("aria-expanded") === "true";

      // Check if "Multiple Open" mode is OFF
      if (!modeToggle.checked) {
        // If it's single mode, close all other open FAQs
        closeAllFAQs(questionBtn);
      }

      // Toggle the clicked FAQ
      if (isExpanded) {
        closeFAQ(questionBtn, answer);
      } else {
        openFAQ(questionBtn, answer);
      }
    });
  });
}

/* --- 4. Helper Functions for Animations & Accessibility --- */

function openFAQ(btn, answer) {
  // 1. Accessibility: Set state
  btn.setAttribute("aria-expanded", "true");
  btn.classList.add("active");
  answer.setAttribute("aria-hidden", "false");

  // 2. Animation: Set max-height to scrollHeight (dynamic height)
  // This allows the CSS transition to animate smoothly from 0 to actual height
  answer.style.maxHeight = answer.scrollHeight + "px";
}

function closeFAQ(btn, answer) {
  // 1. Accessibility: Set state
  btn.setAttribute("aria-expanded", "false");
  btn.classList.remove("active");
  answer.setAttribute("aria-hidden", "true");

  // 2. Animation: Reset max-height
  answer.style.maxHeight = null;
}

function closeAllFAQs(exceptBtn) {
  const allQuestions = document.querySelectorAll(".faq-question");

  allQuestions.forEach((btn) => {
    if (btn !== exceptBtn) {
      const answer = btn.nextElementSibling;
      closeFAQ(btn, answer);
    }
  });
}

// Initial Render
renderFAQs();
