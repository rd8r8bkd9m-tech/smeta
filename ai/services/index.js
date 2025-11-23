/**
 * AI Service for Construction Cost Estimation
 * 
 * Provides:
 * - Work classification from text
 * - Photo recognition of construction work
 * - Automatic norm matching
 * - Cost estimation using AI
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const natural = require('natural');

class AIEstimationService {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
  }

  /**
   * Classify construction work from description
   */
  async classifyWork(description) {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Классифицируй строительную работу:
"${description}"

Верни в формате JSON:
{
  "category": "категория работы (например: отделочные, монтажные, бетонные)",
  "subcategory": "подкатегория",
  "unit": "единица измерения (м2, м3, м, шт)",
  "keywords": ["ключевые", "слова"]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text);
    } catch (e) {
      return { error: 'Failed to parse response', raw: text };
    }
  }

  /**
   * Match work description to FER/GESN norms
   */
  async matchToNorms(description, availableNorms) {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const normsText = availableNorms.map(n => 
      `${n.code}: ${n.name}`
    ).join('\n');
    
    const prompt = `Найди наиболее подходящие нормы ФЕР/ГЭСН для работы:
"${description}"

Доступные нормы:
${normsText}

Верни топ-5 наиболее подходящих норм в формате JSON:
[
  {
    "code": "код нормы",
    "confidence": 0.95,
    "reason": "почему подходит"
  }
]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text);
    } catch (e) {
      return [];
    }
  }

  /**
   * Generate full estimate from project description
   */
  async generateEstimate(projectDescription) {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Создай детальную смету для проекта:
"${projectDescription}"

Верни в формате JSON:
{
  "title": "название сметы",
  "items": [
    {
      "name": "наименование работы",
      "quantity": число,
      "unit": "единица измерения",
      "unitPrice": примерная цена за единицу,
      "type": "work" или "material",
      "category": "категория"
    }
  ],
  "notes": "дополнительные замечания"
}

Используй актуальные цены для Москвы 2025 года.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text);
    } catch (e) {
      return { error: 'Failed to generate estimate', raw: text };
    }
  }

  /**
   * Analyze construction photo and identify work types
   */
  async analyzePhoto(imageData) {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    const prompt = `Проанализируй фото строительного объекта и определи:
1. Тип выполняемых работ
2. Состояние объекта
3. Необходимые работы
4. Примерные объемы

Верни в формате JSON.`;

    const imageParts = [{
      inlineData: {
        data: imageData,
        mimeType: 'image/jpeg'
      }
    }];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text);
    } catch (e) {
      return { error: 'Failed to analyze photo', raw: text };
    }
  }

  /**
   * Calculate volumes from dimensions
   */
  calculateVolumes(params) {
    const { length, width, height, type } = params;
    
    const results = {};
    
    switch (type) {
      case 'room':
        results.floorArea = length * width; // м²
        results.wallArea = 2 * (length + width) * height; // м²
        results.ceilingArea = length * width; // м²
        results.volume = length * width * height; // м³
        break;
        
      case 'wall':
        results.area = length * height; // м²
        results.volume = length * height * (width || 0.1); // м³
        break;
        
      case 'floor':
        results.area = length * width; // м²
        results.volume = length * width * (height || 0.05); // м³
        break;
    }
    
    return results;
  }

  /**
   * Text similarity using TF-IDF
   */
  calculateSimilarity(text1, text2) {
    this.tfidf.addDocument(text1);
    this.tfidf.addDocument(text2);
    
    const terms1 = this.tokenizer.tokenize(text1.toLowerCase());
    const terms2 = this.tokenizer.tokenize(text2.toLowerCase());
    
    let commonTerms = 0;
    terms1.forEach(term => {
      if (terms2.includes(term)) {
        commonTerms++;
      }
    });
    
    return commonTerms / Math.max(terms1.length, terms2.length);
  }
}

module.exports = AIEstimationService;
