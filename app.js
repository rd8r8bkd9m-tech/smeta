// Application State
let estimates = [];
let currentEstimate = null;
let editingIndex = -1;
let generatedEstimateData = null;

// PWA State
let isOnline = navigator.onLine;
let touchStartY = 0;
let isPulling = false;

// DOM Elements
const listView = document.getElementById('listView');
const editView = document.getElementById('editView');
const aiView = document.getElementById('aiView');
const estimatesList = document.getElementById('estimatesList');
const itemsContainer = document.getElementById('itemsContainer');
const totalAmount = document.getElementById('totalAmount');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadEstimates();
    initializeEventListeners();
    renderEstimatesList();
    loadApiKey();
    initializePWAFeatures();
});

// Event Listeners
function initializeEventListeners() {
    document.getElementById('createWithAiBtn').addEventListener('click', showAiView);
    document.getElementById('createManualBtn').addEventListener('click', createNewEstimate);
    document.getElementById('createMegaProjectBtn').addEventListener('click', createMegaProject);
    document.getElementById('backFromAiBtn').addEventListener('click', showListView);
    document.getElementById('backToListBtn').addEventListener('click', showListView);
    document.getElementById('saveEstimateBtn').addEventListener('click', saveCurrentEstimate);
    document.getElementById('addItemBtn').addEventListener('click', addItemRow);
    document.getElementById('exportBtn').addEventListener('click', exportEstimate);
    document.getElementById('generateEstimateBtn').addEventListener('click', generateEstimateWithAI);
    document.getElementById('acceptAiBtn').addEventListener('click', acceptGeneratedEstimate);
    document.getElementById('regenerateBtn').addEventListener('click', generateEstimateWithAI);
    
    // Save API key when changed
    document.getElementById('aiApiKey').addEventListener('change', saveApiKey);
    
    // Set today's date as default
    document.getElementById('estimateDate').valueAsDate = new Date();
}

// Storage Functions
function loadEstimates() {
    const stored = localStorage.getItem('estimates');
    if (stored) {
        try {
            estimates = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading estimates:', e);
            estimates = [];
        }
    }
}

function saveEstimates() {
    localStorage.setItem('estimates', JSON.stringify(estimates));
}

function loadApiKey() {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (apiKey) {
        document.getElementById('aiApiKey').value = apiKey;
    }
}

function saveApiKey() {
    const apiKey = document.getElementById('aiApiKey').value.trim();
    if (apiKey) {
        localStorage.setItem('gemini_api_key', apiKey);
    }
}

// View Functions
function showListView() {
    listView.classList.add('active');
    editView.classList.remove('active');
    aiView.classList.remove('active');
    renderEstimatesList();
}

function showEditView() {
    listView.classList.remove('active');
    editView.classList.add('active');
    aiView.classList.remove('active');
}

function showAiView() {
    listView.classList.remove('active');
    editView.classList.remove('active');
    aiView.classList.add('active');
    
    // Hide result if visible
    document.getElementById('aiResult').style.display = 'none';
    document.getElementById('aiStatus').style.display = 'none';
}

// AI Generation Functions
async function generateEstimateWithAI() {
    const apiKey = document.getElementById('aiApiKey').value.trim();
    const description = document.getElementById('aiDescription').value.trim();
    
    if (!apiKey) {
        alert('Пожалуйста, введите API ключ Gemini');
        return;
    }
    
    if (!description) {
        alert('Пожалуйста, опишите объект и работы');
        return;
    }
    
    // Save API key
    localStorage.setItem('gemini_api_key', apiKey);
    
    // Show loading
    document.getElementById('aiStatus').style.display = 'block';
    document.getElementById('aiResult').style.display = 'none';
    updateStatusText('Запуск строительного института...');
    
    try {
        // Multi-agent system: Construction Institute
        updateStatusText('🏗️ Главный инженер анализирует объект...');
        const chiefAnalysis = await runChiefEngineerAgent(apiKey, description);
        
        updateStatusText('📐 Архитектор рассчитывает объемы...');
        const architectAnalysis = await runArchitectAgent(apiKey, description, chiefAnalysis);
        
        updateStatusText('🔨 Прораб определяет работы...');
        const foremanAnalysis = await runForemanAgent(apiKey, description, chiefAnalysis, architectAnalysis);
        
        updateStatusText('📦 Снабженец подбирает материалы...');
        const materialsAnalysis = await runMaterialsAgent(apiKey, description, architectAnalysis, foremanAnalysis);
        
        updateStatusText('💰 Сметчик формирует итоговую смету...');
        const finalEstimate = await runEstimatorAgent(apiKey, description, chiefAnalysis, architectAnalysis, foremanAnalysis, materialsAnalysis);
        
        updateStatusText('✅ Смета готова!');
        
        // Parse the result
        generatedEstimateData = parseAIResponse(finalEstimate);
        
        // Display result
        displayGeneratedEstimate(generatedEstimateData);
        
        document.getElementById('aiStatus').style.display = 'none';
        document.getElementById('aiResult').style.display = 'block';
        
    } catch (error) {
        console.error('AI Generation Error:', error);
        document.getElementById('aiStatus').style.display = 'none';
        alert('Ошибка при генерации сметы: ' + error.message + '\n\nПроверьте правильность API ключа и попробуйте снова.');
    }
}

