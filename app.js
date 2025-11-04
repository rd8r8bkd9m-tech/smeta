// Application State
let estimates = [];
let currentEstimate = null;
let editingIndex = -1;
let generatedEstimateData = null;

// Undo/Redo State
let undoStack = [];
let redoStack = [];
const MAX_UNDO_STACK = 50;

// Auto-save State
let autoSaveTimer = null;
let lastSavedState = null;

// Enterprise Features State
let templates = [];
let estimateHistory = {}; // version history for each estimate
let tags = [];
let currencies = ['RUB', 'USD', 'EUR'];
let currentCurrency = 'RUB';
let exchangeRates = { RUB: 1, USD: 93, EUR: 100 }; // RUB as base
let searchQuery = '';
let filterTags = [];
let sortBy = 'date'; // date, name, total
let sortOrder = 'desc'; // asc, desc

// Advanced Features State
let selectedEstimatesForComparison = []; // Multiple estimate comparison
let selectedEstimatesForBulk = []; // Bulk operations selection
let favorites = []; // Favorite estimates
let recentlyViewed = []; // Recently viewed estimates
let notifications = []; // System notifications

// Enterprise Configuration
const MAX_ESTIMATE_VERSIONS = 50; // Maximum number of versions to keep per estimate
const DEFAULT_CATEGORIES = [
  'Жилая недвижимость',
  'Коммерческая недвижимость',
  'Ландшафт',
  'Разное',
];
const MAX_RECENT_ITEMS = 10; // Maximum number of recently viewed items
const MAX_COMPARISON_ITEMS = 5; // Maximum estimates for comparison

// PWA State
let isOnline = navigator.onLine;
let touchStartY = 0;
let isPulling = false;

// Test API Key for development
const TEST_API_KEY = 'AIzaSyAb8RN6KlteMjDAglrWK7cJZBcFVZPaRnZ3dDUpmnhY8eRmXFBg';

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
  loadTemplates();
  loadTags();
  loadEstimateHistory();
  loadFavorites();
  loadRecentlyViewed();
  initializeEventListeners();
  renderEstimatesList();
  loadApiKey();
  initializePWAFeatures();
  initializeEnterpriseFeatures();
  initializeDarkMode();
  initializeAutoSave();
  loadDraft(); // Check for unsaved drafts
});

// Event Listeners
function initializeEventListeners() {
  // Main navigation
  document.getElementById('createWithAiBtn').addEventListener('click', showAiView);
  document.getElementById('createManualBtn').addEventListener('click', createNewEstimate);
  document.getElementById('backFromAiBtn').addEventListener('click', showListView);
  document.getElementById('backToListBtn').addEventListener('click', showListView);

  // Enterprise features
  document.getElementById('showDashboardBtn').addEventListener('click', showDashboard);
  document.getElementById('showTemplatesBtn').addEventListener('click', showTemplatesView);
  document.getElementById('compareEstimatesBtn').addEventListener('click', compareEstimates);
  document.getElementById('closeDashboardBtn').addEventListener('click', showListView);
  document.getElementById('closeTemplatesBtn').addEventListener('click', showListView);

  // Bulk operations
  document.getElementById('selectAllBtn').addEventListener('click', toggleSelectAll);
  document.getElementById('bulkDeleteBtn').addEventListener('click', bulkDelete);

  // Estimate actions
  document.getElementById('saveEstimateBtn').addEventListener('click', saveCurrentEstimate);
  document.getElementById('addItemBtn').addEventListener('click', addItemRow);
  document.getElementById('exportBtn').addEventListener('click', exportEstimate);
  document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
  document.getElementById('exportJsonBtn').addEventListener('click', exportToJSON);
  document.getElementById('saveAsTemplateBtn').addEventListener('click', saveAsTemplate);
  document.getElementById('duplicateEstimateBtn').addEventListener('click', duplicateEstimate);

  // Undo/Redo actions
  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('redoBtn').addEventListener('click', redo);

  // AI generation
  document.getElementById('generateEstimateBtn').addEventListener('click', generateEstimateWithAI);
  document.getElementById('acceptAiBtn').addEventListener('click', acceptGeneratedEstimate);
  document.getElementById('regenerateBtn').addEventListener('click', generateEstimateWithAI);

  // Search and filter
  document.getElementById('searchInput').addEventListener('input', e => {
    searchQuery = e.target.value;
    renderEstimatesList();
  });

  document.getElementById('sortBySelect').addEventListener('change', e => {
    sortBy = e.target.value;
    renderEstimatesList();
  });

  document.getElementById('sortOrderSelect').addEventListener('change', e => {
    sortOrder = e.target.value;
    renderEstimatesList();
  });

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
  } else {
    // Load test API key for development
    document.getElementById('aiApiKey').value = TEST_API_KEY;
  }
}

function saveApiKey() {
  const apiKey = document.getElementById('aiApiKey').value.trim();
  if (apiKey) {
    localStorage.setItem('gemini_api_key', apiKey);
  }
}

// Enterprise Storage Functions
function loadTemplates() {
  const stored = localStorage.getItem('estimate_templates');
  if (stored) {
    try {
      templates = JSON.parse(stored);
    } catch (e) {
      console.error('Error loading templates:', e);
      templates = [];
    }
  }
  // Initialize default templates if empty
  if (templates.length === 0) {
    templates = getDefaultTemplates();
    saveTemplates();
  }
}

function saveTemplates() {
  localStorage.setItem('estimate_templates', JSON.stringify(templates));
}

function loadTags() {
  const stored = localStorage.getItem('estimate_tags');
  if (stored) {
    try {
      tags = JSON.parse(stored);
    } catch (e) {
      console.error('Error loading tags:', e);
      tags = [];
    }
  }
}

function saveTags() {
  localStorage.setItem('estimate_tags', JSON.stringify(tags));
}

function loadEstimateHistory() {
  const stored = localStorage.getItem('estimate_history');
  if (stored) {
    try {
      estimateHistory = JSON.parse(stored);
    } catch (e) {
      console.error('Error loading history:', e);
      estimateHistory = {};
    }
  }
}

function saveEstimateHistory() {
  localStorage.setItem('estimate_history', JSON.stringify(estimateHistory));
}

// View Functions
function showListView() {
  listView.classList.add('active');
  editView.classList.remove('active');
  aiView.classList.remove('active');
  document.getElementById('dashboardView').classList.remove('active');
  document.getElementById('templatesView').classList.remove('active');
  renderEstimatesList();
}

function showEditView() {
  listView.classList.remove('active');
  editView.classList.add('active');
  aiView.classList.remove('active');
  document.getElementById('dashboardView').classList.remove('active');
  document.getElementById('templatesView').classList.remove('active');
}

function showAiView() {
  listView.classList.remove('active');
  editView.classList.remove('active');
  aiView.classList.add('active');
  document.getElementById('dashboardView').classList.remove('active');
  document.getElementById('templatesView').classList.remove('active');

  // Hide result if visible
  document.getElementById('aiResult').style.display = 'none';
  document.getElementById('aiStatus').style.display = 'none';
}

function showDashboard() {
  listView.classList.remove('active');
  editView.classList.remove('active');
  aiView.classList.remove('active');
  document.getElementById('dashboardView').classList.add('active');
  document.getElementById('templatesView').classList.remove('active');
  renderDashboard();
}

function showTemplatesView() {
  listView.classList.remove('active');
  editView.classList.remove('active');
  aiView.classList.remove('active');
  document.getElementById('dashboardView').classList.remove('active');
  document.getElementById('templatesView').classList.add('active');
  renderTemplates();
}

