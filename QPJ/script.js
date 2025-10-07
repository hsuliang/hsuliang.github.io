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
// ... (此處程式碼與前一版相同，為節省篇幅予以省略) ...
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
const studentLevelSelect = document.getElementById('student-level-select');
const layoutToggleBtn = document.getElementById('layout-toggle-btn');
const themeRadios = document.querySelectorAll('input[name="theme"]');
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyBtn = document.getElementById('save-api-key-btn');
const clearApiKeyBtn = document.getElementById('clear-api-key-btn');
const autoGenerateToggle = document.getElementById('auto-generate-toggle');
const commonSettingsCard = document.getElementById('common-settings-card'); 
const collapseSettingsBtn = document.getElementById('collapse-settings-btn');
const publishQuizBtn = document.getElementById('publish-quiz-btn');
const shareQuizModal = document.getElementById('share-quiz-modal');
const shareQuizModalContent = document.getElementById('share-quiz-modal-content');
const quizShareLink = document.getElementById('quiz-share-link');
const copyQuizLinkBtn = document.getElementById('copy-quiz-link-btn');
const closeShareModalBtn = document.getElementById('close-share-modal-btn');
const settingsTabs = { buttons: [ document.getElementById('settings-tab-api'), document.getElementById('settings-tab-level'), document.getElementById('settings-tab-mode'), document.getElementById('settings-tab-theme'), document.getElementById('settings-tab-layout') ], contents: [ document.getElementById('settings-content-api'), document.getElementById('settings-content-level'), document.getElementById('settings-content-mode'), document.getElementById('settings-content-theme'), document.getElementById('settings-content-layout') ] };
const inputTabs = [document.getElementById('tab-text'), document.getElementById('tab-image'), document.getElementById('tab-ai')];
const inputContents = [document.getElementById('content-text'), document.getElementById('content-image'), document.getElementById('content-ai')];
const topicInput = document.getElementById('topic-input');
const generateContentBtn = document.getElementById('generate-content-btn');
const competencyBasedCheckbox = document.getElementById('competency-based-checkbox');
const generateFromImagesBtn = document.getElementById('generate-from-images-btn');
const previewLoader = document.getElementById('preview-loader');
const previewPlaceholder = document.getElementById('preview-placeholder');
const questionsContainer = document.getElementById('questions-container');
const previewActions = document.getElementById('preview-actions');
const regenerateBtn = document.getElementById('regenerate-btn');
const downloadBtn = document.getElementById('download-btn');
const imageDropZone = document.getElementById('image-drop-zone');
const languageChoiceModal = document.getElementById('language-choice-modal');
const languageChoiceModalContent = document.getElementById('language-choice-modal-content');
const langChoiceZhBtn = document.getElementById('lang-choice-zh-btn');
const langChoiceEnBtn = document.getElementById('lang-choice-en-btn');
const controls = [textInput, numQuestionsInput, questionTypeSelect, difficultySelect, questionStyleSelect, studentLevelSelect];

// --- 全域狀態 ---
// ... (此處程式碼與前一版相同，為節省篇幅予以省略) ...
let generatedQuestions = [];
let sortableInstance = null;
let uploadedImages = [];
let currentRequestController = null;
const questionLoadingMessages = [ "AI 老師正在絞盡腦汁出題中...", "靈感正在匯集中，題目即將問世...", "您的專屬考卷即將熱騰騰出爐！", "正在召喚出題小精靈為您服務...", "題目正在精心烹煮中，請稍候..." ];
const contentLoadingMessages = [ "AI 作家正在揮灑靈感，撰寫文章中...", "學習內文生成中，請稍待片刻...", "正在為您編織一篇精彩的故事...", "知識正在匯入，請稍候..." ];


// --- 核心功能函式 (省略大部分未變更的函式) ---
// ... (getApiKey, showToast, debounce, isAutoGenerateEnabled, etc. are unchanged) ...
// ... (大部分函式都與前一版相同，為節省篇幅予以省略) ...
// ... (此處省略了約 900 行未變更的程式碼) ...


// --- *** MODIFIED: Quiz Publishing Logic *** ---

/**
 * 發布測驗並顯示分享連結 Modal
 */
