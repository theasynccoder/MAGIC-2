import axios from 'axios'

// Debug: log resolved base URL to help diagnose Network Error in dev
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
console.debug('[api] API_BASE_URL =', API_BASE_URL)

// Expose for runtime debugging in the browser
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.__API_BASE_URL = API_BASE_URL
  // @ts-ignore
  window.__LAST_API_ERROR = null
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for session management
})

// Add error interceptor
api.interceptors.response.use(
  response => response,
  error => {
    // Provide richer diagnostics for network failures
    const errInfo = {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
      request: error?.request,
      config: error?.config && { url: error.config.url, method: error.config.method, baseURL: error.config.baseURL },
    }
    console.error('API Error:', errInfo)
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.__LAST_API_ERROR = errInfo
    }
    throw error
  }
)

// Types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  agentType?: string
  resultImage?: string
  imageUrl?: string
  needsValidation?: boolean
  validationState?: 'pending' | 'validated' | 'rejected' | 'submitting'
}

export interface PredictionResult {
  prediction: string
  confidence: number
  category?: string
  description?: string
  error?: string
}

export interface ChatResponse {
  status: string
  response: string
  agent: string
  result_image?: string
  conversation_id?: number
  user_image_url?: string
}

export interface AuthUser {
  id: number
  email: string
  name: string
}

export interface ConversationSummary {
  id: number
  title: string
  created_at: string
  updated_at: string
}

export interface PersistedMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  agentType?: string | null
  imageUrl?: string | null
  resultImage?: string | null
}

export interface ConversationDetail extends ConversationSummary {
  messages: PersistedMessage[]
}

// Chat API - connects to /chat endpoint
export const chatApi = {
  sendMessage: async (
    query: string,
    conversationHistory: ChatMessage[] = [],
    conversationId?: number
  ) => {
    const response = await api.post<ChatResponse>('/chat', {
      query,
      conversation_history: conversationHistory,
      conversation_id: conversationId,
    })
    return response.data
  },
}

// Upload API - connects to /upload endpoint
export const uploadApi = {
  uploadAndAnalyze: async (file: File, text: string = '', conversationId?: number) => {
    const formData = new FormData()
    formData.append('image', file)
    if (text) {
      formData.append('text', text)
    }
    if (conversationId !== undefined) {
      formData.append('conversation_id', String(conversationId))
    }

    const response = await api.post<ChatResponse>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

// Auth API
export const authApi = {
  signup: async (email: string, name: string, password: string) => {
    const response = await api.post<{ user: AuthUser }>('/auth/signup', { email, name, password })
    return response.data.user
  },
  login: async (email: string, password: string) => {
    const response = await api.post<{ user: AuthUser }>('/auth/login', { email, password })
    return response.data.user
  },
  logout: async () => {
    await api.post('/auth/logout')
  },
  me: async () => {
    const response = await api.get<{ user: AuthUser }>('/auth/me')
    return response.data.user
  },
}

// Conversations API
export const conversationsApi = {
  list: async () => {
    const response = await api.get<{ conversations: ConversationSummary[] }>('/conversations')
    return response.data.conversations
  },
  get: async (id: number) => {
    const response = await api.get<{ conversation: ConversationDetail }>(`/conversations/${id}`)
    return response.data.conversation
  },
  remove: async (id: number) => {
    await api.delete(`/conversations/${id}`)
  },
}

// Prediction API - connects to /predict-medical endpoint
export const predictionApi = {
  predictMedical: async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    
    const response = await api.post<PredictionResult>('/predict-medical', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

// Validation API - connects to /validate endpoint
export const validationApi = {
  submitValidation: async (validationResult: string, comments?: string) => {
    const formData = new FormData()
    formData.append('validation_result', validationResult)
    if (comments) {
      formData.append('comments', comments)
    }
    
    const response = await api.post<ChatResponse>('/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

// Audio/Speech APIs
export const audioApi = {
  transcribe: async (file: File) => {
    const formData = new FormData()
    formData.append('audio', file)
    
    const response = await api.post('/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  generateSpeech: async (text: string, voiceId?: string) => {
    const response = await api.post(
      '/generate-speech',
      { text, voice_id: voiceId },
      { responseType: 'blob' }
    )
    return response.data
  },
}

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health')
  return response.data
}

export interface AgentInfo {
  id: string
  name: string
  description: string
  icon: string
  type: 'chat' | 'rag' | 'search' | 'vision'
  endpoint: string
}

export const AGENTS: AgentInfo[] = [
  {
    id: 'medical-chat',
    name: 'Medical Conversation',
    description: 'General medical Q&A with AI assistance',
    icon: 'MessageSquare',
    type: 'chat',
    endpoint: '/api/chat',
  },
  {
    id: 'medical-rag',
    name: 'Medical RAG',
    description: 'Document-based medical reasoning',
    icon: 'FileSearch',
    type: 'rag',
    endpoint: '/api/rag',
  },
  {
    id: 'web-search',
    name: 'Web Search',
    description: 'Search trusted medical sources',
    icon: 'Globe',
    type: 'search',
    endpoint: '/api/search',
  },
  {
    id: 'brain-tumor',
    name: 'Brain Tumor Detection',
    description: 'MRI scan analysis for tumor detection',
    icon: 'Brain',
    type: 'vision',
    endpoint: '/api/analyze/brain-tumor',
  },
  {
    id: 'chest-xray',
    name: 'Chest X-Ray Analysis',
    description: 'COVID-19 and pneumonia detection',
    icon: 'Scan',
    type: 'vision',
    endpoint: '/api/analyze/chest-xray',
  },
  {
    id: 'skin-lesion',
    name: 'Skin Lesion Analysis',
    description: 'Dermatology image segmentation',
    icon: 'Microscope',
    type: 'vision',
    endpoint: '/api/analyze/skin-lesion',
  },
]
