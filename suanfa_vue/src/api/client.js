// ============================================================
// 后端 API 客户端（阶段三）
// 设计原则：优先请求后端，失败（后端未部署/离线）时回退本地数据，
// 保证纯静态部署（无后端）时网站功能完整可用。
// ============================================================

import { algorithms } from '../data/algorithms.js'

const API_BASE = '/api'

/** 后端是否可用（懒探测缓存） */
let backendAvailable = null

async function checkBackend() {
  if (backendAvailable !== null) return backendAvailable
  try {
    const res = await fetch(`${API_BASE}/algorithms`, { method: 'HEAD' })
    backendAvailable = res.ok
  } catch {
    backendAvailable = false
  }
  return backendAvailable
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const err = new Error(body?.message || `请求失败 (${res.status})`)
    err.status = res.status
    throw err
  }
  return res.json()
}

// ============================================================
// 算法元数据（后端优先，本地兜底）
// ============================================================

export async function fetchAlgorithms() {
  if (await checkBackend()) {
    return request('/algorithms')
  }
  return algorithms
}

export async function fetchAlgorithmById(id) {
  if (await checkBackend()) {
    return request(`/algorithms/${id}`)
  }
  return algorithms.find((a) => a.id === id) || null
}

// ============================================================
// 认证
// ============================================================

export async function register(username, password) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export async function login(username, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export async function logout() {
  return request('/auth/logout', { method: 'POST' })
}

export async function fetchCurrentUser() {
  return request('/auth/me')
}

// ============================================================
// 学习进度
// ============================================================

export async function fetchProgress(userId) {
  return request(`/users/${userId}/progress`)
}

export async function updateProgress(userId, algorithmId, status) {
  return request(`/users/${userId}/progress/${algorithmId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

export { checkBackend }
