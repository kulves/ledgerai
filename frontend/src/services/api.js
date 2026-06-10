const API_BASE_URL = 'http://127.0.0.1:8000';

export const api = {
  async getHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) throw new Error('Backend not responding');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { 
        status: 'offline', 
        error: error.message,
        version: 'Unknown'
      };
    }
  }
};