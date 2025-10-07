// DOM Elements
const mainTitle = document.getElementById('main-title');
const settingsSection = document.getElementById('settings-section');
const lotterySection = document.getElementById('lottery-section');
const sheetUrlInput = document.getElementById('sheet-url');
const sheetNameInput = document.getElementById('sheet-name');
const columnLetterInput = document.getElementById('column-letter');
const csvUrlInput = document.getElementById('csv-url-input');
const csvColumnLetterInput = document.getElementById('csv-column-letter');
const customListInput = document.getElementById('custom-list');
const prizesContainer = document.getElementById('prizes-container');
const addPrizeBtn = document.getElementById('add-prize-btn');
const clearPrizesBtn = document.getElementById('clear-prizes-btn');
const templateNameInput = document.getElementById('template-name-input');
const saveTemplateBtn = document.getElementById('save-template-btn');
const templateButtonsContainer = document.getElementById('template-buttons-container');
const themeSelector = document.getElementById('theme-selector');
const loadButton = document.getElementById('load-button');
const drawButton = document.getElementById('draw-button');
const exportCsvBtn = document.getElementById('export-csv-btn');
const statusMessage = document.getElementById('status-message');
const participantLabel = document.getElementById('participant-label');
const participantCountSpan = document.getElementById('participant-count');
const currentPrizeDisplay = document.getElementById('current-prize-display');
const winnerDisplay = document.getElementById('winner-display');
const winnersListContainer = document.getElementById('winners-list-container');
const mainDrawPanel = document.getElementById('main-draw-panel');
const winnersList = document.getElementById('winners-list');
const soundToggleBtn = document.getElementById('sound-toggle-btn');
const resetBtn = document.getElementById('reset-btn');
const tabCloudBtn = document.getElementById('tab-cloud');
const tabCustomBtn = document.getElementById('tab-custom');
const tabCsvBtn = document.getElementById('tab-csv');
const tabContentCloud = document.getElementById('tab-content-cloud');
const tabContentCustom = document.getElementById('tab-content-custom');
const tabContentCsv = document.getElementById('tab-content-csv');

// Title Tab Elements
const titleInput = document.getElementById('title-input');
const titleTemplateNameInput = document.getElementById('title-template-name-input');
const saveTitleTemplateBtn = document.getElementById('save-title-template-btn');
const titleTemplateButtonsContainer = document.getElementById('title-template-buttons-container');

// List Tab Elements
const listTemplateNameInput = document.getElementById('list-template-name-input');
const saveListTemplateBtn = document.getElementById('save-list-template-btn');
const listTemplateButtonsContainer = document.getElementById('list-template-buttons-container');

// Environment Tabs
const tabModeBtn = document.getElementById('tab-mode');
const tabTitleBtn = document.getElementById('tab-title');
const tabPrizeBtn = document.getElementById('tab-prize');
const tabThemeBtn = document.getElementById('tab-theme');
const tabSoundBtn = document.getElementById('tab-sound');
const tabEffectBtn = document.getElementById('tab-effect');
const tabContentMode = document.getElementById('tab-content-mode');
const tabContentTitle = document.getElementById('tab-content-title');
const tabContentPrize = document.getElementById('tab-content-prize');
const tabContentTheme = document.getElementById('tab-content-theme');
const tabContentSound = document.getElementById('tab-content-sound');
const tabContentEffect = document.getElementById('tab-content-effect');

const rollingSound = document.getElementById('rolling-sound');
const winnerSound = document.getElementById('winner-sound');
const winnerEffectSelect = document.getElementById('winner-effect-select');
const simpleDrawToggle = document.getElementById('simple-draw-toggle');

// State
let participants = [];
let prizes = [];
let currentPrizeIndex = 0;
let rollingInterval = null;
let activeDataSource = 'custom';
let isSoundOn = true;
const themes = [ { id: 'candy', name: '糖果王國', colors: ['#ff69b4', '#87ceeb'] }, { id: 'forest', name: '森林夥伴', colors: ['#228b22', '#ff7f50'] }, { id: 'izakaya', name: '居酒屋', colors: ['#e53e3e', '#ffab00'] }, { id: 'sakura', name: '櫻花', colors: ['#db2777', '#fdf2f8'] }, { id: 'midnight', name: '午夜', colors: ['#38bdf8', '#0f172a'] } ];
const buttonPhrases = [ '獎落誰家？就是你家！', '帶回就是福氣', '抽中就是緣分', '好運滾滾來', '表單一定要填' ];

