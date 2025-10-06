// 確保 pdf.js 的 worker 路徑在任何操作前被設定
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;
}

// --- 組態常數 ---
const CONFIG = {
    API_URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=`,
    API_BATCH_SIZE: 8,
    DEBOUNCE_DELAY: 800,
    MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
    MAX_IMAGE_SIZE_BYTES: 4 * 1024 * 1024, // 4MB
    MAX_TOTAL_IMAGE_SIZE_BYTES: 15 * 1024 * 1024, // 15MB
};

// --- DOM 元素選取 ---
const mainContainer = document.getElementById('main-container');
const textInput = document.getElementById('text-input');
const fileInput = document.getElementById('file-input');
const fileNameDisplay = document.getElementById('file-name-display');
const fileErrorDisplay = document.getElementById('file-error-display');
const imageInput = document.getElementById('image-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imageErrorDisplay = document.getElementById('image-error-display');
const numQuestionsInput = document.getElementById('num-questions');
const formatSelect = document.getElementById('format-select');
const loadingText = document.getElementById('loading-text');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const versionBtn = document.getElementById('version-btn');
const versionModal = document.getElementById('version-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const versionHistoryContent = document.getElementById('version-history-content');
const postDownloadModal = document.getElementById('post-download-modal');
const postDownloadModalContent = document.getElementById('post-download-modal-content');
const continueEditingBtn = document.getElementById('continue-editing-btn');
const clearAndNewBtn = document.getElementById('clear-and-new-btn');
const questionTypeSelect = document.getElementById('question-type-select');
const difficultySelect = document.getElementById('difficulty-select');
const copyContentBtn = document.getElementById('copy-content-btn');
const clearContentBtn = document.getElementById('clear-content-btn');
const questionStyleSelect = document.getElementById('question-style-select');

// v7.0 新增: 設定與主題元素
const settingsBtn = document.getElementById('settings-btn');
const settingsPopover = document.getElementById('settings-popover');
const layoutToggleBtn = document.getElementById('layout-toggle-btn');
const themeRadios = document.querySelectorAll('input[name="theme"]');
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyBtn = document.getElementById('save-api-key-btn');
const clearApiKeyBtn = document.getElementById('clear-api-key-btn');

const tabText = document.getElementById('tab-text');
const tabImage = document.getElementById('tab-image');
const tabAi = document.getElementById('tab-ai');
const contentText = document.getElementById('content-text');
const contentImage = document.getElementById('content-image');
const contentAi = document.getElementById('content-ai');
const topicInput = document.getElementById('topic-input');
const generateContentBtn = document.getElementById('generate-content-btn');
const studentLevelSelect = document.getElementById('student-level-select');
const competencyBasedCheckbox = document.getElementById('competency-based-checkbox');
const generateFromImagesBtn = document.getElementById('generate-from-images-btn');

const previewLoader = document.getElementById('preview-loader');
const previewPlaceholder = document.getElementById('preview-placeholder');
const questionsContainer = document.getElementById('questions-container');
const previewActions = document.getElementById('preview-actions');
const regenerateBtn = document.getElementById('regenerate-btn');
const downloadBtn = document.getElementById('download-btn');
const imageDropZone = document.getElementById('image-drop-zone');

const tabs = [tabText, tabImage, tabAi];
const contents = [contentText, contentImage, contentAi];
const controls = [textInput, numQuestionsInput, questionTypeSelect, difficultySelect, questionStyleSelect];

// --- 全域狀態 ---
let generatedQuestions = [];
let sortableInstance = null;
let uploadedImages = [];
let currentRequestController = null;

const questionLoadingMessages = [ "AI 老師正在絞盡腦汁出題中...", "靈感正在匯集中，題目即將問世...", "您的專屬考卷即將熱騰騰出爐！", "正在召喚出題小精靈為您服務...", "題目正在精心烹煮中，請稍候..." ];
const contentLoadingMessages = [ "AI 作家正在揮灑靈感，撰寫文章中...", "學習內文生成中，請稍待片刻...", "正在為您編織一篇精彩的故事...", "知識正在匯入，請稍候..." ];

// --- 核心功能函式 ---

/**
 * 從 localStorage 獲取使用者儲存的 API Key
 * @returns {string|null} API Key 或 null
 */
function getApiKey() {
    return localStorage.getItem('gemini_api_key');
}

/**
 * 顯示提示訊息 (Toast)
 * @param {string} message - 要顯示的訊息
 * @param {'success'|'error'} type - 訊息類型
 */
function showToast(message, type = 'success') {
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.className = `fixed bottom-5 right-5 text-white py-2 px-5 rounded-lg shadow-xl opacity-0 transition-opacity duration-300 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
        toast.classList.remove('opacity-0');
        setTimeout(() => { toast.classList.add('opacity-0'); }, 4000);
    }
}

/**
 * 防抖函式：延遲函式執行，避免頻繁觸發
 * @param {Function} func - 要執行的函式
 * @param {number} delay - 延遲時間 (毫秒)
 * @returns {Function}
 */
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

/**
 * 根據主題生成學習內文
 */
