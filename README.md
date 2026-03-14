# devDash MCP Server

AIアシスタント（Claude等）からdevDashのタスクを操作するための[MCP (Model Context Protocol)](https://modelcontextprotocol.io)サーバーです。

## 必要なもの

- **Node.js** v18以上
- **devDash APIキー** — devDashの管理画面 > 設定 > 外部連携 から発行できます
- **MCPに対応したAIクライアント** — Claude Desktop、Claude Code、Cursor など

## セットアップ

### 1. APIキーを用意する

devDashにログインし、ワークスペースの **設定 > 外部連携 > APIキーを作成** からキーを発行してください。

- スコープは用途に応じて選択（`tasks:read` で参照のみ、`tasks:write` を追加で作成・更新・削除も可能）
- 発行時に表示される `dd_sk_xxxxxxxx...` をコピーしておいてください（**1回しか表示されません**）

### 2. Claude Desktop に設定する

Claude Desktopの設定ファイルを開きます。

**Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

以下を追加:

```json
{
  "mcpServers": {
    "devdash": {
      "command": "npx",
      "args": ["-y", "devdash-mcp"],
      "env": {
        "DEVDASH_API_KEY": "dd_sk_ここにAPIキーを貼り付け",
        "DEVDASH_BASE_URL": "https://your-domain.com"
      }
    }
  }
}
```

> **npm公開前（開発者向け）**: `npx` の代わりにローカルパスを指定してください。
>
> ```json
> {
>   "mcpServers": {
>     "devdash": {
>       "command": "node",
>       "args": ["/path/to/mcp-server/dist/index.js"],
>       "env": {
>         "DEVDASH_API_KEY": "dd_sk_ここにAPIキーを貼り付け",
>         "DEVDASH_BASE_URL": "http://localhost:3000"
>       }
>     }
>   }
> }
> ```

### 3. Cursor に設定する

プロジェクトルートに `.cursor/mcp.json` を作成します（グローバル設定の場合は `~/.cursor/mcp.json`）。

```json
{
  "mcpServers": {
    "devdash": {
      "command": "npx",
      "args": ["-y", "devdash-mcp"],
      "env": {
        "DEVDASH_API_KEY": "dd_sk_ここにAPIキーを貼り付け",
        "DEVDASH_BASE_URL": "https://your-domain.com"
      }
    }
  }
}
```

> **npm公開前（開発者向け）**: `"command": "node"`, `"args": ["/path/to/mcp-server/dist/index.js"]` に置き換えてください。

設定後、Cursorを再起動すると MCP ツールが利用可能になります。

### 4. Codex に設定する

プロジェクトルートに `codex-mcp.json` を作成します。

```json
{
  "mcpServers": {
    "devdash": {
      "command": "npx",
      "args": ["-y", "devdash-mcp"],
      "env": {
        "DEVDASH_API_KEY": "dd_sk_ここにAPIキーを貼り付け",
        "DEVDASH_BASE_URL": "https://your-domain.com"
      }
    }
  }
}
```

Codex起動時に `--mcp-config` フラグで指定します:

```bash
codex --mcp-config codex-mcp.json
```

### 5. Claude Code に設定する

```bash
claude mcp add devdash \
  -e DEVDASH_API_KEY=dd_sk_ここにAPIキーを貼り付け \
  -e DEVDASH_BASE_URL=https://your-domain.com \
  -- npx -y devdash-mcp
```

> **npm公開前（開発者向け）**:
> ```bash
> claude mcp add devdash \
>   -e DEVDASH_API_KEY=dd_sk_xxxxx \
>   -e DEVDASH_BASE_URL=http://localhost:3000 \
>   -- node /path/to/mcp-server/dist/index.js
> ```

### 6. 動作確認

AIクライアントを再起動し、以下のように話しかけてください:

```
devDashのプロジェクト一覧からタスクを取得して
```

MCPサーバーが正しく接続されていれば、`tasks_list` ツールが呼び出されます。

---

## 使えるツール

| ツール名 | 機能 | 必要なスコープ |
|---------|------|--------------|
| `tasks_list` | タスク一覧取得（フィルタ・ページネーション対応） | `tasks:read` |
| `tasks_get` | タスク詳細取得 | `tasks:read` |
| `tasks_create` | タスク作成 | `tasks:write` |
| `tasks_update` | タスク部分更新 | `tasks:write` |
| `tasks_delete` | タスク削除（アーカイブ） | `tasks:write` |

## 使用例

Claudeに以下のようなリクエストができます:

- 「プロジェクトXXXのタスク一覧を見せて」
- 「"ログイン画面のバグ修正"というタスクをプロジェクトXXXに作って、優先度はhighで」
- 「タスクXXXの期限を来週金曜に変更して」
- 「完了したタスクXXXを削除して」

## 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `DEVDASH_API_KEY` | Yes | devDashのAPIキー（`dd_sk_` で始まる文字列） |
| `DEVDASH_BASE_URL` | No | devDashのURL（デフォルト: `https://your-domain.com`） |

## 開発者向け: ローカルでビルド・テスト

```bash
# 依存関係インストール
cd mcp-server
npm install

# ビルド
npm run build

# 動作テスト（stdioで起動して即終了しなければOK）
DEVDASH_API_KEY=dd_sk_test DEVDASH_BASE_URL=http://localhost:3000 node dist/index.js
# → 何も出力されずプロセスが待機状態になれば正常（Ctrl+Cで終了）
```

## トラブルシューティング

### ツールが表示されない

- Claude DesktopまたはClaude Codeを再起動してください
- 設定ファイルのJSONが正しいか確認してください（カンマの過不足など）

### "DEVDASH_API_KEY environment variable is required"

- `env` に `DEVDASH_API_KEY` が正しく設定されているか確認してください

### "devDash API error: Authentication required"

- APIキーが正しいか確認してください
- APIキーが無効化されていないか、devDashの管理画面で確認してください

### "devDash API error: Scope tasks:write is required"

- APIキーに `tasks:write` スコープが付与されているか確認してください
- 参照のみのキーでは作成・更新・削除はできません

### "devDash API error: Rate limit exceeded"

- 1分あたり100リクエストの制限があります。しばらく待ってから再試行してください
