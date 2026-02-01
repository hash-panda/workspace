# GLM-4.7 正确集成指南

**基于智谱AI官方文档**

---

## 🔧 安装 Coding Helper（一键配置工具）

### 前提条件
- Node.js >= v18.0.0
- 已购买 GLM Coding Plan

### 安装步骤

```bash
# 全局安装 coding-helper
npm install -g @z_ai/coding-helper

# 验证安装
coding-helper --version
```

---

## 🔑 配置 GLM API Key

### 方式1：交互式配置（推荐）

```bash
coding-helper auth
```

按照提示：
1. 选择 "glm_coding_plan_china"（中国套餐）
2. 粘贴你的 API Key
3. 完成配置

### 方式2：命令行配置

```bash
coding-helper auth glm_coding_plan_china <你的API-Key>
```

### 验证配置

```bash
coding-helper doctor
```

显示配置状态和工具状态

---

## 🚀 使用 GLM-4.7

### 在代码中自动使用

配置完成后，Claude Code 会自动使用 GLM 模型：

```javascript
// 直接调用，无需手动配置 API Key
const response = await llm.chat({
  model: 'glm-4.7',
  messages: [
    { role: 'system', content: '你是一个...' },
    { role: 'user', content: '用户的问题' }
  ]
})
```

### 手动切换模型

编辑配置文件 `~/.claude/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7"
  }
}
```

---

## 📋 常用命令

```bash
# 初始化向导
coding-helper init

# 查看当前语言
coding-helper lang show

# 设置为中文
coding-helper lang set zh_CN

# 配置密钥
coding-helper auth

# 删除密钥
coding-helper auth revoke

# 重新加载到 Claude Code
coding-helper auth reload claude

# 检查状态
coding-helper doctor

# 显示帮助
coding-helper --help

# 显示版本
coding-helper --version
```

---

## 💰 GLM Coding Plan 配额

**年包会员：**
- 100万 tokens/月
- QPS 20
- 支持模型：
  - glm-4.5-air
  - glm-4.7（最新）

---

## ⚠️ 重要说明

1. **不需要手动配置 API Key**
   - coding-helper 会自动管理
   - 所有工具自动集成 GLM

2. **安装后立即使用**
   - 任何支持的工具（Claude Code 等）自动切换到 GLM
   - 无需修改代码

3. **配置位置**
   - 配置文件：`~/.claude/settings.json`
   - 密钥自动加密存储

---

## 🔧 排查问题

### 配置不生效

```bash
# 1. 关闭所有 Claude Code 窗口
# 2. 打开新的命令行窗口
# 3. 运行 claude 启动

# 如果问题仍然存在
# 删除配置文件，重新配置
rm ~/.claude/settings.json
coding-helper auth glm_coding_plan_china <你的API-Key>
```

### 检查配置文件格式

```bash
# 使用在线 JSON 校验工具
# 检查变量名称是否正确
# 检查是否有少逗号或多逗号
```

---

## ✅ 验证安装成功

```bash
# 1. 检查版本
coding-helper --version

# 2. 检查状态
coding-helper doctor

# 3. 启动 Claude Code
claude

# 4. 在 Claude Code 中查看状态
/status
```

---

**配置完成后，告诉我："GLM已配置"**

我会更新自动推送代码，使用 GLM 模型！
