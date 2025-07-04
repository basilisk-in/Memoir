const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('🔧 API Service initialized with base URL:', this.baseURL);
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token && { 'Authorization': `Token ${token}` })
    };
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      // Get the response text to see what we actually received
      const responseText = await response.text();
      console.error('❌ Error response text:', responseText);
      
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.detail || errorData.message || 'Request failed');
      } catch (parseError) {
        // If it's not JSON, it might be HTML (like a 404 page)
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
          throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. This usually means the API endpoint doesn't exist or there's a routing issue.`);
        }
        throw new Error(`Request failed with status ${response.status}: ${responseText}`);
      }
    }
    
    const responseText = await response.text();
    console.log('✅ Success response text:', responseText);
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError);
      throw new Error('Server returned invalid JSON');
    }
  }

  // Authentication methods
  async login(username, password) {
    const loginUrl = `${this.baseURL}/auth/token/login/`;
    console.log('🚀 Attempting login to:', loginUrl);
    console.log('📝 Login data:', { username, password: '***' });
    
    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await this.handleResponse(response);
      
      // Store token in localStorage
      if (data.auth_token) {
        localStorage.setItem('auth_token', data.auth_token);
        console.log('✅ Token stored successfully');
      }
      
      return data;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  async logout() {
    const logoutUrl = `${this.baseURL}/auth/token/logout/`;
    console.log('🚪 Attempting logout to:', logoutUrl);
    
    try {
      const response = await fetch(logoutUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      // Remove token regardless of response
      localStorage.removeItem('auth_token');
      
      if (response.ok) {
        console.log('✅ Logout successful');
        return true;
      }
      throw new Error('Logout failed');
    } catch (error) {
      console.error('❌ Logout error:', error);
      localStorage.removeItem('auth_token'); // Remove token anyway
      throw error;
    }
  }

  async getCurrentUser() {
    const userUrl = `${this.baseURL}/auth/users/me/`;
    console.log('👤 Getting current user from:', userUrl);
    
    const response = await fetch(userUrl, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  }

  // Get stored token
  getToken() {
    return localStorage.getItem('auth_token');
  }

  // Note management methods
  async uploadFiles(files, names) {
    const uploadUrl = `${this.baseURL}/api/notes/upload/`;
    console.log('📤 Uploading files to:', uploadUrl);
    console.log('📝 Files count:', files.length, 'Names:', names);

    const formData = new FormData();
    
    // Add files
    files.forEach(file => {
      formData.append('files', file);
    });
    
    // Add names
    names.forEach(name => {
      formData.append('names', name);
    });

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.getToken()}`,
          'ngrok-skip-browser-warning': 'true',
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
        body: formData,
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  }

  async getNotes(page = 1) {
    const notesUrl = `${this.baseURL}/api/notes/?page=${page}`;
    console.log('📋 Getting notes from:', notesUrl);

    const response = await fetch(notesUrl, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async getNote(noteId) {
    const noteUrl = `${this.baseURL}/api/notes/${noteId}/`;
    console.log('📄 Getting note from:', noteUrl);

    const response = await fetch(noteUrl, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async getOCRResult(noteId) {
    const ocrUrl = `${this.baseURL}/api/get-ocr/${noteId}/`;
    console.log('🔍 Getting OCR from:', ocrUrl);

    const response = await fetch(ocrUrl, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async getSummary(noteId) {
    const summaryUrl = `${this.baseURL}/api/get-summary/${noteId}/`;
    console.log('📝 Getting summary from:', summaryUrl);

    const response = await fetch(summaryUrl, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async regenerateOCR(noteId) {
    const regenOcrUrl = `${this.baseURL}/api/regenerate-ocr/${noteId}/`;
    console.log('🔄 Regenerating OCR from:', regenOcrUrl);

    const response = await fetch(regenOcrUrl, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async regenerateSummary(noteId) {
    const regenSummaryUrl = `${this.baseURL}/api/regenerate-summary/${noteId}/`;
    console.log('🔄 Regenerating summary from:', regenSummaryUrl);

    const response = await fetch(regenSummaryUrl, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService; 