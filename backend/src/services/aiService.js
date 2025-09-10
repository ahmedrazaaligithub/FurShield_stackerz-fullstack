const { logger } = require('../utils/logger');

class AIService {
  constructor() {
    this.apiKey = process.env.AI_API_KEY;
    this.provider = process.env.AI_PROVIDER || 'openai';
    this.baseUrl = this.getBaseUrl();
  }

  getBaseUrl() {
    switch (this.provider) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'anthropic':
        return 'https://api.anthropic.com/v1';
      default:
        return 'https://api.openai.com/v1';
    }
  }

  isEnabled() {
    return !!this.apiKey;
  }

  async generateResponse(prompt, context = {}) {
    if (!this.isEnabled()) {
      throw new Error('AI service is not configured');
    }

    try {
      const response = await this.callAIProvider(prompt, context);
      return response;
    } catch (error) {
      logger.error('AI service error:', error);
      throw error;
    }
  }

  async callAIProvider(prompt, context) {
    const systemPrompt = `You are a helpful pet care assistant. Provide informative and helpful advice about pet care, health, and wellness. Always include a disclaimer that your advice is for informational purposes only and users should consult with a qualified veterinarian for medical concerns.`;

    const fullPrompt = `${systemPrompt}\n\nContext: ${JSON.stringify(context)}\n\nUser Question: ${prompt}`;

    if (this.provider === 'openai') {
      return this.callOpenAI(fullPrompt);
    } else if (this.provider === 'anthropic') {
      return this.callAnthropic(fullPrompt);
    } else {
      return this.callMockProvider(fullPrompt);
    }
  }

  async callOpenAI(prompt) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async callAnthropic(prompt) {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 500,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  async callMockProvider(prompt) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return `Thank you for your question about pet care. This is a mock response for development purposes. 

For real AI assistance, please configure your AI_API_KEY in the environment variables.

Your question: "${prompt.substring(0, 100)}..."

**Disclaimer**: This information is for educational purposes only. Always consult with a qualified veterinarian for medical advice regarding your pet's health.`;
  }

  async getPetCareAdvice(petInfo, question) {
    const context = {
      pet: {
        name: petInfo.name,
        species: petInfo.species,
        breed: petInfo.breed,
        age: petInfo.age,
        weight: petInfo.weight
      }
    };

    return this.generateResponse(question, context);
  }

  async getHealthRecommendations(symptoms, petInfo) {
    const context = {
      symptoms,
      pet: petInfo
    };

    const prompt = `Based on the following symptoms in a ${petInfo.species}, what general care recommendations would you suggest? Symptoms: ${symptoms}`;
    
    return this.generateResponse(prompt, context);
  }
}

module.exports = new AIService();