// Dashboard Rendering
function renderDashboard() {
  const stats = getStatistics();
  document.getElementById('statTotalEstimates').textContent = stats.totalEstimates;
  document.getElementById('statTotalValue').textContent = formatCurrency(stats.totalValue);
  document.getElementById('statAvgValue').textContent = formatCurrency(stats.avgValue);
  document.getElementById('statThisMonth').textContent = stats.thisMonth;

  // Add growth indicator if available
  const monthCard = document.querySelector('#statThisMonth').closest('.stat-card');
  if (monthCard && stats.recentGrowth !== 0) {
    const growthClass = stats.recentGrowth > 0 ? 'positive' : 'negative';
    const growthSymbol = stats.recentGrowth > 0 ? '↑' : '↓';
    monthCard.classList.add(stats.recentGrowth > 0 ? 'growth-positive' : 'growth-negative');

    let growthEl = monthCard.querySelector('.growth-indicator');
    if (!growthEl) {
      growthEl = document.createElement('div');
      growthEl.className = `growth-indicator ${growthClass}`;
      monthCard.appendChild(growthEl);
    }
    growthEl.textContent = `${growthSymbol} ${Math.abs(stats.recentGrowth).toFixed(1)}%`;
  }
}

// Templates Rendering
function renderTemplates() {
  const templatesList = document.getElementById('templatesList');

  if (templates.length === 0) {
    templatesList.innerHTML = '<div class="empty-state"><p>Нет доступных шаблонов</p></div>';
    return;
  }

  templatesList.innerHTML = templates
    .map(
      template => `
        <div class="template-card" data-template-id="${template.id}">
            <h3>${template.name}</h3>
            <p class="template-category">${template.category}</p>
            <p class="template-description">${template.description}</p>
            <p class="template-items">📋 ${template.items.length} позиций</p>
            <button class="btn btn-primary use-template-btn" data-template-id="${template.id}">
                ✨ Использовать шаблон
            </button>
        </div>
    `
    )
    .join('');

  // Add event listeners to template buttons
  document.querySelectorAll('.use-template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const templateId = btn.dataset.templateId;
      createFromTemplate(templateId);
    });
  });
}

function duplicateEstimate() {
  if (!currentEstimate) return;

  currentEstimate.title = (currentEstimate.title || 'Смета') + ' (копия)';
  currentEstimate.date = new Date().toISOString().split('T')[0];
  editingIndex = -1;

  alert('Создана копия сметы. Отредактируйте и сохраните.');
}

// AI Generation Functions
async function generateEstimateWithAI() {
  let apiKey = document.getElementById('aiApiKey').value.trim();
  const description = document.getElementById('aiDescription').value.trim();

  // Use test API key if no key is provided
  if (!apiKey) {
    apiKey = TEST_API_KEY;
    document.getElementById('aiApiKey').value = apiKey;
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
    const foremanAnalysis = await runForemanAgent(
      apiKey,
      description,
      chiefAnalysis,
      architectAnalysis
    );

    updateStatusText('📦 Снабженец подбирает материалы...');
    const materialsAnalysis = await runMaterialsAgent(
      apiKey,
      description,
      architectAnalysis,
      foremanAnalysis
    );

    updateStatusText('💰 Сметчик формирует итоговую смету...');
    const finalEstimate = await runEstimatorAgent(
      apiKey,
      description,
      chiefAnalysis,
      architectAnalysis,
      foremanAnalysis,
      materialsAnalysis
    );

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
    alert(
      'Ошибка при генерации сметы: ' +
        error.message +
        '\n\nПроверьте правильность API ключа и попробуйте снова.'
    );
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
async function runEstimatorAgent(
  apiKey,
  description,
  chiefAnalysis,
  architectAnalysis,
  foremanAnalysis,
  materialsAnalysis
) {
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
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
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
      if (
        error.message.includes('API key') ||
        error.message.includes('invalid') ||
        error.message.includes('network') ||
        error.message.includes('fetch')
      ) {
        throw error;
      }

      // Otherwise, try the next model
      continue;
    }
  }

  // If all models failed
  throw new Error(
    `Не удалось подключиться к API Gemini. Последняя ошибка: ${lastError}\n\nПроверьте:\n1. Правильность API ключа\n2. Активацию API ключа на https://makersuite.google.com/app/apikey\n3. Наличие интернет соединения`
  );
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

  const total = data.summary ? data.summary.grandTotal : materialsTotal + laborTotal;
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
    total: 0,
  };

  // Add materials
  if (generatedEstimateData.materials) {
    generatedEstimateData.materials.forEach(item => {
      currentEstimate.items.push({
        description: `[Материал] ${item.description}`,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
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
        price: item.price,
      });
    });
  }

  // Calculate total
  currentEstimate.total = currentEstimate.items.reduce((sum, item) => {
    return sum + item.quantity * item.price;
  }, 0);

  editingIndex = -1;
  loadEstimateToForm();
  showEditView();
}

