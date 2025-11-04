// Telegram Chat Interface Script

// Test API Key for AI integration
const TEST_API_KEY = 'AIzaSyAb8RN6KlteMjDAglrWK7cJZBcFVZPaRnZ3dDUpmnhY8eRmXFBg';

// Chat state
let chatHistory = [];
let isGeneratingEstimate = false;
let currentEstimateData = {};

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const messagesContainer = document.getElementById('messages');
  
  // Load chat history from localStorage
  loadChatHistory();
  
  // Auto-resize textarea
  if (messageInput) {
    messageInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });
    
    // Send on Enter (but Shift+Enter for new line)
    messageInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
  
  // Send button click
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }
  
  function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    
    // Add user message
    addMessage(text, 'outgoing', '👤');
    
    // Save to history
    chatHistory.push({ type: 'user', text, timestamp: new Date() });
    saveChatHistory();
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Check if this looks like an estimate request
    if (shouldGenerateEstimate(text)) {
      generateEstimateWithAI(text);
    } else {
      // Simulate bot response after delay
      setTimeout(() => {
        respondToMessage(text);
      }, 1000);
    }
  }
  
  function shouldGenerateEstimate(text) {
    const keywords = ['смета', 'расчет', 'сколько стоит', 'цена', 'стоимость'];
    const lowerText = text.toLowerCase();
    
    // Check if user has provided enough information
    const hasArea = lowerText.match(/\d+\s*(кв\.?м|м2|метр)/);
    const hasWork = keywords.some(kw => lowerText.includes(kw)) || 
                    lowerText.includes('ремонт') || 
                    lowerText.includes('строит');
    
    return hasArea && hasWork && Object.keys(currentEstimateData).length > 0;
  }
  
  async function generateEstimateWithAI(userRequest) {
    if (isGeneratingEstimate) return;
    isGeneratingEstimate = true;
    
    // Show generating message
    addMessage(
      'Отлично! Начинаю генерацию сметы...\n\n⏳ Команда специалистов анализирует ваш запрос...',
      'incoming',
      '🤖'
    );
    
    // Prepare the prompt for AI
    const prompt = `Ты - профессиональный сметчик. Создай детальную смету на основе запроса клиента.
    
Запрос клиента: ${userRequest}

Создай смету в формате JSON с полями:
- estimateName: название проекта
- client: имя клиента (если указано)
- items: массив работ, каждая с полями name, unit, quantity, rate, amount

Ответь ТОЛЬКО JSON, без дополнительного текста.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${TEST_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        }
      );
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        // Extract JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const estimateData = JSON.parse(jsonMatch[0]);
          
          // Display estimate in chat
          displayEstimateInChat(estimateData);
          
          // Save estimate
          saveEstimateFromChat(estimateData);
        } else {
          throw new Error('No JSON found in response');
        }
      }
    } catch (error) {
      console.error('Error generating estimate:', error);
      addMessage(
        'Извините, произошла ошибка при генерации сметы. Попробуйте описать ваш проект более подробно.',
        'incoming',
        '🤖'
      );
    } finally {
      isGeneratingEstimate = false;
    }
  }
  
  function displayEstimateInChat(estimate) {
    let total = 0;
    let itemsHtml = '';
    
    if (estimate.items && estimate.items.length > 0) {
      estimate.items.forEach(item => {
        const amount = item.amount || (item.quantity * item.rate);
        total += amount;
        itemsHtml += `\n${item.name}: ${item.quantity} ${item.unit} × ${item.rate.toFixed(2)} ₽ = ${amount.toFixed(2)} ₽`;
      });
    }
    
    const message = `✅ Смета готова!\n\n📋 ${estimate.estimateName || 'Смета'}\n${estimate.client ? `👤 Клиент: ${estimate.client}\n` : ''}\n📊 Работы:${itemsHtml}\n\n💰 ИТОГО: ${total.toFixed(2)} ₽\n\nСмета сохранена в вашем списке. Хотите внести изменения?`;
    
    addMessage(message, 'incoming', '💰');
  }
  
  function saveEstimateFromChat(estimateData) {
    // Create estimate object compatible with existing system
    const estimate = {
      id: Date.now(),
      name: estimateData.estimateName || 'Смета из чата',
      client: estimateData.client || 'Клиент из чата',
      project: 'Чат-проект',
      date: new Date().toISOString().split('T')[0],
      items: estimateData.items || [],
      notes: 'Создано через чат-интерфейс',
      createdAt: new Date().toISOString()
    };
    
    // Save to localStorage (compatible with existing app)
    let estimates = JSON.parse(localStorage.getItem('estimates') || '[]');
    estimates.push(estimate);
    localStorage.setItem('estimates', JSON.stringify(estimates));
    
    console.log('Estimate saved:', estimate);
  }
  
  function addMessage(text, type, avatar) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = type === 'incoming' ? 'message-avatar bot' : 'message-avatar';
    avatarDiv.textContent = avatar;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    
    if (type === 'incoming') {
      const senderDiv = document.createElement('div');
      senderDiv.className = 'message-sender';
      senderDiv.textContent = 'Виртуальная фирма';
      bubbleDiv.appendChild(senderDiv);
    }
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    // Convert line breaks to <br> and preserve formatting
    textDiv.innerHTML = text.split('\n').map(line => `<p>${line}</p>`).join('');
    bubbleDiv.appendChild(textDiv);
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-timestamp';
    timeDiv.textContent = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    bubbleDiv.appendChild(timeDiv);
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(bubbleDiv);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  function respondToMessage(userText) {
    let response = '';
    
    const lowerText = userText.toLowerCase();
    
    // Extract information and store
    const areaMatch = lowerText.match(/(\d+)\s*(кв\.?м|м2|метр)/);
    if (areaMatch) {
      currentEstimateData.area = parseInt(areaMatch[1]);
    }
    
    // Simple keyword-based responses
    if (lowerText.includes('ремонт') || lowerText.includes('квартир') || lowerText.includes('дом')) {
      currentEstimateData.projectType = 'ремонт';
      
      if (areaMatch) {
        response = `Отлично! Ремонт ${areaMatch[1]} кв.м. Теперь уточните:\n\n📋 Какие работы планируете?\n• Штукатурка и выравнивание стен\n• Покраска/обои\n• Укладка пола (ламинат, плитка)\n• Электромонтажные работы\n• Сантехнические работы\n• Установка дверей и окон\n\nОпишите нужные работы, и я создам подробную смету!`;
      } else {
        response = `Понял, нужен ремонт! Укажите пожалуйста:\n\n1️⃣ Площадь помещения (кв.м)\n2️⃣ Виды работ\n3️⃣ Материалы (стандарт/премиум)\n\nЭто поможет составить точную смету!`;
      }
    } else if (lowerText.match(/\d+\s*(кв\.?м|м2|метр)/)) {
      response = `Записал площадь: ${areaMatch[1]} кв.м.\n\nТеперь опишите, какие работы нужно выполнить:\n\n🔨 Ремонтные работы\n🏗️ Строительные работы\n🎨 Отделочные работы\n⚡ Инженерные системы\n\nЧем подробнее опишете, тем точнее будет смета!`;
    } else if (lowerText.includes('штукатур') || lowerText.includes('стен') || lowerText.includes('пол') || lowerText.includes('покраск')) {
      currentEstimateData.works = lowerText;
      
      if (currentEstimateData.area) {
        response = `Отлично! У меня есть вся информация:\n\n📐 Площадь: ${currentEstimateData.area} кв.м\n🔨 Работы: ${lowerText}\n\n✨ Хотите, чтобы я сгенерировал смету с точными ценами? Напишите "смета" или "рассчитать"`;
      } else {
        response = `Понял, нужны работы: ${lowerText}\n\nТеперь укажите площадь объекта в кв.м, и я смогу рассчитать точную смету!`;
      }
    } else if (lowerText.includes('смета') || lowerText.includes('рассчита') || lowerText.includes('сколько') || lowerText.includes('стоимость')) {
      if (Object.keys(currentEstimateData).length > 0) {
        // Trigger AI generation
        setTimeout(() => generateEstimateWithAI(userText), 500);
        return; // Don't send immediate response
      } else {
        response = `Для расчета сметы мне нужна информация:\n\n1️⃣ Площадь объекта (кв.м)\n2️⃣ Виды работ\n3️⃣ Материалы (опционально)\n\nРасскажите о вашем проекте!`;
      }
    } else if (lowerText.includes('спасибо') || lowerText.includes('благодар')) {
      response = `Всегда рады помочь! 😊\n\nЕсли нужна еще смета или есть вопросы - обращайтесь!`;
      currentEstimateData = {}; // Reset
    } else if (lowerText.includes('помощь') || lowerText.includes('help')) {
      response = `Я помогу создать смету для вашего проекта!\n\n💡 Как это работает:\n1️⃣ Опишите ваш проект (ремонт квартиры, строительство дома)\n2️⃣ Укажите площадь\n3️⃣ Перечислите работы\n4️⃣ Я создам детальную смету\n\nПример: "Ремонт квартиры 50 кв.м, нужна штукатурка стен, покраска, укладка ламината"`;
    } else {
      response = `Я - виртуальный помощник строительной фирмы! 🏗️\n\nОпишите ваш проект:\n• Тип работ (ремонт, строительство)\n• Площадь объекта\n• Какие работы нужны\n\nНапример: "Ремонт 2-комнатной квартиры 52 кв.м"\n\nЯ создам для вас детальную смету!`;
    }
    
    addMessage(response, 'incoming', '🤖');
    
    // Save bot response to history
    chatHistory.push({ type: 'bot', text: response, timestamp: new Date() });
    saveChatHistory();
  }
  
  function loadChatHistory() {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      try {
        chatHistory = JSON.parse(saved);
        // Restore last few messages to display
        const lastMessages = chatHistory.slice(-5);
        // Don't restore to avoid cluttering - let users start fresh
      } catch (e) {
        console.error('Error loading chat history:', e);
      }
    }
  }
  
  function saveChatHistory() {
    try {
      // Keep only last 100 messages
      if (chatHistory.length > 100) {
        chatHistory = chatHistory.slice(-100);
      }
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    } catch (e) {
      console.error('Error saving chat history:', e);
    }
  }
  
  // Chat item clicks
  const chatItems = document.querySelectorAll('.chat-item');
  chatItems.forEach(item => {
    item.addEventListener('click', function() {
      chatItems.forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      
      // Update header with selected chat info
      const chatName = this.querySelector('.chat-name').textContent;
      const chatAvatar = this.querySelector('.chat-avatar').textContent;
      
      document.querySelector('.header-name').textContent = chatName;
      document.querySelector('.header-avatar').textContent = chatAvatar;
    });
  });
  
  // Mobile sidebar toggle
  const menuButton = document.querySelector('.menu-button');
  const chatsSidebar = document.querySelector('.chats-sidebar');
  
  if (menuButton && chatsSidebar) {
    menuButton.addEventListener('click', function() {
      chatsSidebar.classList.toggle('show');
    });
  }
});