async function generateContentFromTopic() {
    const apiKey = getApiKey();
    if (!apiKey) {
        return showToast('請先在右上角「設定」中輸入您的 Gemini API Key！', 'error');
    }

    if (!topicInput || !previewLoader) return;

    const topic = topicInput.value;
    if (!topic.trim()) return showToast('請輸入一個主題、單字或語詞！', 'error');
    
    previewLoader.classList.remove('hidden');
    if (loadingText) loadingText.textContent = contentLoadingMessages[Math.floor(Math.random() * contentLoadingMessages.length)];
    
    try {
        const studentLevel = studentLevelSelect.value;
        const isCompetencyBased = competencyBasedCheckbox.checked;
        const apiUrl = `${CONFIG.API_URL}${apiKey}`;
        const wordCountMap = { '1-2': 200, '3-4': 400, '5-6': 600, '7-9': 800, '9-12': 1000 };
        const wordCount = wordCountMap[studentLevel];
        const studentGradeText = studentLevelSelect.options[studentLevelSelect.selectedIndex].text;
        const userQuery = `主題：${topic}`;
        let systemPrompt;
        
        if (isCompetencyBased) {
            systemPrompt = `你是一位頂尖的 K-12 教材設計師與說故事專家，專長是將生硬的知識點轉化為引人入勝的生活情境或故事，以培養學生的素養能力。請根據使用者提供的核心主題：「${topic}」，為「${studentGradeText}」程度的學生，創作一篇長度約為 ${wordCount} 字的素養導向短文。\n- 這篇短文應該包含一個清晰的「情境」或「待解決的問題」。\n- 請將核心主題的相關知識，自然地融入故事情節或問題描述中，而不是條列式地說明。\n- 文章風格需生動有趣，能引發學生的閱讀興趣與思考。\n- 最終產出的內容必須是一篇完整的文章，可以直接用於出題。`;
        } else {
            const isWordList = topic.includes(',') || /^[a-zA-Z\s,]+$/.test(topic) && topic.split(/\s+|,/).filter(Boolean).length <= 10;
            systemPrompt = isWordList ? `你是一位為K12學生編寫教材的創意寫作專家。請使用使用者提供的單字或語詞，為「${studentGradeText}」的學生，撰寫一篇有趣且連貫、長度約為 ${wordCount} 字的故事或閱讀短文。請確保這些詞彙自然地融入文章中。` : `你是一位知識淵博的教材編寫專家。請根據使用者提供的主題，為「${studentGradeText}」的學生，生成一段約 ${wordCount} 字的簡潔科普短文。`;
        }

        const payload = { contents: [{ parts: [{ text: userQuery }] }], systemInstruction: { parts: [{ text: systemPrompt }] }, };
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        
        if (!response.ok) {
             const errorBody = await response.json().catch(() => ({ error: { message: '無法讀取錯誤內容' } }));
             throw new Error(`API 請求失敗: ${response.status} - ${errorBody.error.message}`);
        }
        
        const result = await response.json();
        const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (generatedText) {
            textInput.value = generatedText;
            showToast('學習內文已成功生成！', 'success');
            if (copyContentBtn) copyContentBtn.classList.remove('hidden');
            if (tabText) tabText.click();
            if (isCompetencyBased && questionStyleSelect) { questionStyleSelect.value = 'competency-based'; }
            // 觸發題目生成，但不要在這裡隱藏動畫
            triggerQuestionGeneration(); 
        } else { 
            throw new Error('AI未能生成內容，請檢查您的 API Key 或稍後再試。'); 
        }
    } catch (error) {
        console.error('生成內文時發生錯誤:', error);
        showToast(error.message, 'error');
        if (previewLoader) previewLoader.classList.add('hidden'); // 發生錯誤時隱藏
    } 
    // 注意：成功時，動畫會由 handleGenerateQuestions 控制
}

/**
 * 觸發題目生成的主要函式
 */
function triggerQuestionGeneration() {
    if (tabImage && tabImage.classList.contains('active') && uploadedImages.length === 0) {
         return showToast('請先上傳圖片！', 'error');
    }
    
    const text = textInput ? textInput.value : '';
    if (!text.trim() && uploadedImages.length === 0) return; 

    if (previewPlaceholder && !previewPlaceholder.classList.contains('hidden')) {
        previewPlaceholder.classList.add('hidden');
    }
    handleGenerateQuestions();
}

const debouncedGenerate = debounce(triggerQuestionGeneration, CONFIG.DEBOUNCE_DELAY);

/**
 * 處理題目生成的流程，包含分批呼叫 API
 */
