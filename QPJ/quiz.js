document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const quizLoader = document.getElementById('quiz-loader');
    const quizStartScreen = document.getElementById('quiz-start-screen');
    const quizMainScreen = document.getElementById('quiz-main-screen');
    const quizEndScreen = document.getElementById('quiz-end-screen');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const currentQuestionNum = document.getElementById('current-question-num');
    const totalQuestionsStart = document.getElementById('total-questions-start');
    const totalQuestionsMain = document.getElementById('total-questions-main');
    const finalScore = document.getElementById('final-score');
    const correctCount = document.getElementById('correct-count');
    const incorrectCount = document.getElementById('incorrect-count');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');

    // Quiz State
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;

    // --- Functions ---

    function loadQuizFromURL() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const data = urlParams.get('data');
            
            if (!data) throw new Error('找不到測驗資料');

            // 1. Base64 Decode
            const base64Decoded = atob(data);
            
            // 2. Convert to Uint8Array
            const uint8Array = new Uint8Array(base64Decoded.split('').map(char => char.charCodeAt(0)));
            
            // 3. Decompress with Pako
            const decompressed = pako.inflate(uint8Array, { to: 'string' });
            
            // 4. Parse JSON
            const parsedQuestions = JSON.parse(decompressed);

            if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
                throw new Error('測驗資料格式不正確');
            }
            
            questions = parsedQuestions;
            initializeQuiz();

        } catch (error) {
            console.error('載入測驗失敗:', error);
            quizLoader.innerHTML = `<h1 class="text-3xl font-bold text-red-500">載入測驗失敗</h1><p class="text-gray-500 mt-2">${error.message}</p>`;
        }
    }

    function initializeQuiz() {
        totalQuestionsStart.textContent = questions.length;
        totalQuestionsMain.textContent = questions.length;
        quizLoader.classList.add('hidden');
        quizStartScreen.classList.remove('hidden');
    }

    function startQuiz() {
        currentQuestionIndex = 0;
        score = 0;
        quizStartScreen.classList.add('hidden');
        quizEndScreen.classList.add('hidden');
        quizMainScreen.classList.remove('hidden');
        showQuestion();
    }
    
    function showQuestion() {
        if (currentQuestionIndex >= questions.length) {
            endQuiz();
            return;
        }

        const question = questions[currentQuestionIndex];
        const isTF = question.hasOwnProperty('is_correct');
        const questionData = isTF ? { text: question.text, options: ['是', '否'], correct: [question.is_correct ? 0 : 1] } : question;

        currentQuestionNum.textContent = currentQuestionIndex + 1;
        questionText.textContent = questionData.text;
        optionsContainer.innerHTML = '';

        questionData.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn themed-card bg-white p-4 rounded-lg shadow-sm border text-left text-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all';
            button.textContent = option;
            button.dataset.index = index;
            button.addEventListener('click', handleOptionClick);
            optionsContainer.appendChild(button);
        });
    }

    function handleOptionClick(event) {
        const selectedIndex = parseInt(event.target.dataset.index, 10);
        const question = questions[currentQuestionIndex];
        const isTF = question.hasOwnProperty('is_correct');
        const correctIndex = isTF ? (question.is_correct ? 0 : 1) : question.correct[0];

        // Disable all buttons after selection
        document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
        
        if (selectedIndex === correctIndex) {
            score++;
            event.target.classList.add('correct');
        } else {
            event.target.classList.add('incorrect');
            // Highlight the correct answer
            const correctButton = optionsContainer.querySelector(`[data-index='${correctIndex}']`);
            if (correctButton) {
                correctButton.classList.add('correct');
            }
        }
        
        setTimeout(() => {
            currentQuestionIndex++;
            showQuestion();
        }, 1200); // Wait for 1.2 seconds before showing the next question
    }

    function endQuiz() {
        const correctAnswers = score;
        const incorrectAnswers = questions.length - score;
        const finalScoreValue = Math.round((correctAnswers / questions.length) * 100);

        finalScore.textContent = finalScoreValue;
        correctCount.textContent = correctAnswers;
        incorrectCount.textContent = incorrectAnswers;

        quizMainScreen.classList.add('hidden');
        quizEndScreen.classList.remove('hidden');
    }

    // --- Event Listeners ---
    startQuizBtn.addEventListener('click', startQuiz);
    restartQuizBtn.addEventListener('click', startQuiz);

    // --- Initial Load ---
    loadQuizFromURL();
});
