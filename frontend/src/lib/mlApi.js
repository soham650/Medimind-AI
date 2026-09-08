const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:8000';

async function fetchFromML(endpoint, options = {}) {
  const url = `${ML_SERVICE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `ML Service request failed: GET ${endpoint}`);
  }

  return await response.json();
}

export const mlApi = {
  async getSymptoms() {
    return await fetchFromML('/symptoms');
  },

  async predictDisease(symptoms) {
    return await fetchFromML('/predict_disease', {
      method: 'POST',
      body: JSON.stringify({ symptoms }),
    });
  },

  async predictRisk(vitals) {
    return await fetchFromML('/predict_risk', {
      method: 'POST',
      body: JSON.stringify({
        age: Number(vitals.age) || 30,
        bmi: Number(vitals.bmi) || 22.0,
        blood_sugar: Number(vitals.blood_sugar) || 100,
        bp_systolic: Number(vitals.bp_systolic) || 120,
        bp_diastolic: Number(vitals.bp_diastolic) || 80,
        smoking: Number(vitals.smoking) || 0,
      }),
    });
  },

  async getBiasMetrics() {
    return await fetchFromML('/bias_metrics');
  },

  async getHealth() {
    return await fetchFromML('/health');
  },

  async analyzeReport(fileName, fileType, fileData) {
    return await fetchFromML('/analyze_report', {
      method: 'POST',
      body: JSON.stringify({
        fileName,
        fileType,
        fileData,
      }),
    });
  },

  async analyzeReportAndAssess(payload) {
    if (payload instanceof FormData) {
      const response = await fetch(`${ML_SERVICE_URL}/analyze_report_and_assess`, {
        method: 'POST',
        body: payload,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Report assessment request failed.');
      }
      return await response.json();
    }

    return await fetchFromML('/analyze_report_and_assess', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getChatReply(message, history = []) {
    return await fetchFromML('/message', {
      method: 'POST',
      body: JSON.stringify({
        message,
        history,
      }),
    });
  },
};
