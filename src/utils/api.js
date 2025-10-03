import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
}

// Templates API
export const templatesAPI = {
  upload: (data) => {
    return api.post('/templates/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getAll: () => api.get('/templates/'),
  getById: (id) => api.get(`/templates/${id}`),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
  getAISuggestions: (data) => api.post('/templates/ai-suggestions', data),
  getAIFieldPlacement: (id, fields) => api.post(`/templates/${id}/ai-field-placement`, { fields }),
}

// Data API
export const dataAPI = {
  preview: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/data/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  validate: (fields, file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('required_fields', JSON.stringify(fields))
    return api.post('/data/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// Generation API
export const generationAPI = {
  generate: (templateId, fieldMappings, file) => {
    const formData = new FormData()
    formData.append('template_id', templateId)
    formData.append('field_mappings', JSON.stringify(fieldMappings))
    formData.append('file', file)
    return api.post('/generation/generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getHistory: () => api.get('/generation/history'),
  getStatus: (id) => api.get(`/generation/status/${id}`),
}

export default api