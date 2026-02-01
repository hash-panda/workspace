# 自动推送系统 - 完整配置指南

**更新时间**: 2026-02-01

---

## 🎯 系统概述

自动推送系统负责：
1. 定时任务触发（通过 cron）
2. 调用 GLM-4.7 生成内容
3. 推送到 Discord 频道

---

## 🔧 配置步骤

### 步骤1：配置 GLM API Key

**获取 API Key：**
1. 访问：https://open.bigmodel.cn/
2. 登录智谱账号
3. 进入 "API Keys" 页面
4. 创建新的 API Key

**配置到系统：**

编辑文件：`/root/.openclaw/workspace/config/glm.json`

```json
{
  "glm": {
    "apiKey": "你的API-Key",
    "model": "glm-4.7"
  }
}
```

---

### 步骤2：验证配置

```bash
# 测试自动推送
node /root/.openclaw/workspace/auto-push-v2.js TRIGGER_PRODUCT_HUNT_DAILY
```

**预期输出：**
```
[配置] GLM-4.7 已加载
[配置] Product Hunt 已加载
[推送] 收到触发信号: TRIGGER_PRODUCT_HUNT_DAILY
[推送] 开始生成 Product Hunt 每日精选
[GLM] 调用模型: glm-4.7
[GLM] ✅ 生成成功，长度: xxx
[推送] 已保存到: discord/logs/push-xxx.md
```

---

## 📦 文件说明

### 配置文件

```
config/
├── glm.json                    # GLM API 配置（必需）
├── product-hunt.json           # Product Hunt 配置
├── example-config.json         # 配置示例
└── GLM_SETUP.md               # GLM 配置详细指南
```

### 核心文件

```
auto-push-v2.js                # 自动推送处理器（v2版本）
discord/
├── data/                      # 推送数据存储
└── logs/                      # 推送日志
```

---

## 🚀 支持的触发器

| 触发器 | 时间 | 功能 | 频道 |
|--------|------|------|------|
| TRIGGER_PRODUCT_HUNT_DAILY | 09:00 | Product Hunt 每日精选 | 🏆-product-hunt |
| TRIGGER_WECHAT_MATERIAL_DAILY | 10:00 | 公众号素材推送 | 📝-公众号素材 |
| TRIGGER_AI_AGENT_LEARNING_0800 | 08:00 | AI Agent 学习目标 | ai-agent-learning |
| TRIGGER_AI_AGENT_LEARNING_1200 | 12:00 | AI Agent 深度讲解 | ai-agent-learning |
| TRIGGER_AI_AGENT_LEARNING_1800 | 18:00 | AI Agent 实战演练 | ai-agent-learning |
| TRIGGER_STOCK_MARKET_ANALYSIS | 15:30 | 股票盘后分析 | stock-analysis |
| TRIGGER_CRYPTO_MORNING_REPORT | 09:00 | 加密货币早报 | crypto-analysis |

---

## 🧪 测试命令

### 测试单个触发器

```bash
# 测试 Product Hunt 推送
node /root/.openclaw/workspace/auto-push-v2.js TRIGGER_PRODUCT_HUNT_DAILY

# 测试公众号素材推送
node /root/.openclaw/workspace/auto-push-v2.js TRIGGER_WECHAT_MATERIAL_DAILY

# 测试 AI Agent 学习
node /root/.openclaw/workspace/auto-push-v2.js TRIGGER_AI_AGENT_LEARNING_0800

# 测试股票分析
node /root/.openclaw/workspace/auto-push-v2.js TRIGGER_STOCK_MARKET_ANALYSIS

# 测试加密货币早报
node /root/.openclaw/workspace/auto-push-v2.js TRIGGER_CRYPTO_MORNING_REPORT
```

### 查看日志

```bash
# 查看最新的推送日志
ls -lt /root/.openclaw/workspace/discord/logs/ | head -5

# 查看某个日志文件
cat /root/.openclaw/workspace/discord/logs/push-xxx.md
```

---

## 🔍 故障排查

### 问题1：GLM API Key 未配置

**错误信息：**
```
[错误] GLM 配置未找到
```

**解决方案：**
1. 检查 `/root/.openclaw/workspace/config/glm.json` 是否存在
2. 确保 `apiKey` 字段已填入你的 API Key
3. 重新测试

---

### 问题2：GLM API 调用失败

**错误信息：**
```
[GLM] API 错误: 401
❌ GLM API Key 无效或已过期
```

**解决方案：**
1. 检查 API Key 是否正确
2. 确认 API Key 未过期
3. 重新生成 API Key 并更新配置

---

### 问题3：频率超限

**错误信息：**
```
[GLM] API 错误: 429
❌ GLM API 调用频率超限
```

**解决方案：**
1. 检查套餐额度是否用完
2. 降低调用频率
3. 联系智谱升级套餐

---

### 问题4：推送失败

**错误信息：**
```
[推送] ❌ 处理失败: ...
```

**解决方案：**
1. 查看日志文件了解详细错误
2. 检查 Discord 频道ID是否正确
3. 确认 Bot 有发送消息权限

---

## 📊 GLM-4.7 配额管理

**年包会员：**
- 100万 tokens/月
- QPS 20
- 适合高频调用

**查看额度：**
1. 登录 https://open.bigmodel.cn/
2. 查看 "用量统计"
3. 监控 Token 使用情况

---

## 🎯 下一步

配置完成后：

1. **测试推送功能**
   ```bash
   node /root/.openclaw/workspace/auto-push-v2.js TRIGGER_PRODUCT_HUNT_DAILY
   ```

2. **查看推送日志**
   ```bash
   cat /root/.openclaw/workspace/discord/logs/push-*.md | tail -50
   ```

3. **配置 Discord Webhook（可选）**
   - 创建 Discord Webhook
   - 配置到 `config/glm.json`
   - 实现真正推送到 Discord

4. **等待定时任务自动触发**
   - 所有定时任务已配置
   - 下次运行时间见 cron list

---

## 📞 获取帮助

- GLM 文档：https://open.bigmodel.cn/dev/api
- 智谱AI文档：https://docs.bigmodel.cn/
- Cron 文档：`openclaw cron list`

---

**配置完成后，告诉我："GLM已配置"

我会测试推送功能！
