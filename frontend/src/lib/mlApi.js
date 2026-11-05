const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:8000';

async function fetchFromML(endpoint, options = {}) {
  const url = `${ML_SERVICE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutMs = options.timeout || 30000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedDetail = '';
      try {
        const parsed = JSON.parse(errorText);
        parsedDetail = parsed.detail || parsed.message || '';
      } catch (_e) {
        parsedDetail = errorText;
      }
      throw new Error(parsedDetail || `ML Service request failed: ${options.method || 'GET'} ${endpoint} (${response.status})`);
    }

    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`ML Service request to ${endpoint} timed out after ${timeoutMs / 1000}s. Please verify backend service status.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
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
      const controller = new AbortController();
      const timeoutMs = 45000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(`${ML_SERVICE_URL}/analyze_report_and_assess`, {
          method: 'POST',
          body: payload,
          signal: controller.signal,
        });
        if (!response.ok) {
          const errorText = await response.text();
          let detail = errorText;
          try {
            const parsed = JSON.parse(errorText);
            detail = parsed.detail || parsed.message || errorText;
          } catch (_e) {}
          throw new Error(detail || 'Report assessment request failed.');
        }
        return await response.json();
      } catch (err) {
        if (err.name === 'AbortError') {
          throw new Error('Report analysis timed out after 45s. Please ensure the document is clear and try again.');
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
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

  // Phase 8: Advanced AI Clinical Orchestration & RAG
  async orchestrateClinicalAssessment(payload) {
    return await fetchFromML('/orchestrate_clinical_assessment', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async orchestrateDoctorAssist(payload) {
    return await fetchFromML('/orchestrate_doctor_assist', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async orchestrateChat(payload) {
    return await fetchFromML('/orchestrate_chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getRagKnowledge(symptoms = []) {
    const query = Array.isArray(symptoms) && symptoms.length > 0
      ? `?symptoms=${encodeURIComponent(symptoms.join(','))}`
      : '';
    return await fetchFromML(`/rag_knowledge${query}`);
  },
};

