/**
 * devDash Public API クライアント
 * MCPサーバーからdevDashのREST APIを呼び出す
 */
export class DevDashClient {
  constructor(
    private baseUrl: string,
    private apiKey: string
  ) {}

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${path}`
    const res = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const body = await res.json()

    if (!res.ok) {
      const message = body.error?.message || body.error || `HTTP ${res.status}`
      throw new Error(`devDash API error: ${message}`)
    }

    return body
  }

  async listTasks(params: {
    project_id: string
    status_id?: string
    assignee_id?: string
    priority?: string
    page?: number
    per_page?: number
  }) {
    const query = new URLSearchParams()
    query.set('project_id', params.project_id)
    if (params.status_id) query.set('status_id', params.status_id)
    if (params.assignee_id) query.set('assignee_id', params.assignee_id)
    if (params.priority) query.set('priority', params.priority)
    if (params.page) query.set('page', String(params.page))
    if (params.per_page) query.set('per_page', String(params.per_page))

    return this.request(`/api/v1/tasks?${query.toString()}`)
  }

  async getTask(taskId: string) {
    return this.request(`/api/v1/tasks/${taskId}`)
  }

  async createTask(params: {
    title: string
    project_id: string
    description?: string
    due_date?: string
    start_date?: string
    priority?: string
    assignee_id?: string
    milestone_id?: string
    status_id?: string
    estimated_hours?: number
  }) {
    return this.request('/api/v1/tasks', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async updateTask(taskId: string, updates: Record<string, any>) {
    return this.request(`/api/v1/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteTask(taskId: string) {
    return this.request(`/api/v1/tasks/${taskId}`, {
      method: 'DELETE',
    })
  }
}