function updateStatusText(text) {
    const statusElement = document.querySelector('.status-text');
    if (statusElement) {
        statusElement.textContent = text;
    }
}

// Agent 1: Chief Engineer - Analyzes the project and provides technical overview
async function runChiefEngineerAgent(apiKey, description) {
    const prompt = `Ты - ГЛАВНЫЙ ИНЖЕНЕР строительного института с 25-летним опытом.

ОПИСАНИЕ ОБЪЕКТА:
${description}

ТВОЯ ЗАДАЧА:
Проанализируй объект и дай техническую характеристику:
1. Тип объекта (квартира, дом, офис и т.д.)
2. Масштаб работ (косметический, капитальный ремонт, новое строительство)
3. Особенности и сложности
4. Рекомендации по технологиям

Ответь в формате JSON:
{
  "objectType": "тип объекта",
  "workScale": "масштаб работ",
  "complexity": "уровень сложности (простой/средний/сложный)",
  "features": ["особенность 1", "особенность 2"],
  "recommendations": ["рекомендация 1", "рекомендация 2"]
}`;

    return await callGeminiAPI(apiKey, prompt);
}

// Agent 2: Architect - Calculates volumes and areas
async function runArchitectAgent(apiKey, description, chiefAnalysis) {
    const prompt = `Ты - АРХИТЕКТОР-ПРОЕКТИРОВЩИК строительного института.

ОПИСАНИЕ ОБЪЕКТА:
${description}

АНАЛИЗ ГЛАВНОГО ИНЖЕНЕРА:
${chiefAnalysis}

ТВОЯ ЗАДАЧА:
Рассчитай точные объемы и площади работ:
1. Определи все поверхности и их площади
2. Рассчитай объемы материалов с учетом отходов (обычно +10-15%)
3. Учти все технические требования

Ответь в формате JSON:
{
  "areas": [
    {"name": "название поверхности", "value": число, "unit": "м²"}
  ],
  "volumes": [
    {"name": "название объема", "value": число, "unit": "м³"}
  ],
  "wasteFactors": {"штукатурка": 1.1, "краска": 1.05, "плитка": 1.15}
}`;

    return await callGeminiAPI(apiKey, prompt);
}

// Agent 3: Foreman - Determines work scope and methods
async function runForemanAgent(apiKey, description, chiefAnalysis, architectAnalysis) {
    const prompt = `Ты - ПРОРАБ с опытом 20 лет в строительстве.

ОПИСАНИЕ ОБЪЕКТА:
${description}

АНАЛИЗ ГЛАВНОГО ИНЖЕНЕРА:
${chiefAnalysis}

РАСЧЕТЫ АРХИТЕКТОРА:
${architectAnalysis}

ТВОЯ ЗАДАЧА:
Определи все необходимые работы с точными расценками:
1. Составь полный перечень работ
2. Укажи трудозатраты и стоимость по российским расценкам 2025 года
3. Учти подготовительные работы, основные работы и финишную отделку
4. Используй актуальные цены для Москвы

Ответь в формате JSON:
{
  "preparatoryWorks": [
    {"name": "работа", "quantity": число, "unit": "ед", "pricePerUnit": цена, "notes": "примечания"}
  ],
  "mainWorks": [
    {"name": "работа", "quantity": число, "unit": "ед", "pricePerUnit": цена, "notes": "примечания"}
  ],
  "finishingWorks": [
    {"name": "работа", "quantity": число, "unit": "ед", "pricePerUnit": цена, "notes": "примечания"}
  ]
}`;

    return await callGeminiAPI(apiKey, prompt);
}