async function handleGenerateQuestions() {
    const apiKey = getApiKey();
    if (!apiKey) {
        return showToast('請先在右上角「設定」中輸入您的 Gemini API Key！', 'error');
    }

    const text = textInput ? textInput.value : '';
    const totalQuestions = numQuestionsInput ? parseInt(numQuestionsInput.value, 10) : 0;
    const questionType = questionTypeSelect ? questionTypeSelect.value : 'multiple_choice';
    const difficulty = difficultySelect ? difficultySelect.value : '中等';
    const questionStyle = questionStyleSelect ? questionStyleSelect.value : 'knowledge-recall';

    if ((!text.trim() && uploadedImages.length === 0) || totalQuestions <= 0) {
        if (questionsContainer) questionsContainer.innerHTML = '';
        if (previewActions) previewActions.classList.add('hidden');
        if (previewPlaceholder) previewPlaceholder.classList.remove('hidden');
        return;
    }

    if (currentRequestController) {
        currentRequestController.abort();
    }
    currentRequestController = new AbortController();
    const signal = currentRequestController.signal;

    if (previewLoader) previewLoader.classList.remove('hidden');
    if (loadingText) loadingText.textContent = questionLoadingMessages[Math.floor(Math.random() * questionLoadingMessages.length)];
    if (questionsContainer) questionsContainer.innerHTML = '';
    if (previewActions) previewActions.classList.add('hidden');

    let allGeneratedQs = [];
    
    try {
        const BATCH_SIZE = CONFIG.API_BATCH_SIZE;
        const numBatches = Math.ceil(totalQuestions / BATCH_SIZE);
        for (let i = 0; i < numBatches; i++) {
            const questionsInBatch = Math.min(BATCH_SIZE, totalQuestions - allGeneratedQs.length);
            if (questionsInBatch <= 0) break;
            const batchResult = await generateSingleBatch(questionsInBatch, questionType, difficulty, text, uploadedImages, questionStyle, signal);
            allGeneratedQs = allGeneratedQs.concat(batchResult);
        }
        
        if (allGeneratedQs.length > 0) {
            generatedQuestions = allGeneratedQs;
            renderQuestionsForEditing(generatedQuestions);
            initializeSortable();
            if (previewActions) previewActions.classList.remove('hidden');
            if (previewPlaceholder) previewPlaceholder.classList.add('hidden');
        } else {
            throw new Error("AI 未能生成任何題目，請檢查您的輸入內容或稍後再試。");
        }
    } catch(error) {
         if (error.name === 'AbortError') {
             console.log('請求被新的操作取消。');
             return; 
         }
         console.error('生成題目時發生錯誤:', error);
         showToast(error.message, 'error');
         if (questionsContainer) questionsContainer.innerHTML = '';
         if (previewActions) previewActions.classList.add('hidden');
         if (previewPlaceholder) previewPlaceholder.classList.remove('hidden');
    } finally {
        if (previewLoader) previewLoader.classList.add('hidden');
    }
}

/**
 * 產生單一批次的題目
 */
async function generateSingleBatch(questionsInBatch, questionType, difficulty, text, images, questionStyle, signal) {
    const apiKey = getApiKey();
    const apiUrl = `${CONFIG.API_URL}${apiKey}`;
    const selectedFormat = formatSelect ? formatSelect.value : '';
    const needsExplanation = selectedFormat === 'loilonote' || selectedFormat === 'wayground';
    
    const baseIntro = "你是一位協助國中小老師出題的專家。請根據使用者提供的文本和圖片，";
    const baseFormatRequirement = "你必須嚴格遵守JSON格式。";
    let competencyPromptPart = `你的任務是生成「素養導向型」的題目，這代表你需要混合設計出能夠評量學生「情境理解」、「分析應用」與「批判思辨」這三種能力的題目。請避免只考記憶的題目。`;
    if (questionStyle === 'competency-based') {
         competencyPromptPart += ` 針對每一題，你還必須提供一個名為 'design_concept' 的欄位，用20-40字的繁體中文簡要說明該題的「設計理念」，解釋它旨在評量何種素養能力（例如：情境理解、分析應用、批判思辨）。`;
    }
    const buildPrompt = (coreTask) => questionStyle === 'competency-based' ? `${baseIntro} ${competencyPromptPart} ${coreTask} ${baseFormatRequirement}` : `${baseIntro} ${coreTask} ${baseFormatRequirement}`;
    
    let jsonSchema;
    const mcProperties = { text: { type: "STRING" }, options: { type: "ARRAY", items: { type: "STRING" } }, correct: { type: "ARRAY", items: { type: "INTEGER" } }, time: { type: "INTEGER", "default": 30 } };
    let mcRequired = ["text", "options", "correct"];
    if (needsExplanation) { mcProperties.explanation = { type: "STRING" }; mcRequired.push("explanation"); }
    if (questionStyle === 'competency-based') { mcProperties.design_concept = { type: "STRING" }; }
    
    let coreTask;
    switch(questionType) {
        case 'true_false':
            const tfProperties = { text: { type: "STRING" }, is_correct: { type: "BOOLEAN" } };
            let tfRequired = ["text", "is_correct"];
            if (needsExplanation) { tfProperties.explanation = { type: "STRING" }; tfRequired.push("explanation"); }
            if (questionStyle === 'competency-based') { tfProperties.design_concept = { type: "STRING" }; }
            coreTask = `生成${questionsInBatch}題${difficulty}難度的「是非題」。每個物件必須包含一個題目陳述(text)和一個布林值(is_correct)表示該陳述是否正確。`;
            if (needsExplanation) { coreTask = `生成${questionsInBatch}題${difficulty}難度的「是非題」。每個物件必須包含一個題目陳述(text)、一個布林值(is_correct)，以及一個針對答案的簡短說明(explanation)。`; }
            jsonSchema = { type: "ARRAY", items: { type: "OBJECT", properties: tfProperties, required: tfRequired }};
            break;
        case 'mixed':
             coreTask = `生成${questionsInBatch}題${difficulty}難度的「選擇題」與「是非題」混合題組。是非題請用 ["是", "否"] 作為選項，選擇題請提供4個選項。每題都必須有清楚標示的正確答案（索引值從0開始）。`;
             if(needsExplanation){ coreTask = `生成${questionsInBatch}題${difficulty}難度的「選擇題」與「是非題」混合題組。是非題請用 ["是", "否"] 作為選項，選擇題請提供4個選項。每題都必須有清楚標示的正確答案（索引值從0開始），並針對正確答案提供簡短的說明(explanation)。`; }
             jsonSchema = { type: "ARRAY", items: { type: "OBJECT", properties: mcProperties, required: mcRequired }};
            break;
        case 'multiple_choice':
        default:
            coreTask = `生成${questionsInBatch}題${difficulty}難度的「選擇題」。每題必須有4個選項，並清楚標示哪一個是正確答案（索引值從0開始）。`;
             if(needsExplanation){ coreTask = `生成${questionsInBatch}題${difficulty}難度的「選擇題」。每題必須有4個選項、清楚標示哪一個是正確答案（索引值從0開始），並針對正確答案提供簡短的說明(explanation)。`; }
             jsonSchema = { type: "ARRAY", items: { type: "OBJECT", properties: mcProperties, required: mcRequired }};
            break;
    }
    
    const systemPrompt = buildPrompt(coreTask);
    const parts = [{ text: "請根據以下提供的文字和圖片內容出題。" }];
    if(text.trim()){ parts.push({ text: `文字內容:\n${text}`}); }
    images.forEach(img => { parts.push({ inlineData: { mimeType: img.type, data: img.data } }); });
    const payload = { contents: [{ parts: parts }], systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { responseMimeType: "application/json", responseSchema: jsonSchema } };
    
    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: { message: '無法讀取錯誤內容' } }));
        throw new Error(`API 請求失敗: ${response.status} - ${errorBody.error.message}`);
    }
    const result = await response.json();
    const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!jsonText) throw new Error('API 回應格式錯誤，請嘗試減少題目數量或調整內容後再試。');
    
    let parsedJson;
    try { 
        parsedJson = JSON.parse(jsonText);
    } catch (e) { 
        console.error("解析 JSON 失敗:", jsonText); 
        throw new Error('API 回應了無效的 JSON 格式，請嘗試減少題目數量。'); 
    }

    const processedJson = parsedJson.map(q => {
        if (q.options && Array.isArray(q.options)) {
            while (q.options.length < 4) {
                q.options.push("");
            }
        }
        return q;
    });

    return processedJson;
}

