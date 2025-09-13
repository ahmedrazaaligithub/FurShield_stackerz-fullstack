const { logger } = require('../utils/logger');
class AIService {
  constructor() {
    this.apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
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
    return true;
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
    if (!this.apiKey) {
      return this.callMockProvider(fullPrompt);
    }
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
    await new Promise(resolve => setTimeout(resolve, 500));
    const userQuestionMatch = prompt.match(/User Question: (.+)$/);
    const userQuestion = userQuestionMatch ? userQuestionMatch[1] : prompt;
    let response = '';
    if (userQuestion.toLowerCase().includes('food') || userQuestion.toLowerCase().includes('diet') || userQuestion.toLowerCase().includes('eating')) {
      response = `Regarding pet nutrition and feeding:
• Provide high-quality, age-appropriate pet food
• Maintain consistent feeding schedules
• Ensure fresh water is always available
• Avoid human foods that are toxic to pets (chocolate, grapes, onions, etc.)
• Monitor your pet's weight and adjust portions accordingly
• Consider your pet's specific dietary needs based on age, size, and health conditions
For specific dietary recommendations, consult with your veterinarian.`;
    } else if (userQuestion.toLowerCase().includes('exercise') || userQuestion.toLowerCase().includes('activity') || userQuestion.toLowerCase().includes('walk')) {
      response = `About pet exercise and activity:
• Dogs typically need 30 minutes to 2 hours of exercise daily, depending on breed and age
• Cats benefit from 10-15 minutes of active play several times per day
• Provide mental stimulation through puzzle toys and training
• Adjust exercise intensity based on your pet's age and health
• Watch for signs of overexertion (excessive panting, fatigue)
• Indoor pets may need more structured exercise routines
Always consult your vet before starting new exercise programs.`;
    } else if (userQuestion.toLowerCase().includes('health') || userQuestion.toLowerCase().includes('sick') || userQuestion.toLowerCase().includes('symptom')) {
      response = `Regarding pet health concerns:
• Schedule regular veterinary check-ups (annually for healthy adult pets)
• Watch for changes in appetite, behavior, or bathroom habits
• Keep vaccinations up to date
• Maintain proper dental hygiene
• Monitor for signs of illness: lethargy, vomiting, diarrhea, difficulty breathing
• Emergency signs require immediate veterinary attention
This is general information only. For specific health concerns, contact your veterinarian immediately.`;
    } else {
      response = `Thank you for your pet care question. Here's some general guidance:
• Regular veterinary care is essential for your pet's health
• Provide a safe, comfortable environment
• Ensure proper nutrition and hydration
• Give your pet plenty of love and attention
• Stay observant of any changes in behavior or health
• Keep emergency vet contact information readily available
For specific concerns about your pet, always consult with a qualified veterinarian.`;
    }
    return `${response}
**Important Disclaimer**: This information is for educational purposes only. Always consult with a qualified veterinarian for medical advice regarding your pet's health and for any specific concerns.`;
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