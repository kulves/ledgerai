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
  async askLuca(question, messages = [], businessName = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/luca/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          messages,
          business_name: businessName
        })
      })
      if (!response.ok) throw new Error(`Backend error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('askLuca failed:', error)
      return {
        answered: false,
        answer: 'Connection error. Please check the backend is running.',
        source: null
      }
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

  async categorizeIncome(source, amount, description = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/luca/categorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor: source, amount, description, transaction_type: 'income' })
      });
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('categorizeIncome failed:', error);
      return {
        category: 'Other Income', confidence: 'low',
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
  },
 
  // ── Documents ─────────────────────────────────────────────────────────────
  async uploadDocument(file, businessId) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('business_id', businessId)
 
      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        body: formData
        // Note: do NOT set Content-Type header here —
        // the browser sets it automatically with the correct boundary
      })
      if (!response.ok) throw new Error(`Backend error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('uploadDocument failed:', error)
      return { success: false, message: error.message }
    }
  },
 
  async getDocuments(businessId = null) {
    try {
      const url = businessId
        ? `${API_BASE_URL}/api/documents/?business_id=${businessId}`
        : `${API_BASE_URL}/api/documents/`
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Backend error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('getDocuments failed:', error)
      return []
    }
  },
 
  async deleteDocument(docId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error(`Backend error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('deleteDocument failed:', error)
      return null
    }
  },
 
  async updateDocument(docId, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!response.ok) throw new Error(`Backend error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('updateDocument failed:', error)
      return null
    }
  },
 
  // Not async — just builds the URL the <img>/<iframe> preview points to
  getDocumentFileUrl(docId) {
    return `${API_BASE_URL}/api/documents/${docId}/file`
  },

  async getExpenseDocument(expenseId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses/${expenseId}/document`)
      if (response.status === 404) return null   // no receipt linked — not an error
      if (!response.ok) throw new Error(`Backend error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('getExpenseDocument failed:', error)
      return null
    }
  },
 
  // ── Reports ───────────────────────────────────────────────────────────────
  async getReportSummary(businessId, startDate = null, endDate = null) {
    try {
      let url = `${API_BASE_URL}/api/reports/summary?business_id=${businessId}`
      if (startDate) url += `&start_date=${startDate}`
      if (endDate)   url += `&end_date=${endDate}`
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Backend error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('getReportSummary failed:', error)
      return null
    }
  },
 
  async downloadReportPdf(businessId, startDate = null, endDate = null, watermark = true) {
    try {
      let url = `${API_BASE_URL}/api/reports/pdf?business_id=${businessId}&watermark=${watermark}`
      if (startDate) url += `&start_date=${startDate}`
      if (endDate)   url += `&end_date=${endDate}`
 
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Backend error: ${response.status}`)
 
      // Get filename from Content-Disposition header
      const disposition = response.headers.get('Content-Disposition') || ''
      const match = disposition.match(/filename="(.+)"/)
      const filename = match ? match[1] : 'LedgerAI_Report.pdf'
 
      // Trigger browser download
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
 
      return { success: true, filename }
    } catch (error) {
      console.error('downloadReportPdf failed:', error)
      return { success: false, message: error.message }
    }
  },
 
  // ── Dashboard ──────────────────────────────────────────────────────────────
  async getDashboard(businessId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/?business_id=${businessId}`
      )
      if (!response.ok) throw new Error(`Backend error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('getDashboard failed:', error)
      return null
    }
  },
 
  // ── Settings ──────────────────────────────────────────────────────────────
  async getAppInfo() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/info`)
      if (!response.ok) throw new Error(`Backend error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('getAppInfo failed:', error)
      return null
    }
  },
 
  async getStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/stats`)
      if (!response.ok) throw new Error(`Backend error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('getStats failed:', error)
      return null
    }
  },
 
  async updateBusiness(businessId, updates) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/settings/businesses/${businessId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }
      )
      if (!response.ok) throw new Error(`Backend error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('updateBusiness failed:', error)
      return null
    }
  },
 
  async deactivateBusiness(businessId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/settings/businesses/${businessId}`,
        { method: 'DELETE' }
      )
      if (!response.ok) throw new Error(`Backend error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('deactivateBusiness failed:', error)
      return null
    }
  },
 
  async clearAllData(confirmation) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/clear`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation })
      })
      if (!response.ok) throw new Error(`Backend error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('clearAllData failed:', error)
      return null
    }
  },
 
  // ── License & Subscription ──────────────────────────────────────────────────
  async getLicenseStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/license/status`)
      if (!response.ok) throw new Error(`Backend error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('getLicenseStatus failed:', error)
      return null
    }
  },
 
  async activateLicense(licenseKey) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/license/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: licenseKey })
      })
      const data = await response.json()
      if (!response.ok) return { success: false, message: data.detail || 'Activation failed' }
      return data
    } catch (error) {
      console.error('activateLicense failed:', error)
      return { success: false, message: error.message }
    }
  },
 
  async createCheckout(tier) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/license/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier })
      })
      return await response.json()
    } catch (error) {
      console.error('createCheckout failed:', error)
      return { success: false, message: error.message }
    }
  },
 
  async downgradeLicense() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/license/downgrade`, {
        method: 'POST'
      })
      return await response.json()
    } catch (error) {
      console.error('downgradeLicense failed:', error)
      return null
    }
  }
 
};