function publishQuiz() {
    if (!generatedQuestions || generatedQuestions.length === 0) {
        showToast('沒有題目可以發布！', 'error');
        return;
    }

    try {
        // 1. Stringify JSON
        const jsonString = JSON.stringify(generatedQuestions);
        
        // 2. Compress with pako - this returns a Uint8Array
        const compressed = pako.deflate(jsonString);

        // *** FIX STARTS HERE ***
        // 3. Convert Uint8Array to a binary string
        let binaryString = '';
        const len = compressed.byteLength;
        for (let i = 0; i < len; i++) {
            binaryString += String.fromCharCode(compressed[i]);
        }
        
        // 4. Base64 Encode the binary string
        const base64Encoded = btoa(binaryString);
        // *** FIX ENDS HERE ***

        // 5. Construct URL
        const currentUrl = window.location.href;
        const quizUrl = new URL('quiz.html', currentUrl);
        quizUrl.searchParams.set('data', base64Encoded);

        // 6. Show Modal
        if (quizShareLink) quizShareLink.value = quizUrl.href;
        showShareModal();

    } catch (error) {
        console.error("發布測驗時發生錯誤:", error);
        showToast('產生分享連結失敗，請檢查主控台。', 'error');
    }
}

function showShareModal() {
    if (shareQuizModal) shareQuizModal.classList.remove('hidden');
    if (shareQuizModalContent) setTimeout(() => { shareQuizModalContent.classList.add('open'); }, 10);
}
function hideShareModal() {
    if (shareQuizModalContent) shareQuizModalContent.classList.remove('open');
    if (shareQuizModal) setTimeout(() => { shareQuizModal.classList.add('hidden'); }, 200);
}


