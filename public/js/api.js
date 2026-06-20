/**
 * API client library with authorization header injection and centralized error handling
 */
const API = {
  baseUrl: '',

  /**
   * Execute fetch request
   */
  request: async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    // Set headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle unauthorized or expired tokens
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // If we are not on the landing page, redirect
          if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
            window.location.href = '/';
          }
        }
        
        const errorObj = new Error(data.message || 'API request failed');
        errorObj.status = response.status;
        errorObj.errors = data.errors;
        throw errorObj;
      }

      return data;
    } catch (err) {
      if (err.status) {
        throw err;
      }
      const errorObj = new Error(err.message || 'Network error occurred');
      errorObj.status = 500;
      throw errorObj;
    }
  },

  // Auth Operations
  auth: {
    register: (username, email, password) => 
      API.request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
      }),
    login: (username, password) => 
      API.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      }),
    getProfile: () => 
      API.request('/api/auth/profile'),
    updateGoal: (carbonGoal) => 
      API.request('/api/auth/goal', {
        method: 'PUT',
        body: JSON.stringify({ carbonGoal })
      })
  },

  // Carbon Logging Operations
  footprint: {
    create: (entryData) => 
      API.request('/api/footprint', {
        method: 'POST',
        body: JSON.stringify(entryData)
      }),
    list: (page = 1, limit = 20) => 
      API.request(`/api/footprint?page=${page}&limit=${limit}`),
    delete: (id) => 
      API.request(`/api/footprint/${id}`, {
        method: 'DELETE'
      }),
    getSummary: (days = 30) => 
      API.request(`/api/footprint/summary?days=${days}`),
    getMetadata: () => 
      API.request('/api/footprint/metadata')
  },

  // Insights Recommendations
  insights: {
    get: () => API.request('/api/insights')
  },

  // Gamified Challenges
  challenges: {
    list: () => API.request('/api/challenges'),
    listUser: () => API.request('/api/challenges/user'),
    enroll: (challengeId) => 
      API.request('/api/challenges/enroll', {
        method: 'POST',
        body: JSON.stringify({ challengeId })
      }),
    complete: (id) => 
      API.request(`/api/challenges/complete/${id}`, {
        method: 'POST'
      })
  },

  // Education content
  education: {
    get: () => API.request('/api/education')
  }
};
