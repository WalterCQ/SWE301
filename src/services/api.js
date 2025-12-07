const API_BASE_URL = 'http://localhost:3000/api'

async function post(url, body, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Request failed')
    error.status = response.status
    throw error
  }

  return data
}

async function get(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Request failed')
    error.status = response.status
    throw error
  }

  return data
}

const api = { get, post }
export default api