// Agent 4: Materials Specialist - Selects optimal materials
async function runMaterialsAgent(apiKey, description, architectAnalysis, foremanAnalysis) {
    const prompt = `Ты - ИНЖЕНЕР ПО СНАБЖЕНИЮ материалами со знанием всего рынка стройматериалов России.

ОПИСАНИЕ ОБЪЕКТА:
${description}

РАСЧЕТЫ АРХИТЕКТОРА:
${architectAnalysis}

ПЕРЕЧЕНЬ РАБОТ ОТ ПРОРАБА:
${foremanAnalysis}

ТВОЯ ЗАДАЧА:
Подбери оптимальные материалы:
1. Выбери конкретные марки и производителей (среднего качества)
2. Рассчитай точное количество с учетом отходов
3. Укажи актуальные рыночные цены для Москвы 2025 года
4. Добавь расходные материалы (крепеж, грунтовки, и т.д.)

Ответь в формате JSON:
{
  "mainMaterials": [
    {"name": "материал с маркой", "quantity": число, "unit": "ед", "pricePerUnit": цена, "manufacturer": "производитель"}
  ],
  "auxiliaryMaterials": [
    {"name": "расходный материал", "quantity": число, "unit": "ед", "pricePerUnit": цена}
  ]
}`;

    return await callGeminiAPI(apiKey, prompt);
}

// Agent 5: Cost Estimator - Creates final accurate estimate
async function runEstimatorAgent(apiKey, description, chiefAnalysis, architectAnalysis, foremanAnalysis, materialsAnalysis) {
    const prompt = `Ты - ПРОФЕССИОНАЛЬНЫЙ СМЕТЧИК строительного института с сертификацией.

ОПИСАНИЕ ОБЪЕКТА:
${description}

АНАЛИЗ ГЛАВНОГО ИНЖЕНЕРА:
${chiefAnalysis}

РАСЧЕТЫ АРХИТЕКТОРА:
${architectAnalysis}

ПЕРЕЧЕНЬ РАБОТ ОТ ПРОРАБА:
${foremanAnalysis}

ПОДБОР МАТЕРИАЛОВ ОТ СНАБЖЕНЦА:
${materialsAnalysis}

ТВОЯ ЗАДАЧА:
Составь итоговую детальную смету высокой точности (99%):
1. Объедини все данные от специалистов
2. Проверь все расчеты на корректность
3. Убедись, что цены актуальны для Москвы 2025 года
4. Раздели на МАТЕРИАЛЫ и РАБОТЫ
5. Добавь коэффициенты и накладные расходы (обычно 15-20% на работы)

Верни результат СТРОГО в формате JSON:
{
  "title": "Название сметы",
  "client": "Физическое/Юридическое лицо",
  "project": "Тип проекта",
  "accuracy": "99%",
  "institute": "Строительный институт SmartEstimate",
  "materials": [
    {
      "description": "Полное название материала с маркой",
      "quantity": точное_число,
      "unit": "ед_измерения",
      "price": цена_за_единицу
    }
  ],
  "labor": [
    {
      "description": "Название работы по ГОСТ",
      "quantity": точное_число,
      "unit": "ед_измерения",
      "price": цена_за_единицу_с_накладными
    }
  ],
  "summary": {
    "materialsTotal": сумма_материалов,
    "laborTotal": сумма_работ,
    "grandTotal": общая_сумма,
    "notes": "Дополнительные примечания"
  }
}

Верни ТОЛЬКО JSON, без markdown и дополнительного текста.`;

    return await callGeminiAPI(apiKey, prompt);
}

async function callGeminiAPI(apiKey, prompt) {
    // Use the latest stable model - gemini-1.5-flash is fast and capable
    // Alternatives: gemini-1.5-pro (more capable but slower), gemini-2.0-flash-exp (experimental)
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'];
    
    let lastError = null;
    
    // Try each model until one works
    for (const model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                lastError = errorData.error?.message || 'API request failed';
                
                // If it's a model not found error, try the next model
                if (response.status === 404 || lastError.includes('models/')) {
                    console.log(`Model ${model} not available, trying next...`);
                    continue;
                }
                
                // For other errors (like invalid API key), throw immediately
                throw new Error(lastError);
            }
            
            const data = await response.json();
            
            // Check if response has the expected structure
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Неожиданный формат ответа от API');
            }
            
            const text = data.candidates[0].content.parts[0].text;
            
            console.log(`✓ Successfully used model: ${model}`);
            return text;
            
        } catch (error) {
            lastError = error.message;
            console.error(`Error with model ${model}:`, error.message);
            
            // If it's a network error or API key error, don't try other models
            if (error.message.includes('API key') || error.message.includes('invalid') || 
                error.message.includes('network') || error.message.includes('fetch')) {
                throw error;
            }
            
            // Otherwise, try the next model
            continue;
        }
    }
    
    // If all models failed
    throw new Error(`Не удалось подключиться к API Gemini. Последняя ошибка: ${lastError}\n\nПроверьте:\n1. Правильность API ключа\n2. Активацию API ключа на https://makersuite.google.com/app/apikey\n3. Наличие интернет соединения`);
}

