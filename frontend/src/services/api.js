/**
 * api.js — Ledger AI Frontend API Service
 * =========================================
 * Purpose:
 *   Central place for all HTTP calls to the FastAPI backend.
 *   Every backend endpoint the frontend uses is defined here.
 *   No fetch() calls anywhere else in the frontend — always go
 *   through this file so URLs and error handling stay consistent.
 *
 * Connections:
 *   - Called by: App.jsx, and future route/component files
 *   - Talks to:  FastAPI backend at 127.0.0.1:8000
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

export const api = {

  /**
   * Check if the backend is running and healthy.
   * Called on app load and every 8 seconds to keep status fresh.
   */
  async getHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) throw new Error('Backend not responding');
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'offline',
        error: error.message,
        version: 'Unknown'
      };
    }
  },

  /**
   * Ask Luca an educational tax question.
   * Uses the RAG knowledge base — only answers from verified content.
   *
   * @param {string} question - The user's question in natural language
   * @returns {Object} { answered, answer, source, topic, confidence_note }
   */
  async askLuca(question) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/luca/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('askLuca failed:', error);
      return {
        answered: false,
        answer: 'I had trouble connecting to the backend. Please make sure the server is running.',
        source: null,
        topic: null,
        confidence_note: error.message
      };
    }
  }

};