// Estimate List Functions
function renderEstimatesList() {
  const filtered = filterEstimates();

  if (filtered.length === 0) {
    if (estimates.length === 0) {
      estimatesList.innerHTML = `
                <div class="empty-state">
                    <p>📄 Нет сохраненных смет</p>
                    <p class="help-text">Используйте ИИ для быстрого создания или создайте вручную</p>
                </div>
            `;
    } else {
      estimatesList.innerHTML = `
                <div class="empty-state">
                    <p>🔍 Ничего не найдено</p>
                    <p class="help-text">Попробуйте изменить параметры поиска</p>
                </div>
            `;
    }
    updateComparisonButton();
    return;
  }

  estimatesList.innerHTML = filtered
    .map((estimate, index) => {
      // Find original index for actions
      const originalIndex = estimates.indexOf(estimate);
      const estimateId = estimate.id || originalIndex;
      const isFavorite = favorites.includes(estimateId);
      const isSelectedForComparison = selectedEstimatesForComparison.includes(estimateId);
      const isSelectedForBulk = selectedEstimatesForBulk.includes(originalIndex);
      const isRecent = recentlyViewed.includes(estimateId);

      return `
        <div class="estimate-card" data-index="${originalIndex}">
            <div class="bulk-select-checkbox">
                <input type="checkbox" 
                       class="bulk-select" 
                       data-index="${originalIndex}" 
                       ${isSelectedForBulk ? 'checked' : ''}
                       title="Выбрать для операций">
            </div>
            <div class="comparison-checkbox">
                <input type="checkbox" 
                       class="compare-check" 
                       data-index="${originalIndex}" 
                       ${isSelectedForComparison ? 'checked' : ''}
                       title="Выбрать для сравнения">
            </div>
            <h3>
                ${estimate.title || 'Без названия'}
                <span class="favorite-star ${isFavorite ? 'active' : ''}" 
                      data-action="favorite" 
                      data-index="${originalIndex}"
                      title="${isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}">
                    ${isFavorite ? '⭐' : '☆'}
                </span>
                ${isRecent ? '<span class="recently-viewed-badge">Недавние</span>' : ''}
            </h3>
            <div class="estimate-card-info">
                <span>📅 ${estimate.date || 'Дата не указана'}</span>
                <span>👤 ${estimate.client || 'Клиент не указан'}</span>
                <span>📁 ${estimate.project || 'Проект не указан'}</span>
            </div>
            ${estimate.category ? `<div class="estimate-category">📂 ${estimate.category}</div>` : ''}
            ${estimate.tags && estimate.tags.length > 0 ? `<div class="estimate-tags">${estimate.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
            <div class="estimate-card-total">
                Итого: ${formatCurrency(estimate.total || 0)}
            </div>
            <div class="estimate-card-actions">
                <button class="btn btn-primary btn-small" data-action="edit" data-index="${originalIndex}">✏️ Редактировать</button>
                <button class="btn btn-secondary btn-small" data-action="duplicate" data-index="${originalIndex}">📋 Копировать</button>
                <button class="btn btn-danger btn-small" data-action="delete" data-index="${originalIndex}">🗑️ Удалить</button>
            </div>
        </div>
    `;
    })
    .join('');

  // Add click handlers to cards
  document.querySelectorAll('.estimate-card').forEach(card => {
    card.addEventListener('click', e => {
      // Check if it's a bulk checkbox
      if (e.target.classList.contains('bulk-select')) {
        e.stopPropagation();
        const index = parseInt(e.target.dataset.index);
        toggleBulkSelection(index);
        return;
      }

      // Check if it's a comparison checkbox
      if (e.target.classList.contains('compare-check')) {
        e.stopPropagation();
        const index = parseInt(e.target.dataset.index);
        toggleEstimateForComparison(index);
        return;
      }

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
        } else if (action === 'duplicate') {
          duplicateEstimateFromList(index);
        } else if (action === 'favorite') {
          toggleFavorite(index);
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
    total: 0,
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
    project:
      'Строительство многофункционального бизнес-комплекса с офисными, торговыми и жилыми зонами',
    items: [
      // Major infrastructure
      {
        description: '🏗️ [Работы] Подготовка территории и земляные работы (850 тыс. м³)',
        quantity: 850000,
        unit: 'м³',
        price: 4500,
      },
      {
        description: '🏗️ [Работы] Устройство фундамента и подземных уровней (5 уровней парковки)',
        quantity: 425000,
        unit: 'м³',
        price: 35000,
      },
      {
        description: '🏢 [Работы] Возведение несущих конструкций (башни высотой 350м)',
        quantity: 320000,
        unit: 'м²',
        price: 125000,
      },
      {
        description: '🏢 [Работы] Монтаж фасадных систем (стекло, алюминий, композиты)',
        quantity: 280000,
        unit: 'м²',
        price: 45000,
      },
      // Materials
      {
        description: '📦 [Материалы] Бетон высокопрочный M500-M600',
        quantity: 650000,
        unit: 'м³',
        price: 12000,
      },
      {
        description: '📦 [Материалы] Арматура класса A500C',
        quantity: 85000,
        unit: 'т',
        price: 65000,
      },
      {
        description: '📦 [Материалы] Металлоконструкции (колонны, балки)',
        quantity: 42000,
        unit: 'т',
        price: 95000,
      },
      {
        description: '📦 [Материалы] Стеклянные фасадные панели (энергоэффективные)',
        quantity: 280000,
        unit: 'м²',
        price: 18500,
      },
      // Engineering systems
      {
        description: '⚡ [Работы] Электроснабжение и освещение (трансформаторные подстанции)',
        quantity: 45,
        unit: 'шт',
        price: 28000000,
      },
      {
        description: '💧 [Работы] Системы водоснабжения и канализации',
        quantity: 850000,
        unit: 'м²',
        price: 3200,
      },
      {
        description: '❄️ [Работы] Системы вентиляции и кондиционирования',
        quantity: 850000,
        unit: 'м²',
        price: 4800,
      },
      {
        description: '🔥 [Работы] Противопожарные системы и сигнализация',
        quantity: 850000,
        unit: 'м²',
        price: 2100,
      },
      {
        description: '🚀 [Материалы] Лифтовое оборудование (120 высокоскоростных лифтов)',
        quantity: 120,
        unit: 'шт',
        price: 15000000,
      },
      {
        description: '🚀 [Материалы] Эскалаторы и травалаторы',
        quantity: 85,
        unit: 'шт',
        price: 4500000,
      },
      // Interior and finishing
      {
        description: '✨ [Работы] Внутренняя отделка офисных помещений премиум-класса',
        quantity: 480000,
        unit: 'м²',
        price: 28000,
      },
      {
        description: '✨ [Работы] Отделка торговых площадей',
        quantity: 120000,
        unit: 'м²',
        price: 35000,
      },
      {
        description: '✨ [Работы] Отделка жилых помещений класса "люкс"',
        quantity: 95000,
        unit: 'м²',
        price: 42000,
      },
      {
        description: '🎨 [Материалы] Натуральный камень для отделки (мрамор, гранит)',
        quantity: 45000,
        unit: 'м²',
        price: 25000,
      },
      // Smart building systems
      {
        description: '🤖 [Работы] Системы "Умный дом" и автоматизация здания (BMS)',
        quantity: 1,
        unit: 'шт',
        price: 850000000,
      },
      {
        description: '📡 [Работы] IT-инфраструктура и серверные',
        quantity: 1,
        unit: 'шт',
        price: 420000000,
      },
      {
        description: '🛡️ [Работы] Системы безопасности (видеонаблюдение, СКУД, охрана)',
        quantity: 1,
        unit: 'шт',
        price: 380000000,
      },
      // Landscaping and external works
      {
        description: '🌳 [Работы] Благоустройство территории (25 га)',
        quantity: 250000,
        unit: 'м²',
        price: 8500,
      },
      {
        description: '🚗 [Работы] Устройство дорог, парковок и подъездных путей',
        quantity: 85000,
        unit: 'м²',
        price: 12000,
      },
      {
        description: '💡 [Работы] Наружное освещение и малые архитектурные формы',
        quantity: 1,
        unit: 'шт',
        price: 180000000,
      },
      // Project management and design
      {
        description: '📋 [Работы] Проектно-изыскательские работы',
        quantity: 1,
        unit: 'шт',
        price: 950000000,
      },
      {
        description: '👷 [Работы] Генподрядные и управленческие услуги',
        quantity: 1,
        unit: 'шт',
        price: 1850000000,
      },
      {
        description: '✅ [Работы] Авторский надзор и технический контроль',
        quantity: 1,
        unit: 'шт',
        price: 420000000,
      },
    ],
    total: 0,
  };

  // Calculate total
  currentEstimate.total = currentEstimate.items.reduce((sum, item) => {
    return sum + item.quantity * item.price;
  }, 0);

  editingIndex = -1;
  loadEstimateToForm();
  showEditView();

  // Show success message
  setTimeout(() => {
    alert(
      `✨ Создан демонстрационный мегапроект!\n\n` +
        `💎 Стоимость: ${formatCurrency(currentEstimate.total)}\n\n` +
        `📊 Позиций: ${currentEstimate.items.length}\n\n` +
        `🏗️ Масштаб: Международный бизнес-комплекс с офисными, торговыми и жилыми зонами\n\n` +
        `Это демонстрация возможностей приложения для работы с крупнейшими проектами!`
    );
  }, 500);
}

function editEstimate(index) {
  currentEstimate = JSON.parse(JSON.stringify(estimates[index])); // Deep copy
  editingIndex = index;
  addToRecentlyViewed(index); // Track recently viewed
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

function duplicateEstimateFromList(index) {
  const original = estimates[index];
  const duplicate = JSON.parse(JSON.stringify(original)); // Deep copy
  duplicate.title = (duplicate.title || 'Смета') + ' (копия)';
  duplicate.date = new Date().toISOString().split('T')[0];
  delete duplicate.id; // Remove ID so it gets a new one

  estimates.push(duplicate);
  saveEstimates();
  renderEstimatesList();

  alert('✅ Смета скопирована!');
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
    price: 0,
  };

  const itemId = Date.now() + Math.random();
  const row = document.createElement('div');
  row.className = 'item-row';
  row.dataset.itemId = itemId;
  row.draggable = true; // Enable drag and drop

  row.innerHTML = `
        <div class="drag-handle" title="Перетащите для изменения порядка">⋮⋮</div>
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

  // Setup drag and drop
  setupDragAndDrop(row);

  // Add event listeners for calculation
  row
    .querySelectorAll('.item-quantity, .item-price, .item-description, .item-unit')
    .forEach(input => {
      input.addEventListener('input', () => {
        updateItemTotal(row);
        calculateTotal();
        // Trigger auto-save on change
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(autoSaveEstimate, 2000); // Auto-save after 2s of inactivity
      });

      // Save state for undo on focus out
      input.addEventListener('blur', () => {
        saveStateToUndo();
      });
    });

  // Add event listener for remove button
  row.querySelector('.remove-item-btn').addEventListener('click', () => {
    saveStateToUndo(); // Save state before removing
    row.remove();
    calculateTotal();
  });
}

// Drag and Drop Functionality
let draggedElement = null;

function setupDragAndDrop(row) {
  row.addEventListener('dragstart', handleDragStart);
  row.addEventListener('dragend', handleDragEnd);
  row.addEventListener('dragover', handleDragOver);
  row.addEventListener('drop', handleDrop);
  row.addEventListener('dragenter', handleDragEnter);
  row.addEventListener('dragleave', handleDragLeave);
}

function handleDragStart(e) {
  const element = e.currentTarget;
  draggedElement = element;
  element.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', element.innerHTML);

  // Haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

function handleDragEnd(e) {
  this.classList.remove('dragging');

  // Remove all drag-over classes
  document.querySelectorAll('.item-row').forEach(row => {
    row.classList.remove('drag-over');
  });

  draggedElement = null;

  // Save state after reordering
  saveStateToUndo();

  // Haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  if (this !== draggedElement) {
    this.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  if (draggedElement !== this) {
    // Get the parent container
    const container = this.parentNode;

    // Determine drop position
    const allRows = Array.from(container.querySelectorAll('.item-row'));
    const draggedIndex = allRows.indexOf(draggedElement);
    const droppedIndex = allRows.indexOf(this);

    if (draggedIndex < droppedIndex) {
      // Moving down
      container.insertBefore(draggedElement, this.nextSibling);
    } else {
      // Moving up
      container.insertBefore(draggedElement, this);
    }
  }

  return false;
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
        price,
      });
    }
  });

  // Calculate total
  currentEstimate.total = currentEstimate.items.reduce((sum, item) => {
    return sum + item.quantity * item.price;
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
  // Enhanced print with custom styling
  const printWindow = window.open('', '_blank');
  const estimate = currentEstimate;

  if (!estimate) {
    alert('Нет сметы для экспорта');
    return;
  }

  // Generate professional HTML for printing
  const printContent = generatePrintHTML(estimate);

  printWindow.document.write(printContent);
  printWindow.document.close();

  // Trigger print after content loads
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

function generatePrintHTML(estimate) {
  const itemsHTML = estimate.items
    .map((item, index) => {
      const total = item.quantity * item.price;
      return `
            <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${item.description}</td>
                <td style="text-align: center;">${item.unit}</td>
                <td style="text-align: right;">${formatNumber(item.quantity)}</td>
                <td style="text-align: right;">${formatCurrency(item.price)}</td>
                <td style="text-align: right; font-weight: 600;">${formatCurrency(total)}</td>
            </tr>
        `;
    })
    .join('');

  const grandTotal = estimate.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const currentDate = new Date().toLocaleDateString('ru-RU');

  return `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>${estimate.title || 'Смета'}</title>
            <style>
                @media print {
                    @page { margin: 2cm; }
                    body { margin: 0; }
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    color: #333;
                    line-height: 1.6;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #3b82f6;
                }
                
                .header h1 {
                    color: #3b82f6;
                    margin: 0 0 10px 0;
                    font-size: 28px;
                }
                
                .header-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    text-align: left;
                    margin: 30px 0;
                    padding: 20px;
                    background: #f8fafc;
                    border-radius: 8px;
                }
                
                .info-item {
                    margin: 5px 0;
                }
                
                .info-label {
                    font-weight: 600;
                    color: #64748b;
                    display: inline-block;
                    min-width: 100px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                th {
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 14px;
                }
                
                td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #e2e8f0;
                }
                
                tr:nth-child(even) {
                    background: #f8fafc;
                }
                
                tr:hover {
                    background: #f1f5f9;
                }
                
                .total-section {
                    margin-top: 30px;
                    text-align: right;
                }
                
                .total-row {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 20px;
                    padding: 15px 20px;
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
                    border-radius: 8px;
                    margin: 10px 0;
                }
                
                .total-label {
                    font-size: 18px;
                    font-weight: 600;
                    color: #475569;
                }
                
                .total-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: #3b82f6;
                }
                
                .footer {
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 2px solid #e2e8f0;
                    text-align: center;
                    color: #64748b;
                    font-size: 12px;
                }
                
                .signature-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 40px;
                    margin-top: 60px;
                }
                
                .signature-line {
                    border-bottom: 1px solid #333;
                    padding-bottom: 5px;
                    margin-bottom: 10px;
                    min-width: 200px;
                }
                
                .signature-label {
                    font-size: 12px;
                    color: #64748b;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📋 СМЕТА</h1>
                <h2>${estimate.title || 'Без названия'}</h2>
            </div>
            
            <div class="header-info">
                <div>
                    <div class="info-item">
                        <span class="info-label">Дата:</span> ${estimate.date || currentDate}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Клиент:</span> ${estimate.client || 'Не указан'}
                    </div>
                </div>
                <div>
                    <div class="info-item">
                        <span class="info-label">Проект:</span> ${estimate.project || 'Не указан'}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Печать:</span> ${currentDate}
                    </div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th style="width: 50px;">№</th>
                        <th>Наименование работ/материалов</th>
                        <th style="width: 80px; text-align: center;">Ед.</th>
                        <th style="width: 100px; text-align: right;">Кол-во</th>
                        <th style="width: 120px; text-align: right;">Цена</th>
                        <th style="width: 140px; text-align: right;">Сумма</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
            
            <div class="total-section">
                <div class="total-row">
                    <span class="total-label">ИТОГО:</span>
                    <span class="total-value">${formatCurrency(grandTotal)}</span>
                </div>
            </div>
            
            <div class="signature-section">
                <div>
                    <div>Исполнитель:</div>
                    <div class="signature-line"></div>
                    <div class="signature-label">Подпись / Расшифровка</div>
                </div>
                <div>
                    <div>Заказчик:</div>
                    <div class="signature-line"></div>
                    <div class="signature-label">Подпись / Расшифровка</div>
                </div>
            </div>
            
            <div class="footer">
                <p>Сформировано в приложении "Смета" © 2025</p>
                <p>Документ является коммерческим предложением и требует подписания сторонами</p>
            </div>
        </body>
        </html>
    `;
}

function formatNumber(num) {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

// Enterprise Features Functions
function getDefaultTemplates() {
  return [
    {
      id: 'apartment-renovation',
      name: '🏠 Ремонт квартиры (типовой)',
      description: 'Стандартный ремонт 2-комнатной квартиры 50-60м²',
      category: 'Жилая недвижимость',
      items: [
        { description: 'Демонтаж старых покрытий', quantity: 60, unit: 'м²', price: 350 },
        { description: 'Выравнивание стен штукатуркой', quantity: 120, unit: 'м²', price: 650 },
        { description: 'Шпаклевка стен под покраску', quantity: 120, unit: 'м²', price: 280 },
        { description: 'Покраска стен (2 слоя)', quantity: 120, unit: 'м²', price: 420 },
        { description: 'Укладка ламината', quantity: 40, unit: 'м²', price: 850 },
        { description: 'Укладка плитки (ванная, кухня)', quantity: 20, unit: 'м²', price: 1450 },
        { description: 'Установка натяжного потолка', quantity: 60, unit: 'м²', price: 650 },
        { description: 'Электромонтажные работы', quantity: 1, unit: 'шт', price: 45000 },
        { description: 'Сантехнические работы', quantity: 1, unit: 'шт', price: 35000 },
      ],
    },
    {
      id: 'office-construction',
      name: '🏢 Строительство офиса',
      description: 'Строительство офисного помещения 200-300м²',
      category: 'Коммерческая недвижимость',
      items: [
        { description: 'Возведение каркаса', quantity: 250, unit: 'м²', price: 8500 },
        { description: 'Устройство перегородок', quantity: 150, unit: 'м²', price: 1850 },
        { description: 'Отделка офисных помещений', quantity: 250, unit: 'м²', price: 3200 },
        { description: 'Устройство подвесного потолка', quantity: 250, unit: 'м²', price: 1650 },
        { description: 'Напольное покрытие (ковролин)', quantity: 250, unit: 'м²', price: 1200 },
        { description: 'Системы вентиляции', quantity: 250, unit: 'м²', price: 2800 },
        { description: 'Электроснабжение офиса', quantity: 1, unit: 'шт', price: 450000 },
        { description: 'Системы пожарной безопасности', quantity: 250, unit: 'м²', price: 850 },
        { description: 'Слаботочные системы', quantity: 1, unit: 'шт', price: 280000 },
      ],
    },
    {
      id: 'house-construction',
      name: '🏡 Строительство дома',
      description: 'Строительство частного дома 150-200м²',
      category: 'Жилая недвижимость',
      items: [
        { description: 'Земляные работы', quantity: 80, unit: 'м³', price: 1200 },
        { description: 'Устройство фундамента', quantity: 60, unit: 'м³', price: 18000 },
        { description: 'Возведение стен (кирпич)', quantity: 300, unit: 'м²', price: 4500 },
        { description: 'Устройство перекрытий', quantity: 180, unit: 'м²', price: 5200 },
        { description: 'Кровельные работы', quantity: 200, unit: 'м²', price: 2800 },
        { description: 'Утепление фасада', quantity: 250, unit: 'м²', price: 1650 },
        { description: 'Отделка фасада (штукатурка)', quantity: 250, unit: 'м²', price: 1850 },
        { description: 'Окна ПВХ', quantity: 25, unit: 'м²', price: 8500 },
        { description: 'Внутренняя отделка', quantity: 180, unit: 'м²', price: 4200 },
        { description: 'Инженерные системы', quantity: 1, unit: 'шт', price: 650000 },
      ],
    },
    {
      id: 'shop-renovation',
      name: '🏪 Ремонт магазина',
      description: 'Ремонт торгового помещения 100-150м²',
      category: 'Коммерческая недвижимость',
      items: [
        { description: 'Демонтаж старой отделки', quantity: 120, unit: 'м²', price: 450 },
        { description: 'Выравнивание стен', quantity: 200, unit: 'м²', price: 680 },
        { description: 'Покраска стен', quantity: 200, unit: 'м²', price: 380 },
        {
          description: 'Напольное покрытие (коммерческий линолеум)',
          quantity: 120,
          unit: 'м²',
          price: 1450,
        },
        { description: 'Подвесной потолок Armstrong', quantity: 120, unit: 'м²', price: 1250 },
        { description: 'Освещение торгового зала', quantity: 120, unit: 'м²', price: 1850 },
        { description: 'Витрины и стеллажи', quantity: 1, unit: 'шт', price: 280000 },
        {
          description: 'Системы безопасности и видеонаблюдения',
          quantity: 1,
          unit: 'шт',
          price: 120000,
        },
      ],
    },
    {
      id: 'landscape-design',
      name: '🌳 Благоустройство территории',
      description: 'Благоустройство участка 10-15 соток',
      category: 'Ландшафт',
      items: [
        { description: 'Планировка территории', quantity: 1200, unit: 'м²', price: 280 },
        {
          description: 'Устройство дорожек (тротуарная плитка)',
          quantity: 80,
          unit: 'м²',
          price: 2800,
        },
        { description: 'Установка бордюров', quantity: 120, unit: 'м', price: 650 },
        { description: 'Посев газона', quantity: 800, unit: 'м²', price: 380 },
        { description: 'Посадка деревьев', quantity: 15, unit: 'шт', price: 8500 },
        { description: 'Посадка кустарников', quantity: 40, unit: 'шт', price: 2200 },
        { description: 'Устройство цветников', quantity: 50, unit: 'м²', price: 1850 },
        { description: 'Система автополива', quantity: 1, unit: 'шт', price: 180000 },
        { description: 'Наружное освещение', quantity: 20, unit: 'шт', price: 12000 },
        { description: 'Малые архитектурные формы', quantity: 1, unit: 'шт', price: 95000 },
      ],
    },
  ];
}

function initializeEnterpriseFeatures() {
  console.log('✓ Enterprise features initialized');
  console.log(`  - Templates loaded: ${templates.length}`);
  console.log(`  - Tags loaded: ${tags.length}`);
  console.log(`  - Currencies: ${currencies.join(', ')}`);
}

// Advanced Export Functions
function exportToExcel() {
  if (!currentEstimate) return;

  // Enhanced CSV with better formatting and metadata
  const currentDate = new Date().toLocaleDateString('ru-RU');
  let csvContent = `СМЕТА\n`;
  csvContent += `Название:,"${currentEstimate.title || 'Без названия'}"\n`;
  csvContent += `Дата:,${currentEstimate.date || currentDate}\n`;
  csvContent += `Клиент:,"${currentEstimate.client || 'Не указан'}"\n`;
  csvContent += `Проект:,"${currentEstimate.project || 'Не указан'}"\n`;
  csvContent += `\n`;
  csvContent += `№,Наименование,Единица,Количество,Цена за ед.,Сумма\n`;

  currentEstimate.items.forEach((item, index) => {
    const total = item.quantity * item.price;
    csvContent += `${index + 1},"${item.description}","${item.unit}",${item.quantity},${item.price},${total}\n`;
  });

  csvContent += `\n`;
  csvContent += `ИТОГО:,,,,,${currentEstimate.total}\n`;
  csvContent += `\n`;
  csvContent += `Сформировано:,${currentDate}\n`;
  csvContent += `Приложение:,Смета © 2025\n`;

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const filename = `${(currentEstimate.title || 'smeta').replace(/[^a-zа-я0-9]/gi, '_')}_${new Date().getTime()}.csv`;
  link.download = filename;
  link.click();

  // Show success notification
  showNotification('✅ Excel файл успешно экспортирован', 'success');
}

function exportToJSON() {
  if (!currentEstimate) return;

  // Enhanced JSON with metadata
  const exportData = {
    ...currentEstimate,
    exported_at: new Date().toISOString(),
    exported_by: 'Смета App v1.0',
    format_version: '1.0',
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const filename = `${(currentEstimate.title || 'smeta').replace(/[^a-zа-я0-9]/gi, '_')}_${new Date().getTime()}.json`;
  link.download = filename;
  link.click();

  // Show success notification
  showNotification('✅ JSON файл успешно экспортирован', 'success');
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('visible');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('visible');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Template Functions
function createFromTemplate(templateId) {
  const template = templates.find(t => t.id === templateId);
  if (!template) return;

  currentEstimate = {
    title: template.name,
    date: new Date().toISOString().split('T')[0],
    client: '',
    project: '',
    items: JSON.parse(JSON.stringify(template.items)), // Deep copy
    total: 0,
    category: template.category,
    tags: [],
  };

  // Calculate total
  currentEstimate.total = currentEstimate.items.reduce((sum, item) => {
    return sum + item.quantity * item.price;
  }, 0);

  editingIndex = -1;
  loadEstimateToForm();
  showEditView();
}

function saveAsTemplate() {
  if (!currentEstimate || !currentEstimate.items || currentEstimate.items.length === 0) {
    alert('Нет позиций для сохранения как шаблон');
    return;
  }

  const name = prompt('Введите название шаблона:', currentEstimate.title);
  if (!name) return;

  const description = prompt('Введите описание шаблона (необязательно):');
  const category = prompt(
    'Введите категорию (Жилая недвижимость, Коммерческая недвижимость, Ландшафт):'
  );

  const template = {
    id: 'custom-' + Date.now(),
    name: name,
    description: description || '',
    category: category || 'Разное',
    items: JSON.parse(JSON.stringify(currentEstimate.items)), // Deep copy
  };

  templates.push(template);
  saveTemplates();
  alert('✅ Шаблон сохранен!');
}

// Search and Filter Functions
function filterEstimates() {
  let filtered = [...estimates];

  // Apply search
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      est =>
        (est.title && est.title.toLowerCase().includes(query)) ||
        (est.client && est.client.toLowerCase().includes(query)) ||
        (est.project && est.project.toLowerCase().includes(query))
    );
  }

  // Apply tag filter
  if (filterTags.length > 0) {
    filtered = filtered.filter(est => est.tags && est.tags.some(tag => filterTags.includes(tag)));
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = (a.title || '').localeCompare(b.title || '');
        break;
      case 'total':
        comparison = (a.total || 0) - (b.total || 0);
        break;
      case 'date':
      default:
        comparison = new Date(a.date || 0) - new Date(b.date || 0);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return filtered;
}

// Version History Functions
function saveVersion(estimateId) {
  if (!estimateId) return;

  if (!estimateHistory[estimateId]) {
    estimateHistory[estimateId] = [];
  }

  const estimate = estimates.find(e => e.id === estimateId);
  if (!estimate) return;

  estimateHistory[estimateId].push({
    timestamp: new Date().toISOString(),
    data: JSON.parse(JSON.stringify(estimate)),
    user: 'Текущий пользователь',
  });

  // Keep only last MAX_ESTIMATE_VERSIONS versions
  if (estimateHistory[estimateId].length > MAX_ESTIMATE_VERSIONS) {
    estimateHistory[estimateId] = estimateHistory[estimateId].slice(-MAX_ESTIMATE_VERSIONS);
  }

  saveEstimateHistory();
}

// Dashboard Statistics
function getStatistics() {
  const stats = {
    totalEstimates: estimates.length,
    totalValue: estimates.reduce((sum, est) => sum + (est.total || 0), 0),
    avgValue: 0,
    thisMonth: 0,
    thisMonthValue: 0,
    byCategory: {},
    recentGrowth: 0,
  };

  stats.avgValue = stats.totalEstimates > 0 ? stats.totalValue / stats.totalEstimates : 0;

  const now = new Date();
  const thisMonth = estimates.filter(est => {
    const estDate = new Date(est.date);
    return estDate.getMonth() === now.getMonth() && estDate.getFullYear() === now.getFullYear();
  });

  stats.thisMonth = thisMonth.length;
  stats.thisMonthValue = thisMonth.reduce((sum, est) => sum + (est.total || 0), 0);

  // Calculate by category
  estimates.forEach(est => {
    const cat = est.category || 'Разное';
    if (!stats.byCategory[cat]) {
      stats.byCategory[cat] = { count: 0, value: 0 };
    }
    stats.byCategory[cat].count++;
    stats.byCategory[cat].value += est.total || 0;
  });

  // Calculate growth
  const lastMonth = estimates.filter(est => {
    const estDate = new Date(est.date);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return (
      estDate.getMonth() === lastMonthDate.getMonth() &&
      estDate.getFullYear() === lastMonthDate.getFullYear()
    );
  });

  const lastMonthValue = lastMonth.reduce((sum, est) => sum + (est.total || 0), 0);
  if (lastMonthValue > 0) {
    stats.recentGrowth = ((stats.thisMonthValue - lastMonthValue) / lastMonthValue) * 100;
  }

  return stats;
}

// Comparison Functions
function toggleEstimateForComparison(index) {
  const estimateId = estimates[index].id || index;
  const idx = selectedEstimatesForComparison.indexOf(estimateId);

  if (idx > -1) {
    selectedEstimatesForComparison.splice(idx, 1);
  } else {
    if (selectedEstimatesForComparison.length < MAX_COMPARISON_ITEMS) {
      selectedEstimatesForComparison.push(estimateId);
    } else {
      alert(`Можно сравнить максимум ${MAX_COMPARISON_ITEMS} смет одновременно`);
      return;
    }
  }

  renderEstimatesList();
  updateComparisonButton();
}

function updateComparisonButton() {
  const btn = document.getElementById('compareEstimatesBtn');
  if (btn) {
    if (selectedEstimatesForComparison.length >= 2) {
      btn.disabled = false;
      btn.textContent = `🔍 Сравнить (${selectedEstimatesForComparison.length})`;
    } else {
      btn.disabled = true;
      btn.textContent = '🔍 Сравнить (выберите минимум 2)';
    }
  }
}

function compareEstimates() {
  if (selectedEstimatesForComparison.length < 2) {
    alert('Выберите минимум 2 сметы для сравнения');
    return;
  }

  const selectedEstimates = selectedEstimatesForComparison
    .map(id => estimates.find((e, i) => (e.id || i) === id))
    .filter(e => e);

  showComparisonView(selectedEstimates);
}

function showComparisonView(estimatesToCompare) {
  // Hide other views
  listView.classList.remove('active');
  editView.classList.remove('active');
  aiView.classList.remove('active');
  document.getElementById('dashboardView').classList.remove('active');
  document.getElementById('templatesView').classList.remove('active');

  // Show comparison view
  let comparisonView = document.getElementById('comparisonView');
  if (!comparisonView) {
    comparisonView = document.createElement('div');
    comparisonView.id = 'comparisonView';
    comparisonView.className = 'view';
    document.querySelector('#app').appendChild(comparisonView);
  }

  comparisonView.classList.add('active');
  renderComparison(estimatesToCompare);
}

function renderComparison(estimatesToCompare) {
  const comparisonView = document.getElementById('comparisonView');

  let html = `
        <div class="comparison-header">
            <h2>📊 Сравнение смет</h2>
            <button id="closeComparisonBtn" class="btn btn-secondary">← Назад к списку</button>
        </div>
        
        <div class="comparison-grid">
            <div class="comparison-table">
                <table>
                    <thead>
                        <tr>
                            <th>Параметр</th>
                            ${estimatesToCompare.map(est => `<th>${est.title || 'Без названия'}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Дата</strong></td>
                            ${estimatesToCompare.map(est => `<td>${est.date || '-'}</td>`).join('')}
                        </tr>
                        <tr>
                            <td><strong>Клиент</strong></td>
                            ${estimatesToCompare.map(est => `<td>${est.client || '-'}</td>`).join('')}
                        </tr>
                        <tr>
                            <td><strong>Проект</strong></td>
                            ${estimatesToCompare.map(est => `<td>${est.project || '-'}</td>`).join('')}
                        </tr>
                        <tr>
                            <td><strong>Категория</strong></td>
                            ${estimatesToCompare.map(est => `<td>${est.category || '-'}</td>`).join('')}
                        </tr>
                        <tr>
                            <td><strong>Количество позиций</strong></td>
                            ${estimatesToCompare.map(est => `<td>${est.items ? est.items.length : 0}</td>`).join('')}
                        </tr>
                        <tr class="highlight-row">
                            <td><strong>Итоговая стоимость</strong></td>
                            ${estimatesToCompare.map(est => `<td><strong>${formatCurrency(est.total || 0)}</strong></td>`).join('')}
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="comparison-summary">
                <h3>Сводка сравнения</h3>
                <div class="summary-cards">
                    <div class="summary-card">
                        <div class="summary-label">Самая дорогая</div>
                        <div class="summary-value">${formatCurrency(Math.max(...estimatesToCompare.map(e => e.total || 0)))}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Самая дешевая</div>
                        <div class="summary-value">${formatCurrency(Math.min(...estimatesToCompare.map(e => e.total || 0)))}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Средняя</div>
                        <div class="summary-value">${formatCurrency(estimatesToCompare.reduce((sum, e) => sum + (e.total || 0), 0) / estimatesToCompare.length)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Разница</div>
                        <div class="summary-value">${formatCurrency(Math.max(...estimatesToCompare.map(e => e.total || 0)) - Math.min(...estimatesToCompare.map(e => e.total || 0)))}</div>
                    </div>
                </div>
            </div>
        </div>
    `;

  comparisonView.innerHTML = html;

  // Add event listener
  document.getElementById('closeComparisonBtn').addEventListener('click', () => {
    comparisonView.classList.remove('active');
    selectedEstimatesForComparison = [];
    showListView();
  });
}

// Favorites Management
function toggleFavorite(index) {
  const estimateId = estimates[index].id || index;
  const idx = favorites.indexOf(estimateId);

  if (idx > -1) {
    favorites.splice(idx, 1);
  } else {
    favorites.push(estimateId);
  }

  saveFavorites();
  renderEstimatesList();
}

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function loadFavorites() {
  const stored = localStorage.getItem('favorites');
  if (stored) {
    try {
      favorites = JSON.parse(stored);
    } catch (e) {
      favorites = [];
    }
  }
}

// Recently Viewed Management
function addToRecentlyViewed(index) {
  const estimateId = estimates[index].id || index;

  // Remove if already in list
  const idx = recentlyViewed.indexOf(estimateId);
  if (idx > -1) {
    recentlyViewed.splice(idx, 1);
  }

  // Add to beginning
  recentlyViewed.unshift(estimateId);

  // Keep only MAX_RECENT_ITEMS
  if (recentlyViewed.length > MAX_RECENT_ITEMS) {
    recentlyViewed = recentlyViewed.slice(0, MAX_RECENT_ITEMS);
  }

  saveRecentlyViewed();
}

function saveRecentlyViewed() {
  localStorage.setItem('recently_viewed', JSON.stringify(recentlyViewed));
}

function loadRecentlyViewed() {
  const stored = localStorage.getItem('recently_viewed');
  if (stored) {
    try {
      recentlyViewed = JSON.parse(stored);
    } catch (e) {
      recentlyViewed = [];
    }
  }
}

// Advanced Export with customization
function exportToPDF() {
  if (!currentEstimate) return;

  // Use browser's print with enhanced styling
  const originalTitle = document.title;
  document.title = currentEstimate.title || 'Смета';

  // Add print-specific styles
  const printStyle = document.createElement('style');
  printStyle.id = 'print-styles';
  printStyle.textContent = `
        @media print {
            body { background: white !important; }
            .toolbar { display: none !important; }
            header, footer { display: none !important; }
            .estimate-form { box-shadow: none !important; }
        }
    `;
  document.head.appendChild(printStyle);

  window.print();

  // Cleanup
  document.title = originalTitle;
  const style = document.getElementById('print-styles');
  if (style) style.remove();
}

// Utility Functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
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
  window.addEventListener('beforeunload', e => {
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

  // Initialize keyboard shortcuts
  initializeKeyboardShortcuts();

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

  document.addEventListener(
    'touchstart',
    e => {
      if (window.scrollY === 0) {
        startY = e.touches[0].pageY;
        pulling = true;
      }
    },
    { passive: true }
  );

  document.addEventListener(
    'touchmove',
    e => {
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
    },
    { passive: true }
  );

  document.addEventListener(
    'touchend',
    () => {
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
    },
    { passive: true }
  );
}

// Enhanced button feedback for mobile
if ('ontouchstart' in window) {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.btn, .estimate-card').forEach(element => {
      element.addEventListener(
        'touchstart',
        function () {
          this.style.transition = 'transform 0.1s';
          this.style.transform = 'scale(0.95)';
        },
        { passive: true }
      );

      element.addEventListener(
        'touchend',
        function () {
          this.style.transform = 'scale(1)';
        },
        { passive: true }
      );
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

// Keyboard Shortcuts
function initializeKeyboardShortcuts() {
  // Add event listeners for shortcuts modal
  const shortcutsBtn = document.getElementById('keyboardShortcutsBtn');
  const shortcutsModal = document.getElementById('shortcutsModal');
  const shortcutsClose = document.getElementById('shortcutsClose');

  if (shortcutsBtn && shortcutsModal) {
    shortcutsBtn.addEventListener('click', () => {
      shortcutsModal.style.display = 'flex';
    });
  }

  if (shortcutsClose && shortcutsModal) {
    shortcutsClose.addEventListener('click', () => {
      shortcutsModal.style.display = 'none';
    });

    // Close on outside click
    shortcutsModal.addEventListener('click', e => {
      if (e.target === shortcutsModal) {
        shortcutsModal.style.display = 'none';
      }
    });
  }

  document.addEventListener('keydown', e => {
    // Check if user is typing in an input field
    const isTyping = isUserTyping(e.target);

    const isMac = detectMacPlatform();
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

    // ?: Show keyboard shortcuts
    if (e.key === '?' && !isTyping) {
      e.preventDefault();
      if (shortcutsModal) {
        shortcutsModal.style.display = 'flex';
      }
    }

    // Escape: Close shortcuts modal if open
    if (e.key === 'Escape' && shortcutsModal && shortcutsModal.style.display === 'flex') {
      shortcutsModal.style.display = 'none';
      return;
    }

    // Ctrl/Cmd + Z: Undo
    if (ctrlKey && e.key === 'z' && !isTyping) {
      e.preventDefault();
      if (editView.classList.contains('active')) {
        undo();
      }
    }

    // Ctrl/Cmd + Y: Redo
    if (ctrlKey && e.key === 'y' && !isTyping) {
      e.preventDefault();
      if (editView.classList.contains('active')) {
        redo();
      }
    }

    // Ctrl/Cmd + N: New estimate
    if (ctrlKey && e.key === 'n' && !isTyping) {
      e.preventDefault();
      document.getElementById('createManualBtn')?.click();
    }

    // Ctrl/Cmd + S: Save estimate
    if (ctrlKey && e.key === 's') {
      e.preventDefault();
      const saveBtn = document.getElementById('saveEstimateBtn');
      if (saveBtn && editView.classList.contains('active')) {
        saveBtn.click();
      }
    }

    // Ctrl/Cmd + D: Toggle dark mode
    if (ctrlKey && e.key === 'd' && !isTyping) {
      e.preventDefault();
      toggleTheme();
    }

    // Ctrl/Cmd + F: Focus search
    if (ctrlKey && e.key === 'f' && !isTyping) {
      e.preventDefault();
      const searchInput = document.getElementById('searchInput');
      if (searchInput && listView.classList.contains('active')) {
        searchInput.focus();
      }
    }

    // Escape: Close modals / Return to list
    if (e.key === 'Escape') {
      if (
        editView.classList.contains('active') ||
        aiView.classList.contains('active') ||
        document.getElementById('dashboardView').classList.contains('active') ||
        document.getElementById('templatesView').classList.contains('active')
      ) {
        showListView();
      }
    }

    // Ctrl/Cmd + P: Print/Export (when in edit view)
    if (ctrlKey && e.key === 'p') {
      e.preventDefault();
      if (editView.classList.contains('active')) {
        exportEstimate();
      }
    }

    // Ctrl/Cmd + K: Open AI generator
    if (ctrlKey && e.key === 'k' && !isTyping) {
      e.preventDefault();
      document.getElementById('createWithAiBtn')?.click();
    }
  });

  console.log('✓ Keyboard shortcuts initialized');
}

// Helper function to detect if user is typing
function isUserTyping(target) {
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

// Helper function to detect Mac platform with modern API
function detectMacPlatform() {
  // Use modern API with fallback
  if (navigator.userAgentData?.platform) {
    return navigator.userAgentData.platform.toUpperCase().indexOf('MAC') >= 0;
  }
  // Fallback to deprecated but widely supported API
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

// Bulk Operations
function toggleSelectAll() {
  const checkboxes = document.querySelectorAll('.bulk-select');
  const allChecked = selectedEstimatesForBulk.length === estimates.length;

  if (allChecked) {
    // Deselect all
    selectedEstimatesForBulk = [];
    checkboxes.forEach(cb => (cb.checked = false));
  } else {
    // Select all
    selectedEstimatesForBulk = estimates.map((_, index) => index);
    checkboxes.forEach(cb => (cb.checked = true));
  }

  updateBulkButtons();
}

function toggleBulkSelection(index) {
  const idx = selectedEstimatesForBulk.indexOf(index);

  if (idx > -1) {
    selectedEstimatesForBulk.splice(idx, 1);
  } else {
    selectedEstimatesForBulk.push(index);
  }

  updateBulkButtons();
}

function updateBulkButtons() {
  const count = selectedEstimatesForBulk.length;
  const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
  const selectAllBtn = document.getElementById('selectAllBtn');
  const selectedCountSpan = document.getElementById('selectedCount');

  if (selectedCountSpan) {
    selectedCountSpan.textContent = count;
  }

  if (bulkDeleteBtn) {
    bulkDeleteBtn.disabled = count === 0;
  }

  if (selectAllBtn) {
    selectAllBtn.textContent = count === estimates.length ? '☐ Снять выделение' : '☑️ Выбрать все';
  }
}

function bulkDelete() {
  if (selectedEstimatesForBulk.length === 0) return;

  const count = selectedEstimatesForBulk.length;
  if (confirm(`Вы уверены, что хотите удалить ${count} ${count === 1 ? 'смету' : 'смет'}?`)) {
    // Sort indices in descending order to delete from end to start
    const sortedIndices = [...selectedEstimatesForBulk].sort((a, b) => b - a);

    sortedIndices.forEach(index => {
      estimates.splice(index, 1);
    });

    saveEstimates();
    selectedEstimatesForBulk = [];
    renderEstimatesList();

    showNotification(`✅ Удалено ${count} ${count === 1 ? 'смета' : 'смет'}`, 'success');
  }
}

// Undo/Redo Functionality
function saveStateToUndo() {
  if (!currentEstimate) return;

  // Create a deep copy of current state
  const state = {
    estimate: JSON.parse(JSON.stringify(currentEstimate)),
    timestamp: Date.now(),
  };

  undoStack.push(state);

  // Limit undo stack size
  if (undoStack.length > MAX_UNDO_STACK) {
    undoStack.shift();
  }

  // Clear redo stack when new action is performed
  redoStack = [];

  updateUndoRedoButtons();
}

function undo() {
  if (undoStack.length === 0) return;

  // Save current state to redo stack
  const currentState = {
    estimate: JSON.parse(JSON.stringify(currentEstimate)),
    timestamp: Date.now(),
  };
  redoStack.push(currentState);

  // Restore previous state
  const previousState = undoStack.pop();
  currentEstimate = previousState.estimate;

  loadEstimateToForm();
  updateUndoRedoButtons();

  // Haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

function redo() {
  if (redoStack.length === 0) return;

  // Save current state to undo stack
  const currentState = {
    estimate: JSON.parse(JSON.stringify(currentEstimate)),
    timestamp: Date.now(),
  };
  undoStack.push(currentState);

  // Restore next state
  const nextState = redoStack.pop();
  currentEstimate = nextState.estimate;

  loadEstimateToForm();
  updateUndoRedoButtons();

  // Haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');

  if (undoBtn) {
    undoBtn.disabled = undoStack.length === 0;
    undoBtn.title =
      undoStack.length > 0 ? `Отменить (${undoStack.length} действий)` : 'Нет действий для отмены';
  }

  if (redoBtn) {
    redoBtn.disabled = redoStack.length === 0;
    redoBtn.title =
      redoStack.length > 0
        ? `Повторить (${redoStack.length} действий)`
        : 'Нет действий для повтора';
  }
}

// Auto-save Functionality
function initializeAutoSave() {
  // Auto-save every 30 seconds when in edit view
  setInterval(() => {
    if (editView.classList.contains('active') && currentEstimate) {
      autoSaveEstimate();
    }
  }, 30000);

  // Also save on window beforeunload
  window.addEventListener('beforeunload', () => {
    if (editView.classList.contains('active') && currentEstimate) {
      autoSaveEstimate();
    }
  });

  console.log('✓ Auto-save initialized (30s interval)');
}

function autoSaveEstimate() {
  if (!currentEstimate) return;

  // Get current form state
  const currentFormState = {
    title: document.getElementById('estimateTitle').value,
    date: document.getElementById('estimateDate').value,
    client: document.getElementById('estimateClient').value,
    project: document.getElementById('estimateProject').value,
    items: [],
  };

  // Get items
  document.querySelectorAll('.item-row').forEach(row => {
    const description = row.querySelector('.item-description').value;
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const unit = row.querySelector('.item-unit').value;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;

    if (description.trim() || quantity > 0 || price > 0) {
      currentFormState.items.push({ description, quantity, unit, price });
    }
  });

  // Check if state has changed
  const currentStateStr = JSON.stringify(currentFormState);
  if (currentStateStr === lastSavedState) {
    return; // No changes to save
  }

  // Save to localStorage as draft
  localStorage.setItem('estimate_draft', currentStateStr);
  lastSavedState = currentStateStr;

  // Show auto-save indicator
  showAutoSaveIndicator();
}

function showAutoSaveIndicator() {
  const indicator = document.getElementById('autoSaveIndicator');
  if (!indicator) {
    const newIndicator = document.createElement('div');
    newIndicator.id = 'autoSaveIndicator';
    newIndicator.className = 'auto-save-indicator';
    newIndicator.textContent = '✓ Автоматически сохранено';
    document.body.appendChild(newIndicator);

    setTimeout(() => {
      newIndicator.classList.add('visible');
    }, 10);

    setTimeout(() => {
      newIndicator.classList.remove('visible');
      setTimeout(() => {
        newIndicator.remove();
      }, 300);
    }, 2000);
  }
}

function loadDraft() {
  const draft = localStorage.getItem('estimate_draft');
  if (draft) {
    try {
      const draftData = JSON.parse(draft);
      if (confirm('Обнаружен несохраненный черновик. Восстановить?')) {
        currentEstimate = draftData;
        loadEstimateToForm();
        localStorage.removeItem('estimate_draft');
      }
    } catch (e) {
      console.error('Error loading draft:', e);
    }
  }
}

// Dark Mode Functions
function initializeDarkMode() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  // Load saved theme preference
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);

  // Add click handler
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  });

  console.log('✓ Dark mode initialized');
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  // Update toggle icon
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const icon = themeToggle.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}
