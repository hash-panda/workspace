# Discord Webhook 配置指南

## 🔧 创建 Discord Webhook

### 步骤1：进入服务器设置

1. 打开 Discord
2. 选择你的服务器
3. 点击 "服务器设置"（齿轮图标）
4. 选择 "整合" → "Webhooks"

### 步骤2：创建 Webhook

1. 点击 "新建 Webhook"
2. 填写配置：
   - **名称**：OpenClaw Auto Push
   - **频道**：选择目标频道
     - 🏆-product-hunt
     - 📝-公众号素材
     - ai-agent-learning
     - stock-analysis
     - crypto-analysis
   - **头像**：可选
   - **用户名**：OpenClaw

3. 点击 "保存" 或 "复制 Webhook URL"

### 步骤3：复制 Webhook URL

**你会得到类似这样的 URL：**
```
https://discord.com/api/webhooks/1234567890/abcdefg-hijklmnopqrst
```

---

## 📋 配置到系统

**编辑文件：** `/root/.openclaw/workspace/config/glm.json`

```json
{
  "glm": {
    "apiKey": "d1cb53d363dc4f6db522a73ef3982722.aEvhNCCSePI1i4cZ",
    "model": "glm-4.7"
  },
  "discord": {
    "webhookUrl": "你的Discord Webhook URL",
    "username": "OpenClaw",
    "avatarUrl": ""
  }
}
```

---

## 🎯 Webhook 说明

**单个 Webhook vs 多个 Webhook：**

**选项A：使用单个 Webhook（简单）**
- 创建一个 Webhook
- 指向一个频道（如"常规"频道）
- 所有推送内容发送到同一频道

**选项B：使用多个 Webhook（推荐）**
- 为每个目标频道创建一个 Webhook
- 每个推送发送到对应频道
- 需要修改代码支持多个 webhookUrl

---

## 🚀 Webhook 使用方式

### 发送纯文本消息
```json
{
  "content": "消息内容"
}
```

### 发送嵌入消息（Embed）
```json
{
  "content": "消息内容",
  "embeds": [
    {
      "title": "标题",
      "description": "描述",
      "color": 3447003,
      "fields": [
        {
          "name": "字段名",
          "value": "字段值"
        }
      ]
    }
  ]
}
```

---

## ⚠️ 重要提示

1. **Webhook URL 安全**
   - 不要公开分享
   - 不要提交到 GitHub
   - 如果泄露，重新生成

2. **权限要求**
   - Bot 需要有 "发送消息" 权限
   - Webhook 只能发送到配置的频道

3. **速率限制**
   - Discord Webhook 有速率限制
   - 避免短时间内发送大量消息

4. **Webhook 过期**
   - Webhook 会过期（通常是永久的，除非手动删除）
   - 如果 Webhook 失效，需要重新创建

---

## 🔧 测试 Webhook

**创建后，测试 Webhook 是否工作：**

```bash
curl -X POST <你的Webhook URL> \
  -H "Content-Type: application/json" \
  -d '{"content": "Webhook 测试消息"}'
```

---

## 📞 获取帮助

如果遇到问题：
1. 检查 Webhook URL 是否正确
2. 检查 Bot 是否在服务器中
3. 检查 Bot 是否有发送权限
4. 查看 Discord 开发文档

---

**创建 Webhook 后，告诉我 Webhook URL！**

我会实现真正的 Discord 推送功能！
