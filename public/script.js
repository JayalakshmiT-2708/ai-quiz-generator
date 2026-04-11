const form = document.getElementById('quiz-form');
const topicInput = document.getElementById('topic-input');
const generateBtn = document.getElementById('generate-btn');
const btnText = document.querySelector('.btn-text');
const spinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');
const loadingIndicator = document.getElementById('loading-indicator');
const quizContainer = document.getElementById('quiz-container');
const questionsList = document.getElementById('questions-list');
const quizTopicTitle = document.getElementById('quiz-topic-title');
const scoreContainer = document.getElementById('score-container');
const finalScoreText = document.getElementById('final-score-text');
const scoreMessage = document.getElementById('score-message');
const crownGraphic = document.getElementById('crown-graphic');
const medalGraphic = document.getElementById('medal-graphic');

let currentScore = 0;
let answeredCount = 0;
let totalQuestions = 0;

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const topic = topicInput.value.trim();
    if (!topic) {
        showError('Please enter a topic');
        return;
    }

    // Set Dynamic Cartoon Background
    document.body.style.backgroundImage = `url('https://image.pollinations.ai/prompt/cute%20cartoon%20style%20illustration%20of%20${encodeURIComponent(topic)}')`;
    document.getElementById('dim-overlay').classList.add('active');

    // Reset UI
    hideError();
    quizContainer.classList.add('hidden');
    scoreContainer.classList.add('hidden');
    crownGraphic.classList.add('hidden');
    crownGraphic.classList.remove('crown-drop-anim');
    medalGraphic.classList.add('hidden');
    questionsList.innerHTML = '';
    currentScore = 0;
    answeredCount = 0;
    
    // Set Loading State
    setLoadingState(true);

    try {
        const response = await fetch('/api/quiz/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ topic })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to generate quiz');
        }

        renderQuiz(data.topic, data.quiz);
    } catch (error) {
        showError(error.message);
    } finally {
        setLoadingState(false);
    }
});

function setLoadingState(isLoading) {
    if (isLoading) {
        generateBtn.disabled = true;
        btnText.textContent = 'Generating...';
        spinner.classList.remove('hidden');
        topicInput.disabled = true;
        loadingIndicator.classList.remove('hidden');
    } else {
        generateBtn.disabled = false;
        btnText.textContent = 'Generate Quiz';
        spinner.classList.add('hidden');
        topicInput.disabled = false;
        loadingIndicator.classList.add('hidden');
        topicInput.focus();
    }
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
    errorMessage.textContent = '';
}

function renderQuiz(topic, questions) {
    quizTopicTitle.textContent = `Quiz: ${topic}`;
    questionsList.innerHTML = '';
    totalQuestions = questions.length;

    questions.forEach((q, index) => {
        const card = document.createElement('div');
        card.className = 'question-card';

        const questionText = document.createElement('div');
        questionText.className = 'question-text';
        questionText.textContent = `${index + 1}. ${q.question}`;
        
        const optionsGrid = document.createElement('div');
        optionsGrid.className = 'options-grid';

        const explanationDiv = document.createElement('div');
        explanationDiv.className = 'explanation hidden';
        
        let explanationHTML = `<div class="correct-answer-text">Correct Answer: ${q.answer}</div>`;
        explanationHTML += `<strong>Explanation:</strong> ${q.explanation}`;
        
        // Add Youtube Video if the AI provided a search query!
        if (q.video_search_query && q.video_search_query !== 'null') {
            const encodedQuery = encodeURIComponent(q.video_search_query);
            explanationHTML += `
            <div style="margin-top: 1.5rem; text-align: center;">
                <a href="https://www.youtube.com/results?search_query=${encodedQuery}" target="_blank" style="display: inline-flex; align-items: center; justify-content: center; background: #ef4444; color: white; text-decoration: none; padding: 0.8rem 1.5rem; border-radius: 50px; font-weight: 600; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <svg style="width: 24px; height: 24px; margin-right: 8px;" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                    Play Working Model Animation
                </a>
            </div>`;
        }
        
        explanationDiv.innerHTML = explanationHTML;

        q.options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = option;
            
            // Handle option click
            btn.addEventListener('click', () => {
                // Disable all buttons in this grid
                const allButtons = optionsGrid.querySelectorAll('.option-btn');
                allButtons.forEach(b => {
                    b.disabled = true;
                    // Hide incorrect options to simplify view
                    if (b.textContent !== q.answer) {
                        b.classList.add('option-hidden');
                    }
                });

                answeredCount++;

                if (option === q.answer) {
                    btn.classList.add('correct');
                    currentScore++;
                } else {
                    btn.classList.add('incorrect');
                    // Find and highlight correct answer
                    allButtons.forEach(b => {
                        if (b.textContent === q.answer) {
                            b.classList.add('correct');
                            b.classList.remove('option-hidden');
                        }
                    });
                }
                
                // Show explanation
                explanationDiv.classList.remove('hidden');

                // Check if all questions are answered
                if (answeredCount === totalQuestions) {
                    displayFinalScore();
                }
            });

            optionsGrid.appendChild(btn);
        });

        card.appendChild(questionText);
        card.appendChild(optionsGrid);
        card.appendChild(explanationDiv);

        questionsList.appendChild(card);
    });

    quizContainer.classList.remove('hidden');
}

function displayFinalScore() {
    finalScoreText.textContent = `${currentScore}/${totalQuestions}`;
    
    // Set encouraging message based on score
    const percentage = currentScore / totalQuestions;
    if (percentage === 1) {
        scoreMessage.textContent = "Perfect! The Crown is yours! 👑🌟";
        crownGraphic.classList.remove('hidden');
        crownGraphic.classList.add('crown-drop-anim');
        // ensure avatar container is scrolled into view so they see the crown!
        document.getElementById('player-profile').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (percentage >= 0.6) {
        scoreMessage.textContent = "Awesome job! You earned a Trophy! 🏆🔥";
        medalGraphic.classList.remove('hidden');
        document.getElementById('player-profile').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (percentage >= 0.5) {
        scoreMessage.textContent = "Good effort! You passed. 👍";
    } else {
        scoreMessage.textContent = "Keep practicing! You'll get it next time. 💪";
    }
    
    scoreContainer.classList.remove('hidden');
    if (percentage < 0.6) {
        // Only scroll to score container if we didn't scroll to avatar
        scoreContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