function parseAIResponse(aiResponse) {
    // Try to extract JSON from the response
    let jsonText = aiResponse.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Try to find JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        jsonText = jsonMatch[0];
    }
    
    try {
        const data = JSON.parse(jsonText);
        return data;
    } catch (e) {
        console.error('Failed to parse AI response:', aiResponse);
        throw new Error('Не удалось распознать ответ ИИ. Попробуйте ещё раз.');
    }
}

function displayGeneratedEstimate(data) {
    const resultContent = document.getElementById('aiResultContent');
    
    let html = `
        <div class="estimate-preview">
            <div class="institute-badge">
                <h4>🏗️ ${data.institute || 'Строительный институт SmartEstimate'}</h4>
                <p class="accuracy-badge">✨ Точность: ${data.accuracy || '99%'}</p>
            </div>
            <h4>${data.title || 'Смета'}</h4>
            <p><strong>Клиент:</strong> ${data.client || 'Не указан'}</p>
            <p><strong>Проект:</strong> ${data.project || 'Не указан'}</p>
            ${data.summary && data.summary.notes ? `<p class="note"><em>${data.summary.notes}</em></p>` : ''}
            
            <div class="section-header">📦 Материалы</div>
    `;
    
    let materialsTotal = 0;
    if (data.materials && data.materials.length > 0) {
        data.materials.forEach(item => {
            const itemTotal = item.quantity * item.price;
            materialsTotal += itemTotal;
            html += `
                <div class="generated-item material">
                    <div class="item-name">${item.description}</div>
                    <div class="item-details">
                        <span>${item.quantity} ${item.unit} × ${formatCurrency(item.price)}</span>
                        <span class="item-price">${formatCurrency(itemTotal)}</span>
                    </div>
                </div>
            `;
        });
    }
    
    html += `
            <p style="text-align: right; margin: 10px 0;"><strong>Итого материалы: ${formatCurrency(materialsTotal)}</strong></p>
            
            <div class="section-header">🔨 Работы</div>
    `;
    
    let laborTotal = 0;
    if (data.labor && data.labor.length > 0) {
        data.labor.forEach(item => {
            const itemTotal = item.quantity * item.price;
            laborTotal += itemTotal;
            html += `
                <div class="generated-item labor">
                    <div class="item-name">${item.description}</div>
                    <div class="item-details">
                        <span>${item.quantity} ${item.unit} × ${formatCurrency(item.price)}</span>
                        <span class="item-price">${formatCurrency(itemTotal)}</span>
                    </div>
                </div>
            `;
        });
    }
    
    const total = data.summary ? data.summary.grandTotal : (materialsTotal + laborTotal);
    html += `
            <p style="text-align: right; margin: 10px 0;"><strong>Итого работы: ${formatCurrency(laborTotal)}</strong></p>
            <div class="total-summary">
                <p style="text-align: right; margin: 20px 0; font-size: 1.3rem; color: var(--success-color);"><strong>ВСЕГО: ${formatCurrency(total)}</strong></p>
                <p class="certification">✓ Смета составлена командой профессиональных специалистов</p>
            </div>
        </div>
    `;
    
    resultContent.innerHTML = html;
}

