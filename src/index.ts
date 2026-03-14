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
  version: '0.1.0',
})

// タスク一覧取得
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

// タスク詳細取得
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

// タスク作成
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

// タスク更新
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

// タスク削除
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

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