const init = () => {
    // Main Actions
    loadButton.addEventListener('click', handleLoadData);
    drawButton.addEventListener('click', handleDrawWinner);
    resetBtn.addEventListener('click', resetApp);
    
    // Modals & Links
    exportCsvBtn.addEventListener('click', exportResultsToCsv);

    // List Setup Tabs
    tabCustomBtn.addEventListener('click', () => switchTab('custom'));
    tabCloudBtn.addEventListener('click', () => switchTab('cloud'));
    tabCsvBtn.addEventListener('click', () => switchTab('csv'));
    saveListTemplateBtn.addEventListener('click', saveListTemplate);
    
    // Environment Tabs
    tabModeBtn.addEventListener('click', () => switchEnvTab('mode'));
    tabTitleBtn.addEventListener('click', () => switchEnvTab('title'));
    tabPrizeBtn.addEventListener('click', () => switchEnvTab('prize'));
    tabThemeBtn.addEventListener('click', () => switchEnvTab('theme'));
    tabSoundBtn.addEventListener('click', () => switchEnvTab('sound'));
    tabEffectBtn.addEventListener('click', () => switchEnvTab('effect'));

    // Title Setup
    titleInput.addEventListener('input', (e) => {
        const newTitle = e.target.value.trim();
        mainTitle.textContent = newTitle || 'ㄚ亮笑長的抽抽樂';
        document.title = newTitle || 'ㄚ亮笑長的抽抽樂';
    });
    saveTitleTemplateBtn.addEventListener('click', saveTitleTemplate);

    // Prize Setup
    addPrizeBtn.addEventListener('click', () => addPrizeRow());
    saveTemplateBtn.addEventListener('click', savePrizeTemplate);
    clearPrizesBtn.addEventListener('click', clearPrizes);

    // Other settings
    soundToggleBtn.addEventListener('click', toggleSound);
    simpleDrawToggle.addEventListener('change', handleSimpleDrawToggle);

    // Initial Load
    addPrizeRow('三獎', 3);
    addPrizeRow('二獎', 2);
    addPrizeRow('頭獎', 1);

    setupThemes();
    loadTheme();
    renderSavedTemplates();
    renderSavedTitleTemplates();
    renderSavedListTemplates();
    switchTab(activeDataSource);
    switchEnvTab('mode');
    handleUrlParams();

    const savedMode = localStorage.getItem('simpleDrawMode') === 'true';
    simpleDrawToggle.checked = savedMode;
    if (savedMode) {
        tabPrizeBtn.classList.add('hidden');
    }

    window.addEventListener('resize', () => { if (document.getElementById('finished-prize-name')) { adjustPrizeNameFontSize(); } });
};

// --- LIST TEMPLATE FUNCTIONS ---
const getListTemplates = () => JSON.parse(localStorage.getItem('listTemplates') || '{}');
const saveListTemplates = (templates) => localStorage.setItem('listTemplates', JSON.stringify(templates));
const saveListTemplate = () => { const name = listTemplateNameInput.value.trim(); const listContent = customListInput.value.trim(); if (!name || !listContent) { alert('範本名稱和名單內容都不能為空！'); return; } const templates = getListTemplates(); templates[name] = listContent; saveListTemplates(templates); listTemplateNameInput.value = ''; renderSavedListTemplates(); };
const loadListTemplate = (name) => { const templates = getListTemplates(); const listContent = templates[name]; if (listContent) { customListInput.value = listContent; } };
const deleteListTemplate = (name) => { const templates = getListTemplates(); delete templates[name]; saveListTemplates(templates); renderSavedListTemplates(); };
const renderSavedListTemplates = () => { const templates = getListTemplates(); listTemplateButtonsContainer.innerHTML = ''; for (const name in templates) { const container = document.createElement('div'); container.className = 'custom-template flex items-center rounded-lg'; container.style.backgroundColor = 'var(--secondary-color)'; const button = document.createElement('button'); button.textContent = name; button.className = 'px-4 py-2 text-sm'; button.addEventListener('click', () => loadListTemplate(name)); const deleteBtn = document.createElement('button'); deleteBtn.textContent = '✕'; deleteBtn.className = 'px-2 py-2 text-sm'; deleteBtn.style.color = 'var(--danger-color)'; deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteListTemplate(name); }); container.appendChild(button); container.appendChild(deleteBtn); listTemplateButtonsContainer.appendChild(container); } };

