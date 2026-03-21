---
name: send-message
description: 发送系统通知或待办消息给用户，支持 WebSocket 实时推送
---

# 发送消息

通过 API 创建系统消息，支持普通通知和待办事项两种类型。

## 使用方式

```
/send-message <type> <title> <content> [options]
```

**参数说明：**
- `<type>`: 消息类型 - `normal`（普通通知） | `todo`（待办事项）
- `<title>`: 消息标题
- `<content>`: 消息内容
- `[options]`: 可选参数
  - `--link`: 关联链接（如任务详情页面）
  - `--user`: 指定接收用户 ID（默认发送给当前用户）

## 执行步骤

### 1. 确认消息信息

询问用户（如未提供）：
- 消息类型：普通通知 / 待办事项
- 消息标题：简洁明了
- 消息内容：详细描述
- 是否需要关联链接

### 2. 获取认证 Token

```bash
# 先登录获取 Token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<password>"}'
```

从响应中提取 Token：
```json
{
  "data": {
    "token": "eyJhbGc..."
  }
}
```

### 3. 发送消息

```bash
curl -X POST http://localhost:3001/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "type": "<type>",
    "title": "<title>",
    "content": "<content>",
    "link": "<link>"
  }'
```

### 4. 验证消息

发送后验证消息是否创建成功：

```bash
curl -X GET http://localhost:3001/api/messages/latest \
  -H "Authorization: Bearer <TOKEN>"
```

## 示例

```
用户：/send-message todo "转码任务完成" "视频 transcode_001 已处理完成，请下载查看" --link "/tasks/001"

助手：我将发送待办消息通知。

执行命令：
curl -X POST http://localhost:3001/api/messages \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "type": "todo",
    "title": "转码任务完成",
    "content": "视频 transcode_001 已处理完成，请下载查看",
    "link": "/tasks/001"
  }'

✅ 消息发送成功，用户将通过 WebSocket 实时收到推送。
```

## 注意事项

1. **认证要求**：需要有效的 JWT Token
2. **WebSocket 推送**：消息创建后会自动推送给在线用户
3. **消息类型**：
   - `normal`: 普通系统通知
   - `todo`: 待办事项（需要用户处理）
4. **权限控制**：只有管理员可以创建消息