function acceptGeneratedEstimate() {
    if (!generatedEstimateData) {
        return;
    }
    
    // Create estimate from generated data
    currentEstimate = {
        title: generatedEstimateData.title || 'Смета',
        date: new Date().toISOString().split('T')[0],
        client: generatedEstimateData.client || '',
        project: generatedEstimateData.project || '',
        items: [],
        total: 0
    };
    
    // Add materials
    if (generatedEstimateData.materials) {
        generatedEstimateData.materials.forEach(item => {
            currentEstimate.items.push({
                description: `[Материал] ${item.description}`,
                quantity: item.quantity,
                unit: item.unit,
                price: item.price
            });
        });
    }
    
    // Add labor
    if (generatedEstimateData.labor) {
        generatedEstimateData.labor.forEach(item => {
            currentEstimate.items.push({
                description: `[Работа] ${item.description}`,
                quantity: item.quantity,
                unit: item.unit,
                price: item.price
            });
        });
    }
    
    // Calculate total
    currentEstimate.total = currentEstimate.items.reduce((sum, item) => {
        return sum + (item.quantity * item.price);
    }, 0);
    
    editingIndex = -1;
    loadEstimateToForm();
    showEditView();
}

// Estimate List Functions
function renderEstimatesList() {
    if (estimates.length === 0) {
        estimatesList.innerHTML = `
            <div class="empty-state">
                <p>📄 Нет сохраненных смет</p>
                <p class="help-text">Используйте ИИ для быстрого создания или создайте вручную</p>
            </div>
        `;
        return;
    }
    
    estimatesList.innerHTML = estimates.map((estimate, index) => `
        <div class="estimate-card" data-index="${index}">
            <h3>${estimate.title || 'Без названия'}</h3>
            <div class="estimate-card-info">
                <span>📅 ${estimate.date || 'Дата не указана'}</span>
                <span>👤 ${estimate.client || 'Клиент не указан'}</span>
                <span>📁 ${estimate.project || 'Проект не указан'}</span>
            </div>
            <div class="estimate-card-total">
                Итого: ${formatCurrency(estimate.total || 0)}
            </div>
            <div class="estimate-card-actions">
                <button class="btn btn-primary btn-small" data-action="edit" data-index="${index}">✏️ Редактировать</button>
                <button class="btn btn-danger btn-small" data-action="delete" data-index="${index}">🗑️ Удалить</button>
            </div>
        </div>
    `).join('');
    
    // Add click handlers to cards
    document.querySelectorAll('.estimate-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Check if it's an action button
            const actionButton = e.target.closest('[data-action]');
            if (actionButton) {
                e.stopPropagation();
                const index = parseInt(actionButton.dataset.index);
                const action = actionButton.dataset.action;
                
                if (action === 'edit') {
                    editEstimate(index);
                } else if (action === 'delete') {
                    deleteEstimate(index);
                }
            } else if (!e.target.closest('.estimate-card-actions')) {
                const index = parseInt(card.dataset.index);
                editEstimate(index);
            }
        });
    });
}

function createNewEstimate() {
    currentEstimate = {
        title: '',
        date: new Date().toISOString().split('T')[0],
        client: '',
        project: '',
        items: [],
        total: 0
    };
    editingIndex = -1;
    loadEstimateToForm();
    showEditView();
}

