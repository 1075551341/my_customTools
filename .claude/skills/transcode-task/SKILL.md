---
name: transcode-task
description: 管理转码任务（创建、查询、取消、重试），支持视频/图片/文档/动图
---

# 转码任务管理

管理媒体转码任务的全生命周期。

## 使用方式

```
/transcode-task <action> [options]
```

**动作说明：**
- `list`: 获取任务列表
- `get`: 获取单个任务详情
- `cancel`: 取消进行中的任务
- `retry`: 重试失败的任务
- `clean`: 清理已完成任务

## 任务类型

| 类型 | 说明 | 配置参数 |
|------|------|----------|
| video | 视频转码 | codec、resolution、bitrate、fps |
| image | 图片转码 | format、quality、width、height |
| document | 文档转换 | targetFormat、merge/split |
| anim | 动图处理 | format、fps、quality |

## 执行步骤

### 1. 创建转码任务

```bash
# 上传文件并创建任务
curl -X POST http://localhost:3001/api/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@/path/to/video.mp4" \
  -F "type=video" \
  -F "config={\"codec\":\"h264\",\"resolution\":\"1080p\"}"
```

### 2. 查询任务状态

```bash
# 获取任务列表
curl -X GET "http://localhost:3001/api/tasks?status=processing&page=1&limit=20" \
  -H "Authorization: Bearer <TOKEN>"

# 获取单个任务详情
curl -X GET http://localhost:3001/api/tasks/<taskId> \
  -H "Authorization: Bearer <TOKEN>"
```

### 3. 任务状态流转

```
waiting → uploading → processing → completed/failed/cancelled
```

### 4. 取消任务

```bash
curl -X POST http://localhost:3001/api/tasks/<taskId>/cancel \
  -H "Authorization: Bearer <TOKEN>"
```

### 5. 重试失败任务

```bash
curl -X POST http://localhost:3001/api/tasks/<taskId>/retry \
  -H "Authorization: Bearer <TOKEN>"
```

### 6. 订阅任务进度（WebSocket）

```javascript
// 客户端订阅
socket.emit("subscribe:task", taskId);

// 接收进度更新
socket.on("task:progress", (data) => {
  console.log(`进度：${data.progress}%`);
});

// 任务完成
socket.on("task:completed", (data) => {
  console.log("转码完成", data.outputPath);
});
```

## 示例

```
用户：/transcode-task list --status=processing

助手：获取进行中的转码任务...

执行命令：
curl http://localhost:3001/api/tasks?status=processing

返回结果：
{
  "code": 0,
  "data": {
    "tasks": [
      {
        "id": "task_001",
        "type": "video",
        "status": "processing",
        "progress": 45,
        "inputFile": "video.mp4",
        "config": {"codec": "h264", "resolution": "1080p"}
      }
    ],
    "total": 1
  }
}
```

## 注意事项

1. **任务配置**：创建任务时指定编码器配置
2. **进度查询**：通过 WebSocket 实时推送或轮询 API
3. **资源管理**：定期清理已完成任务释放存储空间
4. **并发限制**：检查队列配置避免资源耗尽