/**
 * 將生成的題目渲染到預覽區以供編輯
 * @param {Array} questions - 題目陣列
 */
function renderQuestionsForEditing(questions) {
    if (!questionsContainer) return;
    questionsContainer.innerHTML = '';
    questions.forEach((q, index) => {
        const isTF = q.hasOwnProperty('is_correct');
        const questionData = isTF ? { text: q.text, options: ['是', '否'], correct: [q.is_correct ? 0 : 1], time: q.time || 30, explanation: q.explanation || '', design_concept: q.design_concept || '' } : q;
        const card = document.createElement('div');
        card.className = 'question-card bg-gray-50 p-4 rounded-lg shadow-sm border flex gap-x-3 transition-transform duration-300 hover:border-l-indigo-300 hover:-translate-y-0.5';
        card.dataset.index = index;

        let optionsHtml = (questionData.options || []).map((opt, optIndex) => `
            <div class="flex items-center">
                <label class="option-label w-full flex items-center">
                    <input type="radio" name="correct-option-${index}" class="option-radio" value="${optIndex}" ${(questionData.correct || []).includes(optIndex) ? 'checked' : ''}>
                    <input type="text" value="${String(opt).replace(/"/g, '&quot;')}" class="ml-2 flex-grow border border-gray-300 rounded-md p-2 w-full transition focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                </label>
            </div>
        `).join('');

        let aiInsightHtml = '';
        if (questionStyleSelect && questionStyleSelect.value === 'competency-based' && questionData.design_concept) {
            aiInsightHtml = `
                <div class="relative flex items-center group">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm-.707 10.607a1 1 0 011.414 0l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" /></svg>
                    <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-10 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-200">
                        <h5 class="font-bold mb-1 border-b border-gray-600 pb-1">AI 設計理念</h5>
                        <p class="text-xs">${questionData.design_concept}</p>
                    </div>
                </div>`;
        }

        card.innerHTML = `
            <div class="drag-handle text-gray-400 hover:text-indigo-600 p-2 flex items-center cursor-grab active:cursor-grabbing">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </div>
            <div class="flex-grow">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center space-x-2">
                         <p class="text-sm font-bold themed-accent-text">第 ${index + 1} 題</p>
                         ${aiInsightHtml}
                    </div>
                    <div class="flex items-center space-x-2">
                       <button class="copy-question-btn text-gray-400 hover:text-indigo-500 transition-colors" title="複製題目">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                       </button>
                       <button class="delete-question-btn text-gray-400 hover:text-red-500 transition-colors" title="刪除題目">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       </button>
                    </div>
                </div>
                <div class="space-y-3">
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1">題目：</label>
                        <textarea rows="2" class="question-text border border-gray-300 rounded-md p-2 w-full transition focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">${questionData.text}</textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1">選項 (點擊圓圈設為正解)：</label>
                        <div class="space-y-2 options-container">${optionsHtml}</div>
                    </div>
                </div>
            </div>`;
        questionsContainer.appendChild(card);
    });

    // 為動態生成的卡片加上事件監聽器
    questionsContainer.querySelectorAll('.question-card').forEach(card => {
        const index = parseInt(card.dataset.index, 10);
        card.querySelector('.question-text').addEventListener('input', e => { generatedQuestions[index].text = e.target.value; });
        card.querySelectorAll('.options-container input[type="text"]').forEach((optInput, optIndex) => { optInput.addEventListener('input', e => { generatedQuestions[index].options[optIndex] = e.target.value; }); });
        card.querySelectorAll('.options-container input[type="radio"]').forEach(radio => { radio.addEventListener('change', e => { if (e.target.checked) { generatedQuestions[index].correct = [parseInt(e.target.value, 10)]; } }); });
        card.querySelector('.delete-question-btn').addEventListener('click', () => { generatedQuestions.splice(index, 1); renderQuestionsForEditing(generatedQuestions); initializeSortable(); });
        card.querySelector('.copy-question-btn').addEventListener('click', () => { const questionToCopy = JSON.parse(JSON.stringify(generatedQuestions[index])); generatedQuestions.splice(index + 1, 0, questionToCopy); renderQuestionsForEditing(generatedQuestions); initializeSortable(); showToast('題目已成功複製！', 'success'); });
    });
}

