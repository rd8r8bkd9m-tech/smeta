// Telegram Chat Interface Script

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const messagesContainer = document.getElementById('messages');
  
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
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Simulate bot response after delay
    setTimeout(() => {
      respondToMessage(text);
    }, 1000);
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
    textDiv.innerHTML = `<p>${text}</p>`;
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
    
    // Simple keyword-based responses
    if (lowerText.includes('ремонт') || lowerText.includes('квартир') || lowerText.includes('дом')) {
      response = `Отлично! Я понял, что вам нужен ремонт. Наша команда готова помочь:\n\n🏗️ Главный инженер проанализирует объект\n📐 Архитектор рассчитает объемы работ\n🔨 Прораб определит последовательность\n📦 Снабженец подберет материалы\n💰 Сметчик составит детальную смету\n\nПожалуйста, укажите площадь и какие работы планируете?`;
    } else if (lowerText.match(/\d+\s*(кв\.?м|м2|метр)/)) {
      response = `Понял, площадь ${lowerText.match(/\d+/)[0]} кв.м. Теперь расскажите подробнее о планируемых работах:\n\n• Штукатурка стен?\n• Покраска?\n• Укладка пола?\n• Электрика?\n• Сантехника?\n\nЧем подробнее опишите, тем точнее будет смета!`;
    } else if (lowerText.includes('штукатур') || lowerText.includes('стен') || lowerText.includes('пол') || lowerText.includes('покраск')) {
      response = `Отлично! Я передал информацию нашей команде специалистов. Они начинают работу:\n\n✅ Главный инженер анализирует объект...\n⏳ Архитектор рассчитывает объемы...\n⏳ Прораб определяет последовательность...\n⏳ Снабженец подбирает материалы...\n\nСмета будет готова через несколько минут!`;
    } else if (lowerText.includes('смета') || lowerText.includes('цена') || lowerText.includes('стоимость')) {
      response = `Для расчета точной сметы мне нужна информация:\n\n1️⃣ Площадь объекта (кв.м)\n2️⃣ Виды работ (ремонт, строительство)\n3️⃣ Материалы (стандарт, премиум)\n4️⃣ Сроки выполнения\n\nРасскажите подробнее о вашем проекте!`;
    } else if (lowerText.includes('спасибо') || lowerText.includes('благодар')) {
      response = `Пожалуйста! Рады помочь! 😊\n\nЕсли будут еще вопросы по строительству или сметам - обращайтесь!`;
    } else {
      response = `Спасибо за сообщение! Я виртуальный помощник строительной фирмы.\n\nОпишите ваш проект:\n• Что планируете (ремонт, строительство)?\n• Площадь объекта\n• Какие работы нужны\n\nИ наша команда специалистов составит для вас точную смету!`;
    }
    
    addMessage(response, 'incoming', '🤖');
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
