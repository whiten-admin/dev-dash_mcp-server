#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { DevDashClient } from './client.js'

const apiKey = process.env.DEVDASH_API_KEY
const baseUrl = process.env.DEVDASH_BASE_URL || 'https://your-domain.com'

if (!apiKey) {
  console.error('Error: DEVDASH_API_KEY environment variable is required')
  process.exit(1)
}

const client = new DevDashClient(baseUrl, apiKey)

const server = new McpServer({
  name: 'devdash',
  version: '0.2.0',
})

// ========================================
// タスク
// ========================================

server.tool(
  'tasks_list',
  'プロジェクトのタスク一覧を取得します。フィルタやページネーションに対応。',
  {
    project_id: z.string().uuid().describe('プロジェクトID'),
    status_id: z.string().uuid().optional().describe('ステータスIDでフィルタ'),
    assignee_id: z.string().uuid().optional().describe('担当者IDでフィルタ'),
    priority: z.enum(['high', 'medium', 'low']).optional().describe('優先度でフィルタ'),
    page: z.number().int().min(1).optional().describe('ページ番号 (デフォルト: 1)'),
    per_page: z.number().int().min(1).max(100).optional().describe('1ページあたりの件数 (デフォルト: 20, 最大: 100)'),
  },
  async (params) => {
    const result = await client.listTasks(params)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'tasks_get',
  '指定IDのタスク詳細を取得します。',
  {
    task_id: z.string().uuid().describe('タスクID'),
  },
  async ({ task_id }) => {
    const result = await client.getTask(task_id)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'tasks_create',
  '新しいタスクを作成します。',
  {
    title: z.string().min(1).max(255).describe('タスク名'),
    project_id: z.string().uuid().describe('プロジェクトID'),
    description: z.string().max(10000).optional().describe('タスクの詳細説明'),
    due_date: z.string().optional().describe('期限日 (YYYY-MM-DD)'),
    start_date: z.string().optional().describe('開始日 (YYYY-MM-DD)'),
    priority: z.enum(['high', 'medium', 'low']).optional().describe('優先度'),
    assignee_id: z.string().uuid().optional().describe('担当者ID'),
    milestone_id: z.string().uuid().optional().describe('マイルストーンID'),
    status_id: z.string().uuid().optional().describe('ステータスID'),
    estimated_hours: z.number().min(0).max(9999).optional().describe('見積もり工数 (時間)'),
  },
  async (params) => {
    const result = await client.createTask(params)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'tasks_update',
  'タスクを部分更新します。指定したフィールドのみが更新されます。',
  {
    task_id: z.string().uuid().describe('タスクID'),
    title: z.string().min(1).max(255).optional().describe('タスク名'),
    description: z.string().max(10000).nullable().optional().describe('タスクの詳細説明'),
    due_date: z.string().nullable().optional().describe('期限日 (YYYY-MM-DD)'),
    start_date: z.string().nullable().optional().describe('開始日 (YYYY-MM-DD)'),
    priority: z.enum(['high', 'medium', 'low']).nullable().optional().describe('優先度'),
    assignee_id: z.string().uuid().nullable().optional().describe('担当者ID'),
    milestone_id: z.string().uuid().nullable().optional().describe('マイルストーンID'),
    status_id: z.string().uuid().nullable().optional().describe('ステータスID'),
    estimated_hours: z.number().min(0).max(9999).nullable().optional().describe('見積もり工数 (時間)'),
  },
  async ({ task_id, ...updates }) => {
    const result = await client.updateTask(task_id, updates)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'tasks_delete',
  'タスクを削除（アーカイブ）します。',
  {
    task_id: z.string().uuid().describe('タスクID'),
  },
  async ({ task_id }) => {
    const result = await client.deleteTask(task_id)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'tasks_bulk_create',
  '複数のタスクを一括作成します（最大50件）。',
  {
    tasks: z.array(z.object({
      title: z.string().min(1).max(255).describe('タスク名'),
      project_id: z.string().uuid().describe('プロジェクトID'),
      description: z.string().max(10000).optional().describe('タスクの詳細説明'),
      due_date: z.string().optional().describe('期限日 (YYYY-MM-DD)'),
      start_date: z.string().optional().describe('開始日 (YYYY-MM-DD)'),
      priority: z.enum(['high', 'medium', 'low']).optional().describe('優先度'),
      assignee_id: z.string().uuid().optional().describe('担当者ID'),
      milestone_id: z.string().uuid().optional().describe('マイルストーンID'),
      status_id: z.string().uuid().optional().describe('ステータスID'),
      estimated_hours: z.number().min(0).max(9999).optional().describe('見積もり工数 (時間)'),
    })).min(1).max(50).describe('作成するタスクの配列（最大50件）'),
  },
  async ({ tasks }) => {
    const result = await client.bulkCreateTasks(tasks)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

// ========================================
// プロジェクト
// ========================================

server.tool(
  'projects_list',
  'ワークスペースのプロジェクト一覧を取得します。フィルタやページネーションに対応。',
  {
    status: z.string().optional().describe('ステータスでフィルタ'),
    methodology: z.enum(['waterfall', 'agile', 'hybrid']).optional().describe('開発手法でフィルタ'),
    phase: z.enum(['planning', 'requirements', 'design', 'development', 'testing', 'deployment', 'maintenance']).optional().describe('フェーズでフィルタ'),
    page: z.number().int().min(1).optional().describe('ページ番号 (デフォルト: 1)'),
    per_page: z.number().int().min(1).max(100).optional().describe('1ページあたりの件数 (デフォルト: 20, 最大: 100)'),
  },
  async (params) => {
    const result = await client.listProjects(params)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'projects_get',
  '指定IDのプロジェクト詳細を取得します。',
  {
    project_id: z.string().uuid().describe('プロジェクトID'),
  },
  async ({ project_id }) => {
    const result = await client.getProject(project_id)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'projects_create',
  '新しいプロジェクトを作成します。',
  {
    title: z.string().min(1).max(255).describe('プロジェクト名'),
    code: z.string().max(50).optional().describe('プロジェクトコード'),
    description: z.string().max(10000).optional().describe('プロジェクトの説明'),
    purpose: z.string().max(10000).optional().describe('プロジェクトの目的'),
    start_date: z.string().optional().describe('開始日 (YYYY-MM-DD)'),
    end_date: z.string().optional().describe('終了日 (YYYY-MM-DD)'),
    methodology: z.enum(['waterfall', 'agile', 'hybrid']).optional().describe('開発手法'),
    phase: z.enum(['planning', 'requirements', 'design', 'development', 'testing', 'deployment', 'maintenance']).optional().describe('フェーズ'),
    status: z.string().optional().describe('ステータス'),
    priority: z.string().optional().describe('優先度'),
    scale: z.number().int().min(0).optional().describe('規模 (人月)'),
    budget: z.number().int().min(0).optional().describe('予算'),
    client: z.string().optional().describe('クライアント名'),
    project_manager_id: z.string().uuid().optional().describe('プロジェクトマネージャーID'),
  },
  async (params) => {
    const result = await client.createProject(params)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'projects_update',
  'プロジェクトを部分更新します。指定したフィールドのみが更新されます。',
  {
    project_id: z.string().uuid().describe('プロジェクトID'),
    title: z.string().min(1).max(255).optional().describe('プロジェクト名'),
    code: z.string().max(50).nullable().optional().describe('プロジェクトコード'),
    description: z.string().max(10000).nullable().optional().describe('プロジェクトの説明'),
    start_date: z.string().nullable().optional().describe('開始日 (YYYY-MM-DD)'),
    end_date: z.string().nullable().optional().describe('終了日 (YYYY-MM-DD)'),
    methodology: z.enum(['waterfall', 'agile', 'hybrid']).nullable().optional().describe('開発手法'),
    phase: z.enum(['planning', 'requirements', 'design', 'development', 'testing', 'deployment', 'maintenance']).nullable().optional().describe('フェーズ'),
    status: z.string().nullable().optional().describe('ステータス'),
    priority: z.string().nullable().optional().describe('優先度'),
    scale: z.number().int().min(0).nullable().optional().describe('規模 (人月)'),
    budget: z.number().int().min(0).nullable().optional().describe('予算'),
    client: z.string().nullable().optional().describe('クライアント名'),
    project_manager_id: z.string().uuid().nullable().optional().describe('プロジェクトマネージャーID'),
  },
  async ({ project_id, ...updates }) => {
    const result = await client.updateProject(project_id, updates)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'projects_delete',
  'プロジェクトを削除（アーカイブ）します。',
  {
    project_id: z.string().uuid().describe('プロジェクトID'),
  },
  async ({ project_id }) => {
    const result = await client.deleteProject(project_id)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

// ========================================
// メンバー
// ========================================

server.tool(
  'members_list',
  'プロジェクトのメンバー一覧を取得します。',
  {
    project_id: z.string().uuid().describe('プロジェクトID'),
    page: z.number().int().min(1).optional().describe('ページ番号 (デフォルト: 1)'),
    per_page: z.number().int().min(1).max(100).optional().describe('1ページあたりの件数 (デフォルト: 20, 最大: 100)'),
  },
  async ({ project_id, ...params }) => {
    const result = await client.listMembers(project_id, params)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'members_get',
  '指定IDのプロジェクトメンバー詳細を取得します。',
  {
    project_id: z.string().uuid().describe('プロジェクトID'),
    member_id: z.string().uuid().describe('メンバーID'),
  },
  async ({ project_id, member_id }) => {
    const result = await client.getMember(project_id, member_id)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'members_add',
  'プロジェクトにメンバーを追加します。',
  {
    project_id: z.string().uuid().describe('プロジェクトID'),
    workspace_member_id: z.string().uuid().describe('ワークスペースメンバーID'),
    role_code: z.enum(['owner', 'project_manager', 'member']).optional().describe('ロール (デフォルト: member)'),
    assignment_rate: z.number().min(0).max(100).optional().describe('アサイン率 (%)'),
    skill_description: z.string().optional().describe('スキル説明'),
    workable_hours: z.number().min(0).max(24).optional().describe('稼働可能時間 (時間/日)'),
  },
  async ({ project_id, ...params }) => {
    const result = await client.addMember(project_id, params)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'members_update',
  'プロジェクトメンバーの情報を更新します。',
  {
    project_id: z.string().uuid().describe('プロジェクトID'),
    member_id: z.string().uuid().describe('メンバーID'),
    role_code: z.enum(['owner', 'project_manager', 'member']).optional().describe('ロール'),
    assignment_rate: z.number().min(0).max(100).nullable().optional().describe('アサイン率 (%)'),
    skill_description: z.string().nullable().optional().describe('スキル説明'),
    workable_hours: z.number().min(0).max(24).nullable().optional().describe('稼働可能時間 (時間/日)'),
  },
  async ({ project_id, member_id, ...updates }) => {
    const result = await client.updateMember(project_id, member_id, updates)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'members_remove',
  'プロジェクトからメンバーを削除します。',
  {
    project_id: z.string().uuid().describe('プロジェクトID'),
    member_id: z.string().uuid().describe('メンバーID'),
  },
  async ({ project_id, member_id }) => {
    const result = await client.removeMember(project_id, member_id)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

// ========================================
// マイルストーン
// ========================================

server.tool(
  'milestones_list',
  'プロジェクトのマイルストーン一覧を取得します。',
  {
    project_id: z.string().uuid().describe('プロジェクトID'),
    page: z.number().int().min(1).optional().describe('ページ番号 (デフォルト: 1)'),
    per_page: z.number().int().min(1).max(100).optional().describe('1ページあたりの件数 (デフォルト: 20, 最大: 100)'),
  },
  async ({ project_id, ...params }) => {
    const result = await client.listMilestones(project_id, params)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'milestones_get',
  '指定IDのマイルストーン詳細を取得します。',
  {
    project_id: z.string().uuid().describe('プロジェクトID'),
    milestone_id: z.string().uuid().describe('マイルストーンID'),
  },
  async ({ project_id, milestone_id }) => {
    const result = await client.getMilestone(project_id, milestone_id)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'milestones_create',
  '新しいマイルストーンを作成します。',
  {
    project_id: z.string().uuid().describe('プロジェクトID'),
    name: z.string().min(1).max(255).describe('マイルストーン名'),
    description: z.string().max(10000).optional().describe('説明'),
    start_date: z.string().optional().describe('開始日 (YYYY-MM-DD)'),
    due_date: z.string().optional().describe('期限日 (YYYY-MM-DD)'),
    status_id: z.string().uuid().optional().describe('ステータスID'),
  },
  async ({ project_id, ...params }) => {
    const result = await client.createMilestone(project_id, params)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'milestones_update',
  'マイルストーンを部分更新します。指定したフィールドのみが更新されます。',
  {
    project_id: z.string().uuid().describe('プロジェクトID'),
    milestone_id: z.string().uuid().describe('マイルストーンID'),
    name: z.string().min(1).max(255).optional().describe('マイルストーン名'),
    description: z.string().max(10000).nullable().optional().describe('説明'),
    start_date: z.string().nullable().optional().describe('開始日 (YYYY-MM-DD)'),
    due_date: z.string().nullable().optional().describe('期限日 (YYYY-MM-DD)'),
    status_id: z.string().uuid().nullable().optional().describe('ステータスID'),
  },
  async ({ project_id, milestone_id, ...updates }) => {
    const result = await client.updateMilestone(project_id, milestone_id, updates)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'milestones_delete',
  'マイルストーンを削除します。',
  {
    project_id: z.string().uuid().describe('プロジェクトID'),
    milestone_id: z.string().uuid().describe('マイルストーンID'),
  },
  async ({ project_id, milestone_id }) => {
    const result = await client.deleteMilestone(project_id, milestone_id)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

// ========================================
// ステータス
// ========================================

server.tool(
  'statuses_list',
  'ワークスペースのタスクステータス一覧を取得します。',
  {
    page: z.number().int().min(1).optional().describe('ページ番号 (デフォルト: 1)'),
    per_page: z.number().int().min(1).max(100).optional().describe('1ページあたりの件数 (デフォルト: 20, 最大: 100)'),
  },
  async (params) => {
    const result = await client.listStatuses(params)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'statuses_get',
  '指定IDのステータス詳細を取得します。',
  {
    status_id: z.string().uuid().describe('ステータスID'),
  },
  async ({ status_id }) => {
    const result = await client.getStatus(status_id)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'statuses_create',
  '新しいタスクステータスを作成します。',
  {
    name: z.string().min(1).max(100).describe('ステータス名'),
    category: z.enum(['not-started', 'in-progress', 'completed', 'on-hold', 'cancelled']).optional().describe('カテゴリ'),
    color: z.string().optional().describe('カラーコード (例: #FF0000)'),
    order_index: z.number().int().min(0).optional().describe('表示順序'),
  },
  async (params) => {
    const result = await client.createStatus(params)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

server.tool(
  'statuses_update',
  'ステータスを部分更新します。指定したフィールドのみが更新されます。',
  {
    status_id: z.string().uuid().describe('ステータスID'),
    name: z.string().min(1).max(100).optional().describe('ステータス名'),
    category: z.enum(['not-started', 'in-progress', 'completed', 'on-hold', 'cancelled']).nullable().optional().describe('カテゴリ'),
    color: z.string().nullable().optional().describe('カラーコード (例: #FF0000)'),
    order_index: z.number().int().min(0).optional().describe('表示順序'),
  },
  async ({ status_id, ...updates }) => {
    const result = await client.updateStatus(status_id, updates)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