/**
 * 初始化 SortableJS 拖曳功能
 */
function initializeSortable() {
    if (sortableInstance) sortableInstance.destroy();
    if (!questionsContainer) return;
    sortableInstance = new Sortable(questionsContainer, { 
        animation: 150, 
        handle: '.drag-handle', 
        ghostClass: 'sortable-ghost', 
        onEnd: function (evt) { 
            const [movedItem] = generatedQuestions.splice(evt.oldIndex, 1); 
            generatedQuestions.splice(evt.newIndex, 0, movedItem); 
            renderQuestionsForEditing(generatedQuestions);
            initializeSortable(); // 重新初始化以確保事件監聽器正確
        }, 
    });
}

/**
 * 處理檔案輸入 (txt/pdf)
 */
function handleFile(file) {
    if (fileErrorDisplay) fileErrorDisplay.textContent = ''; 
    if (fileNameDisplay) fileNameDisplay.textContent = ''; 
    if (fileInput) fileInput.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf' && file.type !== 'text/plain') { const errorMsg = '檔案格式不支援，請選擇 .txt 或 .pdf 檔案。'; showToast(errorMsg, 'error'); if(fileErrorDisplay) fileErrorDisplay.textContent = errorMsg; return; }
    if (file.size > CONFIG.MAX_FILE_SIZE_BYTES) { const errorMsg = `檔案過大，請選擇小於 ${CONFIG.MAX_FILE_SIZE_BYTES / 1024 / 1024}MB 的檔案。`; showToast(errorMsg, 'error'); if(fileErrorDisplay) fileErrorDisplay.textContent = errorMsg; return; }
    if (fileNameDisplay) fileNameDisplay.textContent = `已選擇檔案：${file.name}`;
    const reader = new FileReader();
    if (file.type === 'application/pdf') {
        reader.onload = async (e) => {
            try {
                const pdf = await pdfjsLib.getDocument(new Uint8Array(e.target.result)).promise;
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); const content = await page.getTextContent(); text += content.items.map(item => item.str).join(' '); }
                if(textInput) textInput.value = text; 
                showToast('PDF 檔案內容已成功讀取！', 'success'); 
                if(tabText) tabText.click(); 
                debouncedGenerate();
            } catch (error) { const errorMsg = "無法讀取此PDF檔案，檔案可能已損毀。"; showToast(errorMsg, "error"); if(fileErrorDisplay) fileErrorDisplay.textContent = errorMsg; if(fileNameDisplay) fileNameDisplay.textContent = ''; }
        };
        reader.readAsArrayBuffer(file);
    } else {
        reader.onload = (e) => { if(textInput) textInput.value = e.target.result; showToast('文字檔案內容已成功讀取！', 'success'); if(tabText) tabText.click(); debouncedGenerate(); };
        reader.readAsText(file);
    }
}

/**
 * 處理圖片檔案上傳
 */
function handleImageFiles(newFiles) {
    if (!newFiles || newFiles.length === 0) return;
    if(imageErrorDisplay) imageErrorDisplay.innerHTML = ''; 
    const { MAX_IMAGE_SIZE_BYTES, MAX_TOTAL_IMAGE_SIZE_BYTES } = CONFIG;
    let currentTotalSize = uploadedImages.reduce((sum, img) => sum + img.size, 0);
    let errorMessages = [], sizeLimitReached = false;
    const validFiles = Array.from(newFiles).filter(file => {
        if (!file.type.startsWith('image/')) { errorMessages.push(`檔案 "${file.name}" 不是有效的圖片格式。`); return false; }
        if (file.size > MAX_IMAGE_SIZE_BYTES) { errorMessages.push(`圖片 "${file.name}" 過大 (上限 ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB)。`); return false; }
        if (currentTotalSize + file.size > MAX_TOTAL_IMAGE_SIZE_BYTES) { if (!sizeLimitReached) { errorMessages.push(`圖片總大小超過 ${MAX_TOTAL_IMAGE_SIZE_BYTES / 1024 / 1024}MB 上限，後續圖片未被載入。`); sizeLimitReached = true; } return false; }
        currentTotalSize += file.size; return true;
    });
    if (errorMessages.length > 0) { if(imageErrorDisplay) imageErrorDisplay.innerHTML = errorMessages.join('<br>'); showToast('部分檔案上傳失敗，請查看提示訊息。', 'error'); }
    if (validFiles.length === 0) { if(imageInput) imageInput.value = ''; return; }

    const fragment = document.createDocumentFragment();
    let filesToProcess = validFiles.length;
    validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const fullBase64 = e.target.result, base64Data = fullBase64.split(',')[1];
            const imageObject = { id: Date.now() + Math.random(), type: file.type, data: base64Data, size: file.size };
            uploadedImages.push(imageObject);
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'relative';
            const imgElement = document.createElement('img');
            imgElement.src = fullBase64; imgElement.alt = `使用者上傳的圖片預覽 ${uploadedImages.length}`; imgElement.className = 'w-full h-32 object-cover rounded-lg shadow-md';
            const removeBtn = document.createElement('div');
            removeBtn.className = 'absolute -top-2 -right-2 bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer font-bold leading-none transition-colors hover:bg-red-500/90';
            removeBtn.innerHTML = '&times;';
            removeBtn.onclick = () => { 
                uploadedImages = uploadedImages.filter(img => img.id !== imageObject.id); 
                previewWrapper.remove(); 
                if (uploadedImages.length === 0 && generateFromImagesBtn) {
                    generateFromImagesBtn.classList.add('hidden');
                }
            };
            previewWrapper.appendChild(imgElement); previewWrapper.appendChild(removeBtn);
            fragment.appendChild(previewWrapper);
            if (--filesToProcess === 0) { 
                if (imagePreviewContainer) imagePreviewContainer.appendChild(fragment); 
                if (generateFromImagesBtn) generateFromImagesBtn.classList.remove('hidden');
            }
        };
        reader.readAsDataURL(file);
    });
    if(imageInput) imageInput.value = '';
}

