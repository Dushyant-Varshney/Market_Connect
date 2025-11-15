const groq = require('../config/groqConfig'); // Change to Groq
const Product = require('../models/product');

class QueryUnderstanding {
  async analyzeQuery(userQuery, conversationHistory = []) {
    const systemPrompt = `You are a shopping query understanding system. Analyze the user's query and extract shopping intent as valid JSON with these exact fields:
    - categories: array of relevant product categories
    - attributes: array of key attributes like "gift", "for_her", "eco_friendly"
    - price_range: object with min and max numbers
    - occasion: string like "birthday", "anniversary", "personal use"
    - style: string like "modern", "vintage", "minimalist"
    - use_case: string describing the primary use
    
    Return ONLY JSON, no other text.`;

    try {
      const response = await groq.createChatCompletion([
        { role: "system", content: systemPrompt },
        { role: "user", content: `User Query: "${userQuery}"` }
      ], {
        temperature: 0.1,
        response_format: { type: "json_object" } // Groq supports this!
      });

      const intentData = JSON.parse(response.choices[0].message.content);
      console.log('Extracted intent:', intentData);
      return intentData;
      
    } catch (error) {
      console.error('Query understanding error:', error);
      return {
        categories: [],
        attributes: [],
        price_range: { min: 0, max: 1000 },
        occasion: '',
        style: '',
        use_case: ''
      };
    }
  }
}

class ResponseGenerator {
  async generateResponse(userQuery, products, conversationHistory) {
    const assistantPersona = `You are a friendly, knowledgeable shopping assistant for MarketConnect. 
    Be helpful, enthusiastic but not pushy. Highlight key features and benefits. 
    Mention price, rating, and specific advantages. Be concise but warm.
    If no products match, suggest alternative search terms or categories.`;
    
    const productContext = products.length > 0 ? 
      products.map((product, index) => `
        Product ${index + 1}:
        - Name: ${product.name}
        - Price: $${product.price}
        - Rating: ${product.rating}/5 stars (${product.reviewCount || 0} reviews)
        - Category: ${product.category}
        - Description: ${product.description}
        - Key Features: ${product.features ? product.features.join(', ') : 'None specified'}
      `).join('\n') : 
      "No products match the user's criteria. Suggest alternative search terms or broader categories.";
    
    const prompt = `
      User's current request: "${userQuery}"
      
      Available products that match their needs:
      ${productContext}
      
      Please provide a helpful response that:
      1. Acknowledges their request naturally
      2. Recommends the best options with specific reasons
      3. Mentions price, rating, and key features
      4. Ends with an open question to continue the conversation
      
      Keep it conversational and under 150 words.
    `;

    try {
      const response = await groq.createChatCompletion([
        { role: "system", content: assistantPersona },
        { role: "user", content: prompt }
      ], {
        temperature: 0.7,
        max_tokens: 300
      });

      return {
        text: response.choices[0].message.content,
        products: this.formatProductsForResponse(products)
      };
    } catch (error) {
      console.error('Response generation error:', error);
      return {
        text: products.length > 0 
          ? `I found ${products.length} products that might interest you!` 
          : "I couldn't find any products matching your criteria. Try broadening your search.",
        products: this.formatProductsForResponse(products)
      };
    }
  }

  formatProductsForResponse(products) {
    return products.map(product => ({
      id: product._id,
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      rating: product.rating,
      reviewCount: product.reviewCount,
      image_url: product.images && product.images.length > 0 ? product.images[0].url : '/images/placeholder.jpg',
      features: product.features || [],
      tags: product.tags || []
    }));
  }
}

// ... rest of the controller remains the same