// --- TITLE TEMPLATE FUNCTIONS ---
const getTitleTemplates = () => JSON.parse(localStorage.getItem('titleTemplates') || '{}');
const saveTitleTemplates = (templates) => localStorage.setItem('titleTemplates', JSON.stringify(templates));
const saveTitleTemplate = () => { const name = titleTemplateNameInput.value.trim(); const title = titleInput.value.trim(); if (!name || !title) { alert('範本名稱和活動標題都不能為空！'); return; } const templates = getTitleTemplates(); templates[name] = title; saveTitleTemplates(templates); titleTemplateNameInput.value = ''; renderSavedTitleTemplates(); };
const loadTitleTemplate = (name) => { const templates = getTitleTemplates(); const title = templates[name]; if (title) { titleInput.value = title; titleInput.dispatchEvent(new Event('input')); } };
const deleteTitleTemplate = (name) => { const templates = getTitleTemplates(); delete templates[name]; saveTitleTemplates(templates); renderSavedTitleTemplates(); };
const renderSavedTitleTemplates = () => { const templates = getTitleTemplates(); titleTemplateButtonsContainer.innerHTML = ''; for (const name in templates) { const container = document.createElement('div'); container.className = 'custom-template flex items-center rounded-lg'; container.style.backgroundColor = 'var(--secondary-color)'; const button = document.createElement('button'); button.textContent = name; button.className = 'px-4 py-2 text-sm'; button.addEventListener('click', () => loadTitleTemplate(name)); const deleteBtn = document.createElement('button'); deleteBtn.textContent = '✕'; deleteBtn.className = 'px-2 py-2 text-sm'; deleteBtn.style.color = 'var(--danger-color)'; deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteTitleTemplate(name); }); container.appendChild(button); container.appendChild(deleteBtn); titleTemplateButtonsContainer.appendChild(container); } };

// --- PRIZE TEMPLATE FUNCTIONS ---
const getPrizeTemplates = () => JSON.parse(localStorage.getItem('prizeTemplates') || '{}');
const savePrizeTemplates = (templates) => localStorage.setItem('prizeTemplates', JSON.stringify(templates));
const savePrizeTemplate = () => { const name = templateNameInput.value.trim(); if (!name) { alert('請為您的獎項範本命名！'); return; } const prizeRows = prizesContainer.querySelectorAll('.prize-row'); const currentPrizes = Array.from(prizeRows).map(row => ({ name: row.querySelector('.prize-name').value, quantity: row.querySelector('.prize-quantity').value })); if (currentPrizes.length === 0) { alert('沒有可儲存的獎項！'); return; } const templates = getPrizeTemplates(); templates[name] = currentPrizes; savePrizeTemplates(templates); templateNameInput.value = ''; renderSavedTemplates(); };
const loadPrizeTemplate = (name) => { const templates = getPrizeTemplates(); const template = templates[name]; if (template) { clearPrizes(); template.forEach(prize => addPrizeRow(prize.name, prize.quantity)); } };
const deletePrizeTemplate = (name) => { const templates = getPrizeTemplates(); delete templates[name]; savePrizeTemplates(templates); renderSavedTemplates(); };
const renderSavedTemplates = () => { const templates = getPrizeTemplates(); templateButtonsContainer.innerHTML = ''; for (const name in templates) { const container = document.createElement('div'); container.className = 'custom-template flex items-center rounded-lg'; container.style.backgroundColor = 'var(--secondary-color)'; const button = document.createElement('button'); button.textContent = name; button.className = 'px-4 py-2 text-sm'; button.addEventListener('click', () => loadPrizeTemplate(name)); const deleteBtn = document.createElement('button'); deleteBtn.textContent = '✕'; deleteBtn.className = 'px-2 py-2 text-sm'; deleteBtn.style.color = 'var(--danger-color)'; deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deletePrizeTemplate(name); }); container.appendChild(button); container.appendChild(deleteBtn); templateButtonsContainer.appendChild(container); } };

