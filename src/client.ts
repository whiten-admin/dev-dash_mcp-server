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

  // ========================================
  // タスク
  // ========================================

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

  // ========================================
  // プロジェクト
  // ========================================

  async listProjects(params?: {
    status?: string
    methodology?: string
    phase?: string
    page?: number
    per_page?: number
  }) {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.methodology) query.set('methodology', params.methodology)
    if (params?.phase) query.set('phase', params.phase)
    if (params?.page) query.set('page', String(params.page))
    if (params?.per_page) query.set('per_page', String(params.per_page))

    const qs = query.toString()
    return this.request(`/api/v1/projects${qs ? `?${qs}` : ''}`)
  }

  async getProject(projectId: string) {
    return this.request(`/api/v1/projects/${projectId}`)
  }

  async createProject(params: {
    title: string
    code?: string
    description?: string
    purpose?: string
    start_date?: string
    end_date?: string
    methodology?: string
    phase?: string
    status?: string
    priority?: string
    scale?: number
    budget?: number
    target_profit_rate?: number
    currency_code?: string
    client?: string
    project_manager_id?: string
    risks?: string
  }) {
    return this.request('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async updateProject(projectId: string, updates: Record<string, any>) {
    return this.request(`/api/v1/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteProject(projectId: string) {
    return this.request(`/api/v1/projects/${projectId}`, {
      method: 'DELETE',
    })
  }

  // ========================================
  // メンバー
  // ========================================

  async listMembers(projectId: string, params?: {
    page?: number
    per_page?: number
  }) {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.per_page) query.set('per_page', String(params.per_page))

    const qs = query.toString()
    return this.request(`/api/v1/projects/${projectId}/members${qs ? `?${qs}` : ''}`)
  }

  async getMember(projectId: string, memberId: string) {
    return this.request(`/api/v1/projects/${projectId}/members/${memberId}`)
  }

  async addMember(projectId: string, params: {
    workspace_member_id: string
    role_code?: string
    assignment_rate?: number
    skill_description?: string
    workable_hours?: number
  }) {
    return this.request(`/api/v1/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async updateMember(projectId: string, memberId: string, updates: Record<string, any>) {
    return this.request(`/api/v1/projects/${projectId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async removeMember(projectId: string, memberId: string) {
    return this.request(`/api/v1/projects/${projectId}/members/${memberId}`, {
      method: 'DELETE',
    })
  }

  // ========================================
  // マイルストーン
  // ========================================

  async listMilestones(projectId: string, params?: {
    page?: number
    per_page?: number
  }) {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.per_page) query.set('per_page', String(params.per_page))

    const qs = query.toString()
    return this.request(`/api/v1/projects/${projectId}/milestones${qs ? `?${qs}` : ''}`)
  }

  async getMilestone(projectId: string, milestoneId: string) {
    return this.request(`/api/v1/projects/${projectId}/milestones/${milestoneId}`)
  }

  async createMilestone(projectId: string, params: {
    name: string
    description?: string
    start_date?: string
    due_date?: string
    status_id?: string
  }) {
    return this.request(`/api/v1/projects/${projectId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async updateMilestone(projectId: string, milestoneId: string, updates: Record<string, any>) {
    return this.request(`/api/v1/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteMilestone(projectId: string, milestoneId: string) {
    return this.request(`/api/v1/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'DELETE',
    })
  }

  // ========================================
  // ステータス
  // ========================================

  async listStatuses(params?: {
    page?: number
    per_page?: number
  }) {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.per_page) query.set('per_page', String(params.per_page))

    const qs = query.toString()
    return this.request(`/api/v1/statuses${qs ? `?${qs}` : ''}`)
  }

  async getStatus(statusId: string) {
    return this.request(`/api/v1/statuses/${statusId}`)
  }

  async createStatus(params: {
    name: string
    category?: string
    color?: string
    order_index?: number
  }) {
    return this.request('/api/v1/statuses', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async updateStatus(statusId: string, updates: Record<string, any>) {
    return this.request(`/api/v1/statuses/${statusId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteStatus(statusId: string) {
    return this.request(`/api/v1/statuses/${statusId}`, {
      method: 'DELETE',
    })
  }
}
