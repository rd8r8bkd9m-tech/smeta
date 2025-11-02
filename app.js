// Application State
let estimates = [];
let currentEstimate = null;
let editingIndex = -1;

// DOM Elements
const listView = document.getElementById('listView');
const editView = document.getElementById('editView');
const estimatesList = document.getElementById('estimatesList');
const itemsContainer = document.getElementById('itemsContainer');
const totalAmount = document.getElementById('totalAmount');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadEstimates();
    initializeEventListeners();
    renderEstimatesList();
});

// Event Listeners
function initializeEventListeners() {
    document.getElementById('createNewBtn').addEventListener('click', createNewEstimate);
    document.getElementById('backToListBtn').addEventListener('click', showListView);
    document.getElementById('saveEstimateBtn').addEventListener('click', saveCurrentEstimate);
    document.getElementById('addItemBtn').addEventListener('click', addItemRow);
    document.getElementById('exportBtn').addEventListener('click', exportEstimate);
    
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

// View Functions
function showListView() {
    listView.classList.add('active');
    editView.classList.remove('active');
    renderEstimatesList();
}

function showEditView() {
    listView.classList.remove('active');
    editView.classList.add('active');
}

// Estimate List Functions
function renderEstimatesList() {
    if (estimates.length === 0) {
        estimatesList.innerHTML = `
            <div class="empty-state">
                <p>📄 Нет сохраненных смет</p>
                <p class="help-text">Нажмите "Создать новую смету" чтобы начать</p>
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