// --- 事件監聽器與初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    // ... (大部分監聽器與前一版相同，為節省篇幅予以省略) ...
    populateVersionHistory();
    applyLayoutPreference();
    applyThemePreference();
    updateVisitorCount(); 
    const savedApiKey = getApiKey();
    if (apiKeyInput && savedApiKey) { apiKeyInput.value = savedApiKey; }
    if (autoGenerateToggle) {
        autoGenerateToggle.checked = isAutoGenerateEnabled();
        if (autoGenerateToggle.checked) { controls.forEach(control => addSafeEventListener(control, control.type === 'number' || control.tagName === 'TEXTAREA' ? 'input' : 'change', debouncedGenerate)); }
    }
    updateRegenerateButtonState();
    addSafeEventListener(generateContentBtn, 'click', generateContentFromTopic, 'generateContentBtn');
    addSafeEventListener(copyContentBtn, 'click', copyContentToClipboard, 'copyContentBtn');
    addSafeEventListener(clearContentBtn, 'click', clearAllInputs, 'clearContentBtn');
    addSafeEventListener(downloadBtn, 'click', () => exportFile(generatedQuestions), 'downloadBtn');
    addSafeEventListener(regenerateBtn, 'click', triggerQuestionGeneration, 'regenerateBtn');
    addSafeEventListener(generateFromImagesBtn, 'click', triggerQuestionGeneration, 'generateFromImagesBtn');
    addSafeEventListener(fileInput, 'change', (event) => handleFile(event.target.files[0]), 'fileInput');
    addSafeEventListener(imageInput, 'change', (event) => handleImageFiles(event.target.files), 'imageInput');
    addSafeEventListener(textInput, 'input', updateRegenerateButtonState, 'textInput for button state');
    addSafeEventListener(formatSelect, 'change', () => {
        const newFormat = formatSelect.value;
        const needsExplanation = newFormat === 'loilonote' || newFormat === 'wayground';
        const hasQuestions = generatedQuestions.length > 0;
        const missingExplanation = hasQuestions && !generatedQuestions[0].hasOwnProperty('explanation');
        if (needsExplanation && missingExplanation) {
            showToast('偵測到格式需要題目說明，將為您自動更新...', 'success');
            triggerQuestionGeneration();
        }
    }, 'formatSelect');
    setupDragDrop(textInput, (file) => handleFile(file), false);
    setupDragDrop(imageDropZone, handleImageFiles, true);
    addSafeEventListener(saveApiKeyBtn, 'click', () => { if (apiKeyInput) { const key = apiKeyInput.value.trim(); if (key) { localStorage.setItem('gemini_api_key', key); showToast('API Key 已成功儲存！', 'success'); } else { showToast('API Key 不能為空！', 'error'); } } }, 'saveApiKeyBtn');
    addSafeEventListener(clearApiKeyBtn, 'click', () => { localStorage.removeItem('gemini_api_key'); if (apiKeyInput) apiKeyInput.value = ''; showToast('API Key 已清除。', 'success'); }, 'clearApiKeyBtn');
    addSafeEventListener(layoutToggleBtn, 'click', () => { if (!mainContainer) return; mainContainer.classList.toggle('lg:flex-row-reverse'); const placeholderP = previewPlaceholder ? previewPlaceholder.querySelector('p') : null; if (mainContainer.classList.contains('lg:flex-row-reverse')) { localStorage.setItem('quizGenLayout_v2', 'reversed'); if(placeholderP) placeholderP.textContent = '請在右側提供內容並設定選項'; } else { localStorage.setItem('quizGenLayout_v2', 'default'); if(placeholderP) placeholderP.textContent = '請在左側提供內容並設定選項'; } }, 'layoutToggleBtn');
    addSafeEventListener(autoGenerateToggle, 'change', (e) => {
        const isEnabled = e.target.checked;
        localStorage.setItem('quizGenAutoGenerate_v1', isEnabled);
        controls.forEach(control => {
            const eventType = control.type === 'number' || control.tagName === 'TEXTAREA' ? 'input' : 'change';
            if (isEnabled) { control.removeEventListener(eventType, debouncedGenerate); addSafeEventListener(control, eventType, debouncedGenerate); } else { control.removeEventListener(eventType, debouncedGenerate); }
        });
        updateRegenerateButtonState();
    }, 'autoGenerateToggle');
    if (themeRadios) { themeRadios.forEach(radio => { addSafeEventListener(radio, 'change', () => { if(radio.checked) { localStorage.setItem('quizGenTheme_v1', radio.id.replace('theme-', '')); } }); }); }
    if (settingsTabs.buttons.length > 0) { settingsTabs.buttons.forEach((clickedTab, index) => { addSafeEventListener(clickedTab, 'click', () => { if(!clickedTab) return; settingsTabs.buttons.forEach(tab => tab?.classList.remove('active')); settingsTabs.contents.forEach(content => content?.classList.remove('active')); clickedTab.classList.add('active'); if (settingsTabs.contents[index]) { settingsTabs.contents[index].classList.add('active'); } }, `settings-tab-${index}`); }); }
    if (inputTabs && inputContents) { inputTabs.forEach((clickedTab, index) => { addSafeEventListener(clickedTab, 'click', () => { if(!clickedTab) return; inputTabs.forEach(tab => { if(tab) { tab.classList.remove('active'); tab.setAttribute('aria-selected', 'false'); }}); inputContents.forEach(content => { if(content) content.classList.remove('active'); }); clickedTab.classList.add('active'); clickedTab.setAttribute('aria-selected', 'true'); if (inputContents[index]) { inputContents[index].classList.add('active'); } updateRegenerateButtonState(); }, `input-tab-${index}`); }); }
    addSafeEventListener(collapseSettingsBtn, 'click', () => { if(commonSettingsCard) { const isCollapsed = commonSettingsCard.classList.toggle('is-collapsed'); localStorage.setItem('settingsCollapsed_v1', isCollapsed); } }, 'collapseSettingsBtn');
    if (commonSettingsCard && localStorage.getItem('settingsCollapsed_v1') === 'true') { commonSettingsCard.classList.add('is-collapsed'); }
    addSafeEventListener(versionBtn, 'click', () => { if(versionModal) versionModal.classList.remove('hidden') }, 'versionBtn');
    addSafeEventListener(closeModalBtn, 'click', () => { if(versionModal) versionModal.classList.add('hidden') }, 'closeModalBtn');
    addSafeEventListener(versionModal, 'click', (event) => { if (event.target === versionModal && versionModal) versionModal.classList.add('hidden'); }, 'versionModal');
    addSafeEventListener(continueEditingBtn, 'click', hidePostDownloadModal, 'continueEditingBtn');
    addSafeEventListener(clearAndNewBtn, 'click', () => { hidePostDownloadModal(); clearAllInputs(); }, 'clearAndNewBtn');
    addSafeEventListener(publishQuizBtn, 'click', publishQuiz, 'publishQuizBtn');
    addSafeEventListener(closeShareModalBtn, 'click', hideShareModal, 'closeShareModalBtn');
    addSafeEventListener(shareQuizModal, 'click', (e) => { if (e.target === shareQuizModal) hideShareModal() }, 'shareQuizModal');
    addSafeEventListener(copyQuizLinkBtn, 'click', async () => { if(quizShareLink && quizShareLink.value) { try { await navigator.clipboard.writeText(quizShareLink.value); showToast('連結已成功複製！', 'success'); } catch (err) { showToast('複製失敗。', 'error'); } } }, 'copyQuizLinkBtn');
});
