// 修复推送 - 从 reasoning_content 提取内容
// GLM-4.7 的推理内容在 reasoning_content 字段，不是 content

const fs = require('fs')

// GLM 配置
let GLM_API_KEY = ''
let DISCORD_CONFIG = {
  webhooks: {
    'product-hunt': '',
    'news-selection': '',
    'tools-radar': '',
    'wechat-material': '',
    'ai-agent-learning': '',
    'stock-analysis': '',
    'crypto-analysis': ''
  },
  username: '🤖 OpenClaw'
}

try {
  const config = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/config/glm.json', 'utf8'))
  GLM_API_KEY = config.glm.apiKey
  if (config.discord && config.discord.webhooks) {
    DISCORD_CONFIG.webhooks = config.discord.webhooks
    if (config.discord.username) {
      DISCORD_CONFIG.username = config.discord.username
    }
  }
  console.log('[配置] GLM-4.7 已加载')
  console.log('[配置] Discord Webhooks:', Object.keys(DISCORD_CONFIG.webhooks).length)
} catch (e) {
  console.error('[错误] GLM 配置未找到:', e.message)
}

// 延迟函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 调用 GLM API（修复版 - 支持 reasoning_content）
async function callGLM({ model = 'glm-4.7', messages, temperature = 0.7 }) {
  if (!GLM_API_KEY) {
    const errorMsg = '❌ GLM API Key 未配置'
    console.error('[错误] ' + errorMsg)
    return { success: false, error: errorMsg }
  }

  try {
    console.log(`[GLM] 调用模型: ${model}`)
    console.log(`[GLM] 消息数: ${messages.length}`)

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: 2000,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[GLM] API 错误: ${response.status}`)
      console.error(`[GLM] 错误详情: ${errorText}`)

      if (response.status === 429) {
        return { success: false, error: '❌ GLM API 频率限制，请稍后重试' }
      }

      if (response.status === 401) {
        return { success: false, error: '❌ GLM API Key 无效或已过期' }
      }

      return { success: false, error: `❌ GLM API 调用失败 (${response.status}): ${errorText}` }
    }

    const data = await response.json()

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const message = data.choices[0].message
      
      // 尝试从 content 获取内容
      let content = message.content || ''
      
      // 如果 content 为空，尝试从 reasoning_content 提取
      if (!content && message.reasoning_content) {
        console.log(`[GLM] content 为空，尝试从 reasoning_content 提取...`)
        content = message.reasoning_content
      }

      console.log(`[GLM] ✅ 生成成功，长度: ${content.length}`)
      if (data.usage) {
        console.log(`[GLM] Token 使用: ${JSON.stringify(data.usage)}`)
      }
      return { success: true, content: content }
    } else {
      console.error('[GLM] 响应格式错误:', data)
      return { success: false, error: '❌ GLM API 响应格式错误' }
    }

  } catch (error) {
    console.error('[GLM] 调用失败:', error)
    return { success: false, error: `❌ GLM API 调用失败: ${error.message}` }
  }
}

// 推送 Product Hunt 每日精选
async function sendProductHuntDaily() {
  console.log('[推送] 开始生成 Product Hunt 每日精选')

  const result = await callGLM({
    messages: [
      {
        role: 'system',
        content: '你是 Product Hunt 分析专家。任务：生成今日 Product Hunt 精选推送（中文）只生成3个产品，保持简洁。输出格式：Product Hunt 每日精选 - 日期。TOP 1：产品名称，描述：xxx（80字以内）。分析：适用场景：xxx。前端结合：xxx。公众号选题：xxx。潜力评估：⭐⭐⭐'
      },
      {
        role: 'user',
        content: '生成今天的 Product Hunt 推送内容（3个产品）'
      }
    ]
  })

  if (result.success && result.content) {
    return result.content
  } else {
    console.error('[推送] Product Hunt 生成失败:', result.error)
    return `❌ Product Hunt 生成失败: ${result.error}`
  }
}

// 推送公众号素材
async function sendWechatMaterialDaily() {
  console.log('[推送] 开始生成公众号素材推送')

  const result = await callGLM({
    messages: [
      {
        role: 'system',
        content: '你是公众号运营助手。任务：生成今日公众号素材推送（中文）选题建议（2-3个），60字以内。标题灵感（3-5个）。保持实用、可操作性强的风格'
      },
      {
        role: 'user',
        content: '生成今天的公众号素材推送（选题+标题）'
      }
    ]
  })

  if (result.success && result.content) {
    return result.content
  } else {
    console.error('[推送] 公众号素材生成失败:', result.error)
    return `❌ 公众号素材生成失败: ${result.error}`
  }
}

// 推送 AI Agent 学习内容
async function sendAIAgentLearningDaily() {
  console.log('[推送] 开始生成 AI Agent 学习内容')

  const result = await callGLM({
    messages: [
      {
        role: 'system',
        content: '你是 AI Agent 学习导师。任务：生成今日 AI Agent 学习内容（中文）学习目标（200字以内）。深度讲解要点（200字以内）。实战演练要点（200字以内）。保持专业、实用的风格'
      },
      {
        role: 'user',
        content: '生成今天的 AI Agent 学习内容（目标+讲解+演练）'
      }
    ]
  })

  if (result.success && result.content) {
    return result.content
  } else {
    console.error('[推送] AI Agent 学习生成失败:', result.error)
    return `❌ AI Agent 学习生成失败: ${result.error}`
  }
}

// 推送股票盘后分析
async function sendStockMarketAnalysis() {
  console.log('[推送] 开始生成股票盘后分析')

  const result = await callGLM({
    messages: [
      {
        role: 'system',
        content: '你是股票分析专家。任务：生成A股盘后分析（中文）持仓信息：牧原股份（002714）- 80%，潍柴动力（000338）- 10%，博雅生物（300294）- 5%，派林生物（000403）- 5%。持仓风险提示：牧原仓位过重风险高。仓位分析。保持专业、客观的风格'
      },
      {
        role: 'user',
        content: '生成今天的A股盘后分析（持仓风险提示）'
      }
    ]
  })

  if (result.success && result.content) {
    return result.content
  } else {
    console.error('[推送] 股票盘后分析生成失败:', result.error)
    return `❌ 股票盘后分析生成失败: ${result.error}`
  }
}

// 推送加密货币早报
async function sendCryptoMorningReport() {
  console.log('[推送] 开始生成加密货币早报')

  const result = await callGLM({
    messages: [
      {
        role: 'system',
        content: '你是加密货币分析专家。任务：生成加密货币早报（中文）市场趋势（200字以内）。推荐赛道（2-3个），60字以内。风险提示。保持专业、实用的风格'
      },
      {
        role: 'user',
        content: '生成今天的加密货币早报（市场趋势+推荐赛道）'
      }
    ]
  })

  if (result.success && result.content) {
    return result.content
  } else {
    console.error('[推送] 加密货币早报生成失败:', result.error)
    return `❌ 加密货币早报生成失败: ${result.error}`
  }
}

// 发送到 Discord
async function sendToDiscord(channel, content) {
  console.log(`\n[Discord] 发送到频道: ${channel}`)
  console.log(`[Discord] 内容长度: ${content.length}`)
  console.log(`[Discord] 内容预览: ${content.substring(0, 200)}`)
  
  const webhookUrl = DISCORD_CONFIG.webhooks[channel] || ''

  // 创建日志目录
  const logDir = '/root/.openclaw/workspace/discord/logs'
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }

  // 生成文件名
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const logFile = `${logDir}/push-${channel}-${timestamp}.md`

  // 写入日志文件
  const logContent = `# Discord 推送日志

**频道**: ${channel}
**时间**: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
**长度**: ${content.length} 字符

---

## 推送内容

${content}

---

*此文件由 OpenClaw 自动生成（修复版 - 支持 reasoning_content）*
`

  fs.writeFileSync(logFile, logContent)

  console.log(`[Discord] ✅ 日志已保存到: ${logFile}`)

  // 如果配置了 Webhook，发送到 Discord
  if (webhookUrl) {
    try {
      console.log(`[Discord] 🚀 通过 Webhook 发送...`)

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content,
          username: DISCORD_CONFIG.username
        })
      })

      if (response.ok) {
        console.log(`[Discord] ✅ Webhook 推送成功`)
      } else {
        const errorText = await response.text()
        console.error(`[Discord] ❌ Webhook 推送失败: ${response.status}`)
        console.error(`[Discord] 错误详情: ${errorText}`)
      }
    } catch (error) {
      console.error(`[Discord] ❌ Webhook 调用失败:`, error)
    }
  } else {
    console.log(`[Discord] ⚠️ Webhook 未配置，只保存日志`)
  }
}

// 导出处理函数
module.exports = {
  sendProductHuntDaily,
  sendWechatMaterialDaily,
  sendAIAgentLearningDaily,
  sendStockMarketAnalysis,
  sendCryptoMorningReport
}

// 如果直接运行（测试用）
if (require.main === module) {
  const trigger = process.argv[2]

  console.log(`\n${'='.repeat(50)}`)
  console.log('OpenClaw 修复推送 - 支持 reasoning_content')
  console.log(`${'='.repeat(50)}\n`)

  if (trigger === 'test') {
    console.log(`[测试] 推送测试消息到 Discord...`)
    sendProductHuntDaily().then(content => {
      console.log(`[测试] 成功：${content.substring(0, 100)}...`)
      process.exit(0)
    }).catch(err => {
      console.error(`[测试] 失败：`, err)
      process.exit(1)
    })
  } else {
    console.log('\n[用法] node fixed-push.js test')
    console.log(`\n${'='.repeat(50)}\n`)
    process.exit(0)
  }
}