// Create a billion-dollar mega project demonstration
function createMegaProject() {
    currentEstimate = {
        title: 'Мегапроект: Международный бизнес-комплекс "Москва-Сити 2.0"',
        date: new Date().toISOString().split('T')[0],
        client: 'Правительство г. Москвы',
        project: 'Строительство многофункционального бизнес-комплекса с офисными, торговыми и жилыми зонами',
        items: [
            // Major infrastructure
            {
                description: '🏗️ [Работы] Подготовка территории и земляные работы (850 тыс. м³)',
                quantity: 850000,
                unit: 'м³',
                price: 4500
            },
            {
                description: '🏗️ [Работы] Устройство фундамента и подземных уровней (5 уровней парковки)',
                quantity: 425000,
                unit: 'м³',
                price: 35000
            },
            {
                description: '🏢 [Работы] Возведение несущих конструкций (башни высотой 350м)',
                quantity: 320000,
                unit: 'м²',
                price: 125000
            },
            {
                description: '🏢 [Работы] Монтаж фасадных систем (стекло, алюминий, композиты)',
                quantity: 280000,
                unit: 'м²',
                price: 45000
            },
            // Materials
            {
                description: '📦 [Материалы] Бетон высокопрочный M500-M600',
                quantity: 650000,
                unit: 'м³',
                price: 12000
            },
            {
                description: '📦 [Материалы] Арматура класса A500C',
                quantity: 85000,
                unit: 'т',
                price: 65000
            },
            {
                description: '📦 [Материалы] Металлоконструкции (колонны, балки)',
                quantity: 42000,
                unit: 'т',
                price: 95000
            },
            {
                description: '📦 [Материалы] Стеклянные фасадные панели (энергоэффективные)',
                quantity: 280000,
                unit: 'м²',
                price: 18500
            },
            // Engineering systems
            {
                description: '⚡ [Работы] Электроснабжение и освещение (трансформаторные подстанции)',
                quantity: 45,
                unit: 'шт',
                price: 28000000
            },
            {
                description: '💧 [Работы] Системы водоснабжения и канализации',
                quantity: 850000,
                unit: 'м²',
                price: 3200
            },
            {
                description: '❄️ [Работы] Системы вентиляции и кондиционирования',
                quantity: 850000,
                unit: 'м²',
                price: 4800
            },
            {
                description: '🔥 [Работы] Противопожарные системы и сигнализация',
                quantity: 850000,
                unit: 'м²',
                price: 2100
            },
            {
                description: '🚀 [Материалы] Лифтовое оборудование (120 высокоскоростных лифтов)',
                quantity: 120,
                unit: 'шт',
                price: 15000000
            },
            {
                description: '🚀 [Материалы] Эскалаторы и травалаторы',
                quantity: 85,
                unit: 'шт',
                price: 4500000
            },
            // Interior and finishing
            {
                description: '✨ [Работы] Внутренняя отделка офисных помещений премиум-класса',
                quantity: 480000,
                unit: 'м²',
                price: 28000
            },
            {
                description: '✨ [Работы] Отделка торговых площадей',
                quantity: 120000,
                unit: 'м²',
                price: 35000
            },
            {
                description: '✨ [Работы] Отделка жилых помещений класса "люкс"',
                quantity: 95000,
                unit: 'м²',
                price: 42000
            },
            {
                description: '🎨 [Материалы] Натуральный камень для отделки (мрамор, гранит)',
                quantity: 45000,
                unit: 'м²',
                price: 25000
            },
            // Smart building systems
            {
                description: '🤖 [Работы] Системы "Умный дом" и автоматизация здания (BMS)',
                quantity: 1,
                unit: 'шт',
                price: 850000000
            },
            {
                description: '📡 [Работы] IT-инфраструктура и серверные',
                quantity: 1,
                unit: 'шт',
                price: 420000000
            },
            {
                description: '🛡️ [Работы] Системы безопасности (видеонаблюдение, СКУД, охрана)',
                quantity: 1,
                unit: 'шт',
                price: 380000000
            },
            // Landscaping and external works
            {
                description: '🌳 [Работы] Благоустройство территории (25 га)',
                quantity: 250000,
                unit: 'м²',
                price: 8500
            },
            {
                description: '🚗 [Работы] Устройство дорог, парковок и подъездных путей',
                quantity: 85000,
                unit: 'м²',
                price: 12000
            },
            {
                description: '💡 [Работы] Наружное освещение и малые архитектурные формы',
                quantity: 1,
                unit: 'шт',
                price: 180000000
            },
            // Project management and design
            {
                description: '📋 [Работы] Проектно-изыскательские работы',
                quantity: 1,
                unit: 'шт',
                price: 950000000
            },
            {
                description: '👷 [Работы] Генподрядные и управленческие услуги',
                quantity: 1,
                unit: 'шт',
                price: 1850000000
            },
            {
                description: '✅ [Работы] Авторский надзор и технический контроль',
                quantity: 1,
                unit: 'шт',
                price: 420000000
            }
        ],
        total: 0
    };
    
    // Calculate total
    currentEstimate.total = currentEstimate.items.reduce((sum, item) => {
        return sum + (item.quantity * item.price);
    }, 0);
    
    editingIndex = -1;
    loadEstimateToForm();
    showEditView();
    
    // Show success message
    setTimeout(() => {
        alert(`✨ Создан демонстрационный мегапроект!\n\n` +
              `💎 Стоимость: ${formatCurrency(currentEstimate.total)}\n\n` +
              `📊 Позиций: ${currentEstimate.items.length}\n\n` +
              `🏗️ Масштаб: Международный бизнес-комплекс с офисными, торговыми и жилыми зонами\n\n` +
              `Это демонстрация возможностей приложения для работы с крупнейшими проектами!`);
    }, 500);
}

function editEstimate(index) {
    currentEstimate = JSON.parse(JSON.stringify(estimates[index])); // Deep copy
    editingIndex = index;
    loadEstimateToForm();
    showEditView();
}

function deleteEstimate(index) {
    if (confirm('Вы уверены, что хотите удалить эту смету?')) {
        estimates.splice(index, 1);
        saveEstimates();
        renderEstimatesList();
    }
}