/**
 * 設定拖曳上傳區域
 */
function setupDragDrop(dropZone, fileHandler, isMultiple) {
    if (!dropZone) return;
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => dropZone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false));
    ['dragenter', 'dragover'].forEach(eventName => dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false));
    ['dragleave', 'drop'].forEach(eventName => dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false));
    dropZone.addEventListener('drop', (e) => { if (isMultiple) fileHandler(e.dataTransfer.files); else fileHandler(e.dataTransfer.files[0]); }, false);
}

/**
 * 匯出題庫檔案
 */
function exportFile(questions) {
    const format = formatSelect ? formatSelect.value : '';
    if (!format) return showToast('請選擇匯出檔案格式！', 'error');
    if (!questions || questions.length === 0) return showToast('沒有可匯出的題目！', 'error');
    
    let data, filename, success = false;
    try {
        const standardMCQs = questions.map(q => q.hasOwnProperty('is_correct') ? { text: q.text, options: ['是', '否'], correct: [q.is_correct ? 0 : 1], time: 30, explanation: q.explanation || '' } : q);
        switch (format) {
            case 'wordwall':
                data = standardMCQs.map(q => ({ '問題': q.text, '選項1': q.options[0] || '', '選項2': q.options[1] || '', '選項3': q.options[2] || '', '選項4': q.options[3] || '', '正確選項': q.correct.length > 0 ? (q.correct[0] + 1) : '' }));
                filename = 'Wordwall_Quiz.xlsx'; break;
            case 'kahoot':
                const kahootData = [ ['Kahoot Quiz Template'], ['Add questions, answers, and time limits. Have fun!'], [], [], ['Question', 'Answer 1', 'Answer 2', 'Answer 3', 'Answer 4', 'Time limit (sec)', 'Correct answer(s)'] ];
                standardMCQs.forEach(q => { kahootData.push([ q.text, q.options[0] || '', q.options[1] || '', q.options[2] || '', q.options[3] || '', q.time || 30, q.correct.map(i => i + 1).join(',') ]); });
                const ws = XLSX.utils.aoa_to_sheet(kahootData); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
                XLSX.writeFile(wb, 'Kahoot_Quiz.xlsx');
                success = true;
                break;
            case 'wayground':
                data = standardMCQs.map(q => ({ 'Question Text': q.text, 'Question Type': q.correct.length > 1 ? 'Checkbox' : 'Multiple Choice', 'Option 1': q.options[0] || '', 'Option 2': q.options[1] || '', 'Option 3': q.options[2] || '', 'Option 4': q.options[3] || '', 'Option 5': '', 'Correct Answer': q.correct.map(i => i + 1).join(','), 'Time in seconds': q.time || 30, 'Image Link': '', 'Answer explanation': q.explanation || '' }));
                filename = 'Wayground_Quiz.xlsx'; break;
            case 'loilonote':
                data = standardMCQs.map(q => ({ '問題（請勿編輯標題）': q.text, '務必作答（若此問題需要回答，請輸入1）': 1, '每題得分（未填入的部分將被自動設為1）': 1, '正確答案的選項（若有複數正確答案選項，請用「、」或「 , 」來分隔選項編號）': q.correct.map(i => i + 1).join(','), '說明': q.explanation || '', '選項1': q.options[0] || '', '選項2': q.options[1] || '', '選項3': q.options[2] || '', '選項4': q.options[3] || '' }));
                filename = 'LoiLoNote_Quiz.xlsx'; break;
            default: throw new Error('未知的格式');
        }

        if(data) {
            const worksheet = XLSX.utils.json_to_sheet(data); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
            XLSX.writeFile(workbook, filename);
            success = true;
        }
        
        if (success) {
            showPostDownloadModal();
        }

    } catch (error) { 
        console.error('匯出失敗:', error); 
        showToast('匯出失敗，請檢查主控台錯誤。', 'error'); 
    }
}

// --- UI 互動與輔助函式 ---

