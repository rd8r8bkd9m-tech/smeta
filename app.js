// Application State
let estimates = [];
let currentEstimate = null;
let editingIndex = -1;
let generatedEstimateData = null;

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
});

// Event Listeners
function initializeEventListeners() {
    document.getElementById('createWithAiBtn').addEventListener('click', showAiView);
    document.getElementById('createManualBtn').addEventListener('click', createNewEstimate);
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
    
    try {
        const prompt = createEstimatePrompt(description);
        const result = await callGeminiAPI(apiKey, prompt);
        
        // Parse the result
        generatedEstimateData = parseAIResponse(result);
        
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

function createEstimatePrompt(description) {
    return `Ты - эксперт по составлению строительных смет в России. 
    
Создай детальную смету для следующего объекта:
${description}

Требования:
1. Раздели смету на ДВА отдельных раздела: МАТЕРИАЛЫ и РАБОТЫ
2. Используй российские единицы измерения (м², м³, м, шт, кг, т)
3. Укажи рыночные цены на 2025 год для Москвы
4. Для каждой позиции укажи: наименование, количество, единица измерения, цена за единицу
5. Будь реалистичным в расчетах количества материалов и объемов работ

Верни результат СТРОГО в формате JSON:
{
  "title": "Название сметы",
  "client": "Тип клиента (например, Физическое лицо)",
  "project": "Тип проекта",
  "materials": [
    {
      "description": "Название материала",
      "quantity": число,
      "unit": "единица измерения",
      "price": цена_за_единицу
    }
  ],
  "labor": [
    {
      "description": "Название работы",
      "quantity": число,
      "unit": "единица измерения",
      "price": цена_за_единицу
    }
  ]
}

Пример правильного ответа для "штукатурка стен 30 кв.м.":
{
  "title": "Штукатурка стен",
  "client": "Физическое лицо",
  "project": "Отделочные работы",
  "materials": [
    {"description": "Штукатурка гипсовая Ротбанд", "quantity": 30, "unit": "м²", "price": 250},
    {"description": "Грунтовка глубокого проникновения", "quantity": 6, "unit": "кг", "price": 180},
    {"description": "Сетка штукатурная", "quantity": 30, "unit": "м²", "price": 45}
  ],
  "labor": [
    {"description": "Подготовка поверхности стен", "quantity": 30, "unit": "м²", "price": 150},
    {"description": "Грунтование стен", "quantity": 30, "unit": "м²", "price": 80},
    {"description": "Штукатурка стен по маякам", "quantity": 30, "unit": "м²", "price": 450}
  ]
}

Верни ТОЛЬКО JSON, без дополнительного текста.`;
}

async function callGeminiAPI(apiKey, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    
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
        throw new Error(errorData.error?.message || 'API request failed');
    }
    
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    return text;
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
            <h4>${data.title || 'Смета'}</h4>
            <p><strong>Клиент:</strong> ${data.client || 'Не указан'}</p>
            <p><strong>Проект:</strong> ${data.project || 'Не указан'}</p>
            
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
    
    const total = materialsTotal + laborTotal;
    html += `
            <p style="text-align: right; margin: 10px 0;"><strong>Итого работы: ${formatCurrency(laborTotal)}</strong></p>
            <p style="text-align: right; margin: 20px 0; font-size: 1.3rem; color: var(--success-color);"><strong>ВСЕГО: ${formatCurrency(total)}</strong></p>
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