// Form Functions
function loadEstimateToForm() {
    document.getElementById('estimateTitle').value = currentEstimate.title || '';
    document.getElementById('estimateDate').value = currentEstimate.date || '';
    document.getElementById('estimateClient').value = currentEstimate.client || '';
    document.getElementById('estimateProject').value = currentEstimate.project || '';
    
    itemsContainer.innerHTML = '';
    
    if (currentEstimate.items && currentEstimate.items.length > 0) {
        currentEstimate.items.forEach(item => {
            addItemRow(item);
        });
    } else {
        // Add one empty row
        addItemRow();
    }
    
    calculateTotal();
}

function addItemRow(itemData = null) {
    const item = itemData || {
        description: '',
        quantity: 1,
        unit: 'шт',
        price: 0
    };
    
    const itemId = Date.now() + Math.random();
    const row = document.createElement('div');
    row.className = 'item-row';
    row.dataset.itemId = itemId;
    
    row.innerHTML = `
        <div class="form-group">
            <label>Наименование работ/материалов:</label>
            <input type="text" class="form-control item-description" value="${item.description || ''}" placeholder="Описание позиции">
        </div>
        <div class="form-group">
            <label>Количество:</label>
            <input type="number" class="form-control item-quantity" value="${item.quantity || 1}" min="0" step="0.01">
        </div>
        <div class="form-group">
            <label>Единица:</label>
            <select class="form-control item-unit">
                <option value="шт" ${(item.unit || 'шт') === 'шт' ? 'selected' : ''}>шт</option>
                <option value="м" ${item.unit === 'м' ? 'selected' : ''}>м</option>
                <option value="м²" ${item.unit === 'м²' ? 'selected' : ''}>м²</option>
                <option value="м³" ${item.unit === 'м³' ? 'selected' : ''}>м³</option>
                <option value="кг" ${item.unit === 'кг' ? 'selected' : ''}>кг</option>
                <option value="т" ${item.unit === 'т' ? 'selected' : ''}>т</option>
                <option value="час" ${item.unit === 'час' ? 'selected' : ''}>час</option>
                <option value="день" ${item.unit === 'день' ? 'selected' : ''}>день</option>
            </select>
        </div>
        <div class="form-group">
            <label>Цена за ед.:</label>
            <input type="number" class="form-control item-price" value="${item.price || 0}" min="0" step="0.01">
        </div>
        <div class="form-group">
            <label>Сумма:</label>
            <div class="item-total">${formatCurrency((item.quantity || 0) * (item.price || 0))}</div>
        </div>
        <button type="button" class="btn btn-danger btn-small remove-item-btn">🗑️</button>
    `;
    
    itemsContainer.appendChild(row);
    
    // Add event listeners for calculation
    row.querySelectorAll('.item-quantity, .item-price').forEach(input => {
        input.addEventListener('input', () => {
            updateItemTotal(row);
            calculateTotal();
        });
    });
    
    // Add event listener for remove button
    row.querySelector('.remove-item-btn').addEventListener('click', () => {
        row.remove();
        calculateTotal();
    });
}

function updateItemTotal(row) {
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const total = quantity * price;
    row.querySelector('.item-total').textContent = formatCurrency(total);
}

function calculateTotal() {
    let total = 0;
    
    document.querySelectorAll('.item-row').forEach(row => {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        total += quantity * price;
    });
    
    totalAmount.textContent = formatCurrency(total);
}

function saveCurrentEstimate() {
    // Get form data
    currentEstimate.title = document.getElementById('estimateTitle').value;
    currentEstimate.date = document.getElementById('estimateDate').value;
    currentEstimate.client = document.getElementById('estimateClient').value;
    currentEstimate.project = document.getElementById('estimateProject').value;
    
    // Validate
    if (!currentEstimate.title.trim()) {
        alert('Пожалуйста, введите название сметы');
        return;
    }
    
    // Get items
    currentEstimate.items = [];
    document.querySelectorAll('.item-row').forEach(row => {
        const description = row.querySelector('.item-description').value;
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const unit = row.querySelector('.item-unit').value;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        
        if (description.trim() || quantity > 0 || price > 0) {
            currentEstimate.items.push({
                description,
                quantity,
                unit,
                price
            });
        }
    });
    
    // Calculate total
    currentEstimate.total = currentEstimate.items.reduce((sum, item) => {
        return sum + (item.quantity * item.price);
    }, 0);
    
    // Save
    if (editingIndex >= 0) {
        estimates[editingIndex] = currentEstimate;
    } else {
        estimates.push(currentEstimate);
    }
    
    saveEstimates();
    
    alert('✅ Смета успешно сохранена!');
    showListView();
}

