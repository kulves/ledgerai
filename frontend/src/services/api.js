/**
 * api.js — Ledger AI Frontend API Service
 * =========================================
 * Central place for all HTTP calls to the FastAPI backend.
 * No fetch() calls anywhere else in the frontend.
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

export const api = {

  // ── Health ──────────────────────────────────────────────────────────────
  async getHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) throw new Error('Backend not responding');
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'offline', error: error.message, version: 'Unknown' };
    }
  },

  // ── Luca chat ────────────────────────────────────────────────────────────
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
        source: null, topic: null, confidence_note: error.message
      };
    }
  },

  // ── Luca categorization ──────────────────────────────────────────────────
  async categorizeExpense(vendor, amount, description = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/luca/categorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor, amount, description })
      });
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('categorizeExpense failed:', error);
      return {
        category: 'Uncategorized', confidence: 'low',
        deductible: false, notes: error.message,
        needs_review: true, success: false
      };
    }
  },

  // ── Businesses ───────────────────────────────────────────────────────────
  async getBusinesses() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/businesses/`);
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('getBusinesses failed:', error);
      return [];
    }
  },

  async createBusiness(name, entityType = 'sole_prop', state = 'CA') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/businesses/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, entity_type: entityType, state })
      });
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('createBusiness failed:', error);
      return null;
    }
  },

  // ── Expenses ─────────────────────────────────────────────────────────────
  async getExpenses(businessId = null) {
    try {
      const url = businessId
        ? `${API_BASE_URL}/api/expenses/?business_id=${businessId}`
        : `${API_BASE_URL}/api/expenses/`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('getExpenses failed:', error);
      return [];
    }
  },

  async createExpense(expenseData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('createExpense failed:', error);
      return null;
    }
  },

  async deleteExpense(expenseId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses/${expenseId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('deleteExpense failed:', error);
      return null;
    }
  },

  // ── Mileage ──────────────────────────────────────────────────────────────
  async getMileageTrips(businessId = null) {
    try {
      const url = businessId
        ? `${API_BASE_URL}/api/mileage/?business_id=${businessId}`
        : `${API_BASE_URL}/api/mileage/`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('getMileageTrips failed:', error);
      return [];
    }
  },

  async getMileageSummary(businessId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/mileage/summary?business_id=${businessId}`
      );
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('getMileageSummary failed:', error);
      return {};
    }
  },

  async createMileageTrip(tripData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mileage/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData)
      });
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('createMileageTrip failed:', error);
      return null;
    }
  },

  async deleteMileageTrip(tripId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mileage/${tripId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('deleteMileageTrip failed:', error);
      return null;
    }
  }

};