// --- CORE LOGIC FUNCTIONS ---
const playTenseMusic = () => { if (!isSoundOn) return; rollingSound.currentTime = 0; const playPromise = rollingSound.play(); if (playPromise !== undefined) { playPromise.catch(error => console.error("Error playing rolling sound:", error)); } };
const stopTenseMusic = () => { rollingSound.pause(); rollingSound.currentTime = 0; };
const playWinnerSound = () => { if (!isSoundOn) return; winnerSound.currentTime = 0; const playPromise = winnerSound.play(); if (playPromise !== undefined) { playPromise.catch(error => console.error("Error playing winner sound:", error)); } };
const toggleSound = () => { isSoundOn = !isSoundOn; soundToggleBtn.textContent = isSoundOn ? '🔊' : '🔇'; if(!isSoundOn) { stopTenseMusic(); } };
const switchTab = (tabName) => {
    activeDataSource = tabName;
    const tabs = {
        custom: { btn: tabCustomBtn, content: tabContentCustom },
        cloud: { btn: tabCloudBtn, content: tabContentCloud },
        csv: { btn: tabCsvBtn, content: tabContentCsv }
    };
    Object.values(tabs).forEach(tab => {
        tab.btn.classList.remove('active');
        tab.content.classList.add('hidden');
    });
    tabs[tabName].btn.classList.add('active');
    tabs[tabName].content.classList.remove('hidden');
};
const switchEnvTab = (tabName) => { const tabs = { mode: { btn: tabModeBtn, content: tabContentMode }, title: { btn: tabTitleBtn, content: tabContentTitle }, prize: { btn: tabPrizeBtn, content: tabContentPrize }, theme: { btn: tabThemeBtn, content: tabContentTheme }, sound: { btn: tabSoundBtn, content: tabContentSound }, effect: { btn: tabEffectBtn, content: tabContentEffect } }; Object.values(tabs).forEach(tab => { tab.btn.classList.remove('active'); tab.content.classList.add('hidden'); }); tabs[tabName].btn.classList.add('active'); tabs[tabName].content.classList.remove('hidden'); };
const handleSimpleDrawToggle = (e) => { const isEnabled = e.target.checked; if (isEnabled) { tabPrizeBtn.classList.add('hidden'); if (tabPrizeBtn.classList.contains('active')) { switchEnvTab('mode'); } } else { tabPrizeBtn.classList.remove('hidden'); } localStorage.setItem('simpleDrawMode', isEnabled); };
const addPrizeRow = (name = '', quantity = 1) => { const row = document.createElement('div'); row.className = 'prize-row flex items-center gap-2'; row.innerHTML = ` <input type="text" class="prize-name form-input w-full p-2 rounded" value="${name}" placeholder="獎項名稱"> <input type="number" class="prize-quantity form-input w-24 p-2 rounded" value="${quantity}" min="1" placeholder="數量"> <button class="remove-prize-btn btn-secondary px-3 py-2 rounded" style="color: var(--danger-color);">✕</button> `; prizesContainer.appendChild(row); row.querySelector('.remove-prize-btn').addEventListener('click', () => row.remove()); };
const clearPrizes = () => { prizesContainer.innerHTML = ''; };
const handleUrlParams = () => { const params = new URLSearchParams(window.location.search); if (params.has('sheetUrl') && params.has('sheetName') && params.has('column')) { sheetUrlInput.value = params.get('sheetUrl'); sheetNameInput.value = params.get('sheetName'); columnLetterInput.value = params.get('column'); handleLoadData(); } };
const readAndValidatePrizes = () => { prizes = []; const isSimpleMode = simpleDrawToggle.checked; if (isSimpleMode) { return true; } const prizeRows = prizesContainer.querySelectorAll('.prize-row'); if (prizeRows.length === 0) { return true; } let totalPrizeQuantity = 0; for (const row of prizeRows) { const name = row.querySelector('.prize-name').value.trim(); const quantity = parseInt(row.querySelector('.prize-quantity').value, 10); if (!name) { updateStatus('獎項名稱不可為空！', true); return false; } if (isNaN(quantity) || quantity < 1) { updateStatus(`獎項「${name}」的數量必須是正整數！`, true); return false; } prizes.push({ name, quantity, winners: [] }); totalPrizeQuantity += quantity; } if (participants.length > 0 && totalPrizeQuantity > participants.length) { updateStatus(`警告：獎項總數 (${totalPrizeQuantity}) 大於參與人數 (${participants.length})！`, true); } return true; };
const handleLoadData = async () => {
    loadButton.disabled = true;
    updateStatus('正在處理名單...');
    if (activeDataSource === 'cloud') {
        await loadFromCloud();
    } else if (activeDataSource === 'csv') {
        await loadFromPublishedCsv();
    } else {
        loadFromCustomInput();
    }
};
const loadFromCustomInput = () => { const rawList = customListInput.value; participants = rawList.split(/[,，\n]+/).map(name => name.trim()).filter(name => name.length > 0); if (participants.length > 0 && readAndValidatePrizes()) { updateStatus(`成功載入 ${participants.length} 位參與者！`, false); switchToLotteryView(); } else { if (participants.length === 0) updateStatus(`自訂名單中沒有有效的名字。`, true); loadButton.disabled = false; } };
const loadFromCloud = async () => { const sheetUrl = sheetUrlInput.value.trim(); const sheetName = sheetNameInput.value.trim(); const columnLetter = columnLetterInput.value.trim().toUpperCase(); if (!sheetUrl) { updateStatus('請輸入 Google 試算表「共用」網址！', true); loadButton.disabled = false; return; } const sheetIdMatch = sheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/); if (!sheetIdMatch || !sheetIdMatch[1]) { updateStatus('無法從「共用」網址中解析出試算表 ID，請確認網址是否正確。', true); loadButton.disabled = false; return; } const sheetId = sheetIdMatch[1]; updateStatus('正在從雲端讀取名單...'); try { const timestamp = new Date().getTime(); const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&_=${timestamp}`; const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(csvUrl)}`; const response = await fetch(proxyUrl); if (!response.ok) throw new Error(`網路回應錯誤: ${response.statusText}`); const csvText = await response.text(); parseCsvData(csvText, columnLetter); if (participants.length > 0 && readAndValidatePrizes()) { updateStatus(`成功載入 ${participants.length} 位參與者！`, false); switchToLotteryView(); } else { if (participants.length === 0) updateStatus(`在 ${columnLetter} 欄找不到任何資料，請確認工作表與欄位名稱。`, true); loadButton.disabled = false; } } catch (error) { console.error('讀取共用連結時發生錯誤:', error); updateStatus('讀取失敗！請檢查網址是否正確，以及網路連線。', true); loadButton.disabled = false; } };
const loadFromPublishedCsv = async () => {
    const url = csvUrlInput.value.trim();
    if (!url) {
        updateStatus('請輸入「發布到網路」的 CSV 網址！', true);
        loadButton.disabled = false;
        return;
    }
    if (!url.includes('/pub?gid=') || !url.includes('output=csv')) {
        updateStatus('網址格式錯誤！請確認是「發布到網路」並選擇 CSV 格式的網址。', true);
        loadButton.disabled = false;
        return;
    }
    const columnLetter = csvColumnLetterInput.value.trim().toUpperCase();
    const columnIndex = columnLetter.charCodeAt(0) - 'A'.charCodeAt(0);
    updateStatus(`正在從發布的連結讀取名單 (${columnLetter}欄)...`);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`網路回應錯誤: ${response.statusText}`);
        const csvText = await response.text();
        
        participants = csvText
            .split('\n')
            .map(row => {
                const columns = row.split(',');
                return columns[columnIndex] ? columns[columnIndex].trim().replace(/^"|"$/g, '') : null;
            })
            .filter(name => name && name.length > 0);
            
        if (participants.length > 0 && readAndValidatePrizes()) {
            updateStatus(`成功載入 ${participants.length} 位參與者！`, false);
            switchToLotteryView();
        } else {
            if (participants.length === 0) updateStatus(`在指定的 CSV 網址 (${columnLetter}欄) 中找不到任何資料。`, true);
            loadButton.disabled = false;
        }
    } catch (error) {
        console.error('讀取發布的 CSV 時發生錯誤:', error);
        updateStatus('讀取失敗！請檢查網址是否正確，以及網路連線。', true);
        loadButton.disabled = false;
    }
};
const parseCsvData = (csvText, columnLetter) => { const columnIndex = columnLetter.charCodeAt(0) - 'A'.charCodeAt(0); participants = csvText.split('\n').slice(1).map(row => { const columns = row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')); return columns[columnIndex] || null; }).filter(name => name && name.length > 0); };
const handleDrawWinner = () => {
    if (drawButton.textContent === '重置' || drawButton.textContent === '結束') {
        resetApp();
        return;
    }
    if (drawButton.textContent === '抽獎結束') {
        winnerDisplay.textContent = '再接再厲';
        currentPrizeDisplay.textContent = '感謝參與！';
        drawButton.textContent = '重置';
        return;
    }
    if (participants.length === 0) {
        winnerDisplay.textContent = '所有人都已中獎！';
        drawButton.disabled = true;
        return;
    }
    const currentPrize = prizes[currentPrizeIndex];
    if (!currentPrize) return;
    if (currentPrize.winners.length >= currentPrize.quantity) {
        currentPrizeIndex++;
        updatePrizeDisplay();
        winnerDisplay.textContent = '準備開始！';
        return;
    }
    drawButton.disabled = true;
    playTenseMusic();
    rollingInterval = setInterval(() => {
        winnerDisplay.textContent = participants[Math.floor(Math.random() * participants.length)];
    }, 80);
    setTimeout(() => {
        clearInterval(rollingInterval);
        stopTenseMusic();
        const winnerIndex = Math.floor(Math.random() * participants.length);
        const winnerName = participants.splice(winnerIndex, 1)[0];
        const selectedEffect = winnerEffectSelect.value;
        const revealWinner = () => {
            winnerDisplay.textContent = winnerName;
            if (selectedEffect === 'spotlight') {
                winnerDisplay.classList.add('effect-spotlight');
            } else {
                winnerDisplay.classList.add('winner-reveal');
            }
            playWinnerSound();
            launchConfetti();
            
            // ★ 修改：存入物件而非字串，並預設為未領獎
            currentPrize.winners.push({ name: winnerName, claimed: false });
            
            updateParticipantCount();
            updateWinnersList();
            updatePrizeDisplay();
            drawButton.disabled = false;
        };
        if (selectedEffect === 'marquee') {
            winnerDisplay.textContent = winnerName;
            winnerDisplay.classList.add('effect-marquee');
            setTimeout(revealWinner, 1200);
        } else {
            revealWinner();
        }
    }, 4000);
};
const setupThemes = () => { const themeContainer = document.getElementById('theme-selector'); themeContainer.innerHTML = ''; themes.forEach(theme => { const button = document.createElement('button'); button.className = 'theme-button'; button.title = theme.name; button.dataset.theme = theme.id; button.style.background = `linear-gradient(45deg, ${theme.colors[0]}, ${theme.colors[1]})`; button.addEventListener('click', () => { applyTheme(theme.id); }); themeContainer.appendChild(button); }); };
const applyTheme = (themeId) => { document.body.className = document.body.className.replace(/theme-\w+/g, ''); if (themeId !== 'izakaya') { document.body.classList.add(`theme-${themeId}`); } localStorage.setItem('lotteryTheme', themeId); document.querySelectorAll('.theme-button').forEach(btn => { btn.classList.toggle('active', btn.dataset.theme === themeId); }); };
const loadTheme = () => { const savedTheme = localStorage.getItem('lotteryTheme') || 'candy'; applyTheme(savedTheme); };
const updateStatus = (message, isError = false) => { statusMessage.textContent = message; statusMessage.style.color = isError ? 'var(--danger-color)' : 'var(--accent-color)'; };
const switchToLotteryView = () => {
    settingsSection.classList.add('hidden');
    lotterySection.classList.remove('hidden');
    resetBtn.classList.remove('hidden');

    const isSimpleMode = simpleDrawToggle.checked;
    if (isSimpleMode) {
        prizes = [];
        prizes.push({ name: '抽出名單', quantity: participants.length, winners: [] });
        participantLabel.textContent = '未中籤人數';
    } else {
        participantLabel.textContent = '剩餘摸彩人數';
    }

    updateParticipantCount();
    updatePrizeDisplay();
};
const adjustPrizeNameFontSize = () => { const nameElement = document.getElementById('finished-prize-name'); if (!nameElement) return; const container = winnerDisplay; let fontSize = 4; const minFontSize = 1; const step = 0.2; nameElement.style.fontSize = `${fontSize}rem`; while (nameElement.scrollWidth > container.clientWidth * 0.95 && fontSize > minFontSize) { fontSize -= step; nameElement.style.fontSize = `${fontSize}rem`; } };
const updatePrizeDisplay = () => { const isSimpleMode = simpleDrawToggle.checked; if (currentPrizeIndex >= prizes.length) { if (isSimpleMode) { currentPrizeDisplay.textContent = '所有人都已抽出！'; drawButton.textContent = '結束'; } else { currentPrizeDisplay.textContent = '所有項目已抽完！'; drawButton.textContent = '抽獎結束'; } drawButton.disabled = false; exportCsvBtn.classList.remove('hidden'); return; } const currentPrize = prizes[currentPrizeIndex]; if (isSimpleMode) { currentPrizeDisplay.textContent = '幸運的你'; } else { const progress = `${currentPrize.winners.length} / ${currentPrize.quantity}`; currentPrizeDisplay.textContent = `正在抽取: ${currentPrize.name} (${progress})`; } if (currentPrize.winners.length >= currentPrize.quantity) { if (!isSimpleMode) { winnerDisplay.innerHTML = ` <div class="flex flex-col items-center justify-center leading-tight"> <div id="finished-prize-name" class="w-full px-4 text-center whitespace-nowrap" style="font-size: 4rem;">${currentPrize.name}</div> <div class="text-4xl mt-2">已抽完！</div> </div>`; adjustPrizeNameFontSize(); } const nextPrize = prizes[currentPrizeIndex + 1]; drawButton.textContent = nextPrize ? `繼續抽「${nextPrize.name}」` : '抽獎結束'; if (!nextPrize) { drawButton.disabled = false; exportCsvBtn.classList.remove('hidden'); } } else { if (isSimpleMode) { drawButton.textContent = '抽籤'; } else { const randomPhrase = buttonPhrases[Math.floor(Math.random() * buttonPhrases.length)]; drawButton.textContent = randomPhrase; } } };
const updateParticipantCount = () => { participantCountSpan.textContent = participants.length; };
const updateWinnersList = () => {
    const isSimpleMode = simpleDrawToggle.checked;
    const hasAnyWinners = prizes.some(p => p.winners.length > 0);
    if (hasAnyWinners) {
        winnersListContainer.classList.remove('hidden');
        mainDrawPanel.classList.remove('md:w-full');
        mainDrawPanel.classList.add('md:w-[70%]');
    } else {
        return;
    }
    winnersList.innerHTML = '';
    if (isSimpleMode) {
        document.getElementById('winners-list-title').textContent = '已抽出名單';
        const winnerNames = document.createElement('div');
        winnerNames.className = 'grid grid-cols-2 gap-x-4 gap-y-2 mt-2 text-base';
        prizes[0].winners.forEach(winner => {
            const winnerTag = document.createElement('div');
            winnerTag.textContent = winner.name; // ★ 修改：讀取物件的 name 屬性
            winnerTag.className = 'winner-tag px-2 py-1 rounded-md truncate cursor-pointer transition-colors';
            
            // ★ 新增：根據記憶體的狀態，決定是否要加上樣式
            if (winner.claimed) {
                winnerTag.classList.add('claimed');
            }
            
            // ★ 修改：點擊時，同時更新記憶體狀態與視覺樣式
            winnerTag.addEventListener('click', (e) => {
                winner.claimed = !winner.claimed;
                e.currentTarget.classList.toggle('claimed', winner.claimed);
            });
            winnerNames.appendChild(winnerTag);
        });
        winnersList.appendChild(winnerNames);
    } else {
        document.getElementById('winners-list-title').textContent = '🎉 得獎名單 🎉';
        prizes.forEach(prize => {
            if (prize.winners.length > 0) {
                const prizeContainer = document.createElement('div');
                prizeContainer.innerHTML = `<h4 class="font-bold text-lg" style="color: var(--accent-color);">${prize.name} (${prize.winners.length}/${prize.quantity})</h4>`;
                const winnerNames = document.createElement('div');
                winnerNames.className = 'grid grid-cols-2 gap-x-4 gap-y-2 mt-2 text-base';
                prize.winners.forEach(winner => {
                    const winnerTag = document.createElement('div');
                    winnerTag.textContent = winner.name; // ★ 修改：讀取物件的 name 屬性
                    winnerTag.className = 'winner-tag px-2 py-1 rounded-md truncate cursor-pointer transition-colors';

                    // ★ 新增：根據記憶體的狀態，決定是否要加上樣式
                    if (winner.claimed) {
                        winnerTag.classList.add('claimed');
                    }
                    
                    // ★ 修改：點擊時，同時更新記憶體狀態與視覺樣式
                    winnerTag.addEventListener('click', (e) => {
                        winner.claimed = !winner.claimed;
                        e.currentTarget.classList.toggle('claimed', winner.claimed);
                    });
                    winnerNames.appendChild(winnerTag);
                });
                prizeContainer.appendChild(winnerNames);
                winnersList.appendChild(prizeContainer);
            }
        });
    }
};
const exportResultsToCsv = () => {
    const isSimpleMode = simpleDrawToggle.checked;
    let csvContent = isSimpleMode ? '\uFEFF"抽出順序","姓名"\n' : '\uFEFF"獎項","得獎人"\n';
    prizes.forEach(prize => {
        prize.winners.forEach((winner, index) => {
            // ★ 修改：讀取物件的 name 屬性
            const winnerEscaped = `"${winner.name.replace(/"/g, '""')}"`;
            if (isSimpleMode) {
                csvContent += `${index + 1},${winnerEscaped}\n`;
            } else {
                const prizeNameEscaped = `"${prize.name.replace(/"/g, '""')}"`;
                csvContent += `${prizeNameEscaped},${winnerEscaped}\n`;
            }
        });
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateString = `${yyyy}${mm}${dd}`;
    const baseName = isSimpleMode ? '抽出名單' : '得獎名單';
    const fileName = `ㄚ亮笑長的抽抽樂-${baseName}-${dateString}.csv`;
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
const resetApp = () => {
    settingsSection.classList.remove('hidden');
    lotterySection.classList.add('hidden');
    resetBtn.classList.add('hidden');
    participants = [];
    prizes = [];
    currentPrizeIndex = 0;
    winnerDisplay.textContent = '準備開始！';
    winnerDisplay.classList.remove('winner-reveal');
    winnersList.innerHTML = '';
    winnersListContainer.classList.add('hidden');
    mainDrawPanel.classList.remove('md:w-[70%]');
    mainDrawPanel.classList.add('md:w-full');
    exportCsvBtn.classList.add('hidden');
    participantCountSpan.textContent = '0';
    currentPrizeDisplay.textContent = '';
    mainTitle.textContent = titleInput.value.trim() || 'ㄚ亮笑長的抽抽樂';
    participantLabel.textContent = '剩餘摸彩人數';
    drawButton.textContent = '開始摸彩';
    drawButton.disabled = false;
    sheetUrlInput.value = '';
    sheetNameInput.value = '工作表1';
    columnLetterInput.value = 'A';
    csvUrlInput.value = '';
    csvColumnLetterInput.value = 'A';
    customListInput.value = '';
    prizesContainer.innerHTML = '';
    addPrizeRow('三獎', 3);
    addPrizeRow('二獎', 2);
    addPrizeRow('頭獎', 1);
    loadButton.disabled = false;
    updateStatus('');
    switchTab('custom');
};
const launchConfetti = () => { const duration = 2 * 1000; const animationEnd = Date.now() + duration; const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }; function randomInRange(min, max) { return Math.random() * (max - min) + min; } const interval = setInterval(() => { const timeLeft = animationEnd - Date.now(); if (timeLeft <= 0) return clearInterval(interval); const particleCount = 50 * (timeLeft / duration); confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }); confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }); }, 250); };

// Start the application
init();