function showPostDownloadModal() {
    if (postDownloadModal) postDownloadModal.classList.remove('hidden');
    if (postDownloadModalContent) setTimeout(() => { postDownloadModalContent.classList.remove('scale-95', 'opacity-0'); }, 10);
}
function hidePostDownloadModal() {
    if (postDownloadModalContent) postDownloadModalContent.classList.add('scale-95', 'opacity-0');
    if (postDownloadModal) setTimeout(() => { postDownloadModal.classList.add('hidden'); }, 200);
}

async function copyContentToClipboard() {
    const textToCopy = textInput ? textInput.value : '';
    if (!textToCopy.trim()) { showToast('沒有內容可以複製！', 'error'); return; }
    try { await navigator.clipboard.writeText(textToCopy); showToast('文章內容已成功複製！', 'success'); } catch (err) { console.error('複製失敗:', err); showToast('無法複製內容，您的瀏覽器可能不支援此功能或未授予權限。', 'error'); }
}

function clearAllInputs() {
    if(textInput) textInput.value = ''; 
    if(fileInput) fileInput.value = ''; 
    if(fileNameDisplay) fileNameDisplay.textContent = ''; 
    if(fileErrorDisplay) fileErrorDisplay.textContent = '';
    if(imageInput) imageInput.value = ''; 
    if(imagePreviewContainer) imagePreviewContainer.innerHTML = ''; 
    if(imageErrorDisplay) imageErrorDisplay.innerHTML = ''; 
    uploadedImages = [];
    if(copyContentBtn) copyContentBtn.classList.add('hidden'); 
    if(topicInput) topicInput.value = ''; 
    if(questionStyleSelect) questionStyleSelect.value = 'knowledge-recall';
    generatedQuestions = [];
    if(questionsContainer) questionsContainer.innerHTML = '';
    if(previewActions) previewActions.classList.add('hidden');
    if(previewPlaceholder) previewPlaceholder.classList.remove('hidden');
    if(generateFromImagesBtn) generateFromImagesBtn.classList.add('hidden');
    showToast('內容已全部清除！', 'success');
}

function applyLayoutPreference() {
    const preferredLayout = localStorage.getItem('quizGenLayout_v2');
    if (!mainContainer) return;

    const placeholderP = previewPlaceholder ? previewPlaceholder.querySelector('p') : null;

    if (preferredLayout === 'reversed') {
        mainContainer.classList.add('lg:flex-row-reverse');
        if (placeholderP) placeholderP.textContent = '請在右側提供內容並設定選項';
    } else {
        mainContainer.classList.remove('lg:flex-row-reverse');
        if (placeholderP) placeholderP.textContent = '請在左側提供內容並設定選項';
    }
}

function applyThemePreference() {
    const savedTheme = localStorage.getItem('quizGenTheme_v1') || 'lavender';
    const radioToCheck = document.getElementById(`theme-${savedTheme}`);
    if (radioToCheck) {
        radioToCheck.checked = true;
    }
}

function addRealtimeListeners() {
    if(!controls) return;
    controls.forEach(control => {
        if(control) {
            const eventType = control.tagName === 'TEXTAREA' || control.type === 'number' ? 'input' : 'change';
            control.addEventListener(eventType, debouncedGenerate);
        }
    });
}
function removeRealtimeListeners() {
    if(!controls) return;
    controls.forEach(control => {
        if(control){
            const eventType = control.tagName === 'TEXTAREA' || control.type === 'number' ? 'input' : 'change';
            control.removeEventListener(eventType, debouncedGenerate);
        }
    });
}

function populateVersionHistory() {
    if (!versionHistoryContent) return;
    const versionHistory = [
        {
            version: "v7.0 可部署版",
            current: true,
            notes: [
                "【✨ 視覺優化】",
                " - 將圓形載入動畫替換為文字閃爍提示，提升穩定性。",
                "【🎨 主題擴充】",
                " - 新增「焦糖布丁」與「勃根地紅」兩款主題。",
                "【✨ UI優化與修正】",
                " - 修正：修復大部分按鈕與連結無法點擊的問題。",
                " - 優化：為「輸入內容」和「上傳圖片」頁籤加上圖示。",
                "【🚀 架構重構與部署】",
                " - 新增：使用者可自行輸入並儲存 Gemini API Key。",
                " - 重構：程式碼拆分為 HTML, CSS, JS 三個獨立檔案。",
                " - 優化：程式已可部署至 GitHub Pages 等平台。"
            ]
        },
        { 
            version: "v6.1版", 
            notes: [
                "【🎨 個性化升級】",
                " - 新增「設定」面板，整合版面與主題功能。",
                " - 導入五款「鮮豔可愛」系列主題，可隨心切換介面色彩。",
                " - 為主要區塊標題新增圖示，提升視覺識別度。",
                " - 系統會自動記憶您選擇的主題與版面配置。"
            ] 
        },
    ];
    let html = '';
    versionHistory.forEach(v => {
        html += `<div><h4 class="font-bold text-lg">${v.version} ${v.current ? '<span class="text-sm font-normal themed-accent-text">(目前版本)</span>' : ''}</h4><ul class="list-disc list-inside text-gray-600">${v.notes.map(note => `<li>${note}</li>`).join('')}</ul></div>`;
    });
    versionHistoryContent.innerHTML = html;
}

/**
 * 安全地為一個元素新增事件監聽器，如果元素不存在則在主控台印出錯誤
 * @param {Element} element - DOM 元素
 * @param {string} event - 事件名稱
 * @param {Function} handler - 事件處理函式
 * @param {string} elementName - (可選) 元素的名稱，用於錯誤訊息
 */