function exportEstimate() {
    window.print();
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 2
    }).format(amount);
}

// PWA Features
function initializePWAFeatures() {
    // Create offline indicator
    const offlineIndicator = document.createElement('div');
    offlineIndicator.className = 'offline-indicator';
    offlineIndicator.textContent = 'Нет подключения к интернету';
    document.body.appendChild(offlineIndicator);
    
    // Online/Offline detection
    window.addEventListener('online', () => {
        isOnline = true;
        offlineIndicator.classList.remove('visible');
        console.log('✓ Back online');
    });
    
    window.addEventListener('offline', () => {
        isOnline = false;
        offlineIndicator.classList.add('visible');
        console.log('✗ Gone offline');
    });
    
    // Show indicator if starting offline
    if (!isOnline) {
        offlineIndicator.classList.add('visible');
    }
    
    // Pull to refresh (mobile only)
    if (window.innerWidth <= 768) {
        initializePullToRefresh();
    }
    
    // Add haptic feedback support (for supported devices)
    if ('vibrate' in navigator) {
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', () => {
                navigator.vibrate(10); // Short vibration
            });
        });
    }
    
    // Prevent accidental navigation away
    window.addEventListener('beforeunload', (e) => {
        // Only warn if there's unsaved work
        if (currentEstimate && document.getElementById('editView').classList.contains('active')) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
    
    // Handle keyboard appearance on mobile
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                setTimeout(() => {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        });
    }
    
    console.log('✓ PWA features initialized');
}

function initializePullToRefresh() {
    const pullToRefreshEl = document.createElement('div');
    pullToRefreshEl.className = 'pull-to-refresh';
    pullToRefreshEl.innerHTML = '↓ Потяните для обновления';
    document.body.insertBefore(pullToRefreshEl, document.body.firstChild);
    
    let startY = 0;
    let currentY = 0;
    let pulling = false;
    
    document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
            startY = e.touches[0].pageY;
            pulling = true;
        }
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
        if (!pulling) return;
        
        currentY = e.touches[0].pageY;
        const pullDistance = currentY - startY;
        
        if (pullDistance > 0 && pullDistance < 100) {
            pullToRefreshEl.style.transform = `translateY(${pullDistance - 60}px)`;
            if (pullDistance > 60) {
                pullToRefreshEl.innerHTML = '↑ Отпустите для обновления';
            } else {
                pullToRefreshEl.innerHTML = '↓ Потяните для обновления';
            }
        }
    }, { passive: true });
    
    document.addEventListener('touchend', () => {
        if (!pulling) return;
        
        const pullDistance = currentY - startY;
        
        if (pullDistance > 60) {
            pullToRefreshEl.innerHTML = '⟳ Обновление...';
            pullToRefreshEl.classList.add('visible');
            
            // Refresh the data
            setTimeout(() => {
                renderEstimatesList();
                pullToRefreshEl.classList.remove('visible');
                pullToRefreshEl.style.transform = 'translateY(-100%)';
                
                // Haptic feedback
                if ('vibrate' in navigator) {
                    navigator.vibrate(50);
                }
            }, 1000);
        } else {
            pullToRefreshEl.style.transform = 'translateY(-100%)';
        }
        
        pulling = false;
        startY = 0;
        currentY = 0;
    }, { passive: true });
}

// Enhanced button feedback for mobile
if ('ontouchstart' in window) {
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.btn, .estimate-card').forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.transition = 'transform 0.1s';
                this.style.transform = 'scale(0.95)';
            }, { passive: true });
            
            element.addEventListener('touchend', function() {
                this.style.transform = 'scale(1)';
            }, { passive: true });
        });
    });
}

// Service Worker communication
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'UPDATE_AVAILABLE') {
            const updateBanner = document.createElement('div');
            updateBanner.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 15px 30px;
                border-radius: 30px;
                box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
                z-index: 10000;
                font-weight: 600;
                cursor: pointer;
            `;
            updateBanner.textContent = '🎉 Доступно обновление! Нажмите для установки';
            updateBanner.onclick = () => window.location.reload();
            document.body.appendChild(updateBanner);
        }
    });
}
