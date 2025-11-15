const axios = require('axios');
require('dotenv').config();

class GroqClient {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.apiUrl = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
    
    if (!this.apiKey) {
      console.warn('GROQ_API_KEY not found in environment variables');
    } else {
      console.log('Groq API configured');
    }
  }

  async createChatCompletion(messages, options = {}) {
    try {
      const payload = {
        model: options.model || "llama3-8b-8192", // Groq specific models
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 300,
        ...options
      };

      // Groq supports response_format like OpenAI
      if (options.response_format) {
        payload.response_format = options.response_format;
      }

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data;

    } catch (error) {
      console.error('Groq API Error:', error.response?.data || error.message);
      throw new Error(`Groq API request failed: ${error.message}`);
    }
  }
}

module.exports = new GroqClient();