function addSafeEventListener(element, event, handler, elementName) {
    if (element) {
        element.addEventListener(event, handler);
    } else {
        console.error(`無法綁定事件：找不到元素 "${elementName || 'unknown'}"`);
    }
}

// --- 事件監聽器與初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    // 初始設定函式（加上安全檢查）
    populateVersionHistory();
    applyLayoutPreference();
    applyThemePreference();
    addRealtimeListeners();

    // 載入已儲存的 API Key
    const savedApiKey = getApiKey();
    if (apiKeyInput && savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }

    // --- 使用安全的方式綁定所有事件監聽器 ---
    addSafeEventListener(generateContentBtn, 'click', generateContentFromTopic, 'generateContentBtn');
    addSafeEventListener(copyContentBtn, 'click', copyContentToClipboard, 'copyContentBtn');
    addSafeEventListener(clearContentBtn, 'click', clearAllInputs, 'clearContentBtn');
    addSafeEventListener(downloadBtn, 'click', () => exportFile(generatedQuestions), 'downloadBtn');
    addSafeEventListener(regenerateBtn, 'click', triggerQuestionGeneration, 'regenerateBtn');
    addSafeEventListener(generateFromImagesBtn, 'click', triggerQuestionGeneration, 'generateFromImagesBtn');
    
    addSafeEventListener(fileInput, 'change', (event) => handleFile(event.target.files[0]), 'fileInput');
    addSafeEventListener(imageInput, 'change', (event) => handleImageFiles(event.target.files), 'imageInput');
    
    setupDragDrop(textInput, (file) => handleFile(file), false);
    setupDragDrop(imageDropZone, handleImageFiles, true);
    
    addSafeEventListener(settingsBtn, 'click', (e) => {
        e.stopPropagation();
        if (settingsPopover) settingsPopover.classList.toggle('open');
    }, 'settingsBtn');
    
    document.addEventListener('click', (e) => {
        if (settingsPopover && !settingsPopover.contains(e.target) && settingsBtn && !settingsBtn.contains(e.target)) {
            settingsPopover.classList.remove('open');
        }
    });
    
    addSafeEventListener(saveApiKeyBtn, 'click', () => {
        if (apiKeyInput) {
            const key = apiKeyInput.value.trim();
            if (key) {
                localStorage.setItem('gemini_api_key', key);
                showToast('API Key 已成功儲存！', 'success');
            } else {
                showToast('API Key 不能為空！', 'error');
            }
        }
    }, 'saveApiKeyBtn');

    addSafeEventListener(clearApiKeyBtn, 'click', () => {
        localStorage.removeItem('gemini_api_key');
        if (apiKeyInput) apiKeyInput.value = '';
        showToast('API Key 已清除。', 'success');
    }, 'clearApiKeyBtn');

    addSafeEventListener(layoutToggleBtn, 'click', () => {
        if (!mainContainer) return;
        mainContainer.classList.toggle('lg:flex-row-reverse');
        const placeholderP = previewPlaceholder ? previewPlaceholder.querySelector('p') : null;
        if (mainContainer.classList.contains('lg:flex-row-reverse')) {
            localStorage.setItem('quizGenLayout_v2', 'reversed');
             if(placeholderP) placeholderP.textContent = '請在右側提供內容並設定選項';
        } else {
            localStorage.setItem('quizGenLayout_v2', 'default');
             if(placeholderP) placeholderP.textContent = '請在左側提供內容並設定選項';
        }
    }, 'layoutToggleBtn');
    
    if (themeRadios) {
        themeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if(radio.checked) {
                    localStorage.setItem('quizGenTheme_v1', radio.id.replace('theme-', ''));
                }
            });
        });
    }

    if (tabs && contents) {
        tabs.forEach((clickedTab, index) => {
            addSafeEventListener(clickedTab, 'click', () => {
                if(!clickedTab) return;
                tabs.forEach(tab => { if(tab) tab.classList.remove('active'); if(tab) tab.setAttribute('aria-selected', 'false'); });
                contents.forEach(content => { if(content) content.classList.remove('active'); });
                
                clickedTab.classList.add('active');
                clickedTab.setAttribute('aria-selected', 'true');
                if (contents[index]) {
                    contents[index].classList.add('active');
                }

                if (clickedTab === tabImage) {
                    removeRealtimeListeners();
                    if (uploadedImages.length > 0 && generateFromImagesBtn) {
                        generateFromImagesBtn.classList.remove('hidden');
                    }
                } else {
                    addRealtimeListeners();
                    if(generateFromImagesBtn) generateFromImagesBtn.classList.add('hidden');
                }
            }, `tab-${index}`);
        });
    }
    
    addSafeEventListener(versionBtn, 'click', () => { if(versionModal) versionModal.classList.remove('hidden') }, 'versionBtn');
    addSafeEventListener(closeModalBtn, 'click', () => { if(versionModal) versionModal.classList.add('hidden') }, 'closeModalBtn');
    addSafeEventListener(versionModal, 'click', (event) => { if (event.target === versionModal && versionModal) versionModal.classList.add('hidden'); }, 'versionModal');
    
    addSafeEventListener(continueEditingBtn, 'click', hidePostDownloadModal, 'continueEditingBtn');
    addSafeEventListener(clearAndNewBtn, 'click', () => {
        hidePostDownloadModal();
        clearAllInputs();
    }, 'clearAndNewBtn');
});

