---
name: ws-debug
description: 调试 WebSocket 实时连接，检查消息推送和任务进度订阅
---

# WebSocket 调试

调试 Socket.io 实时连接，验证消息推送功能。

## 使用方式

```
/ws-debug <action>
```

**动作说明：**

- `check`: 检查 WebSocket 服务状态
- `connect`: 测试连接
- `subscribe`: 订阅任务/队列
- `monitor`: 监控消息流
- `events`: 列出所有事件

## Socket.io 事件

### 客户端 → 服务端

| 事件                | 参数   | 说明             |
| ------------------- | ------ | ---------------- |
| `subscribe:task`    | taskId | 订阅特定任务进度 |
| `unsubscribe:task`  | taskId | 取消订阅任务     |
| `subscribe:queue`   | -      | 订阅队列状态更新 |
| `subscribe:message` | -      | 订阅新消息推送   |

### 服务端 → 客户端

| 事件             | 数据                        | 说明         |
| ---------------- | --------------------------- | ------------ |
| `task:progress`  | {taskId, progress, message} | 任务进度更新 |
| `task:completed` | {taskId, outputPath}        | 任务完成     |
| `task:failed`    | {taskId, error}             | 任务失败     |
| `queue:update`   | {pending, processing}       | 队列状态     |
| `message:push`   | Message                     | 新消息推送   |
| `system:notice`  | {type, message}             | 系统通知     |

## 调试步骤

### 1. 检查服务状态

```bash
# 检查 Socket.io 服务是否运行
curl http://localhost:3001/api/system/health
```

### 2. 测试连接（使用浏览器控制台）

```javascript
// 连接到 Socket.io
const socket = io("http://localhost:3001", {
  auth: { token: "YOUR_JWT_TOKEN" },
});

// 监听连接状态
socket.on("connect", () => {
  console.log("已连接:", socket.id);
});

socket.on("disconnect", () => {
  console.log("已断开");
});

socket.on("connect_error", (err) => {
  console.error("连接错误:", err.message);
});
```

### 3. 订阅任务进度

```javascript
const taskId = "task_001";

// 订阅
socket.emit("subscribe:task", taskId);

// 接收进度
socket.on("task:progress", (data) => {
  console.log(`${data.taskId}: ${data.progress}% - ${data.message}`);
});

// 取消订阅
socket.emit("unsubscribe:task", taskId);
```

### 4. 监控消息流

```javascript
// 监听所有消息
socket.on("message:push", (message) => {
  console.log("新消息:", message.title, message.content);
});

socket.on("task:completed", (data) => {
  console.log("任务完成:", data);
});

socket.on("queue:update", (data) => {
  console.log("队列更新:", data);
});
```

### 5. 使用 Playwright 测试

```javascript
// 使用浏览器自动化测试 WebSocket
const { test, expect } = require("@playwright/test");

test("WebSocket 消息推送", async ({ page }) => {
  await page.goto("http://localhost:5173");

  // 等待 Socket 连接
  await page.waitForFunction(() => {
    return window.socket && window.socket.connected;
  });

  // 触发任务
  await page.click('[data-testid="start-transcode"]');

  // 等待进度更新
  const progressUpdate = await page.waitForEvent("console", {
    predicate: (msg) => msg.text().includes("task:progress"),
  });

  console.log(await progressUpdate.text());
});
```

## 常见问题排查

| 问题       | 可能原因   | 解决方案                      |
| ---------- | ---------- | ----------------------------- |
| 连接失败   | Token 过期 | 重新登录获取新 Token          |
| 收不到推送 | 未订阅事件 | 检查 `emit('subscribe:task')` |
| 连接断开   | 服务重启   | 实现重连逻辑                  |
| 消息重复   | 重复订阅   | 取消订阅后再重新订阅          |

## 注意事项

1. **认证**：连接时需提供有效的 JWT Token
2. **重连**：客户端应实现自动重连机制
3. **清理**：页面卸载前取消所有订阅
4. **性能**：避免同时订阅过多任务
