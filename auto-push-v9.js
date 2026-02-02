// 自动推送处理器 v9（单任务队列 - 串行处理）
// 优化：彻底避免并发，所有任务串行执行

const fs = require('fs')

// GLM 配置
let GLM_API_KEY = ''
let DISCORD_CONFIG = {
  webhooks: {
    'product-hunt': '',
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

// 任务配置（串行执行）
const TASKS = [
  {
    name: 'Product Hunt 推送',
    trigger: 'TRIGGER_PRODUCT_HUNT_DAILY',
    webhookChannel: 'product-hunt',
    taskFn: 'sendProductHuntDaily'
  },
  {
    name: '公众号素材推送',
    trigger: 'TRIGGER_WECHAT_MATERIAL_DAILY',
    webhookChannel: 'wechat-material',
    taskFn: 'sendWechatMaterialDaily'
  },
  {
    name: 'AI Agent 学习',
    trigger: 'TRIGGER_AI_AGENT_LEARNING_DAILY',
    webhookChannel: 'ai-agent-learning',
    taskFn: 'sendAIAgentLearningDaily'
  },
  {
    name: '股票盘后分析',
    trigger: 'TRIGGER_STOCK_MARKET_ANALYSIS',
    webhookChannel: 'stock-analysis',
    taskFn: 'sendStockMarketAnalysis'
  },
  {
    name: '加密货币早报',
    trigger: 'TRIGGER_CRYPTO_MORNING_REPORT',
    webhookChannel: 'crypto-analysis',
    taskFn: 'sendCryptoMorningReport'
  }
]

// 任务之间的延迟（30 分钟）
const TASK_INTERVAL = 1800000 // 30 分钟

// 延迟函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 串行执行所有任务
async function executeAllTasks() {
  console.log(`\n${'='.repeat(50)}`)
  console.log(`OpenClaw 单任务队列 v9（串行处理）`)
  console.log(`开始时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`)
  console.log(`任务数量: ${TASKS.length}`)
  console.log(`任务间隔: ${TASK_INTERVAL / 60000} 分钟`)
  console.log(`${'='.repeat(50)}\n`)

  for (let i = 0; i < TASKS.length; i++) {
    const task = TASKS[i]
    console.log(`\n[队列] ==========`)
    console.log(`[队列] 任务 ${i + 1}/${TASKS.length}: ${task.name}`)
    console.log(`[队列] 触发器: ${task.trigger}`)
    console.log(`[队列] 开始时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`)
    console.log(`[队列] ==========\n`)

    try {
      await handleSingleTask(task)

      // 任务完成后，等待 30 分钟（除了最后一个任务）
      if (i < TASKS.length - 1) {
        console.log(`\n[队列] 等待 ${TASK_INTERVAL / 60000} 分钟后执行下一个任务...`)
        console.log(`[队列] 预计下一个任务开始时间: ${new Date(Date.now() + TASK_INTERVAL).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`)
        await sleep(TASK_INTERVAL)
      } else {
        console.log(`\n[队列] 所有任务已完成！`)
        console.log(`[队列] 完成时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`)
        console.log(`[队列] ==========\n`)
      }
    } catch (error) {
      console.error(`[队列] 任务 ${i + 1}/${TASKS.length} 失败:`, error)
      console.error(`[队列] 错误详情:`, error.stack)
      
      // 即使失败也等待 30 分钟
      if (i < TASKS.length - 1) {
        console.log(`\n[队列] 等待 ${TASK_INTERVAL / 60000} 分钟后执行下一个任务...`)
        await sleep(TASK_INTERVAL)
      }
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`所有任务执行完成`)
  console.log(`总耗时: ${Math.round((Date.now() - startTime) / 1000)} 秒`)
  console.log(`${'='.repeat(50)}\n`)
}

// 处理单个任务
async function handleSingleTask(task) {
  let webhookUrl = DISCORD_CONFIG.webhooks[task.webhookChannel] || ''

  try {
    // 产品相关任务
    if (task.taskFn === 'sendProductHuntDaily') {
      const content = await callGLM({
        messages: [
          {
            role: 'system',
            content: `你是 Product Hunt 分析专家。

任务：生成今日 Product Hunt 精选推送（中文）

输出格式：
🏆 Product Hunt 每日精选 - 2026-02-02

━━━━━━━━━━━━━━━━━━━━

🔥 TOP 1：产品名称
描述：xxx（80字以内）

分析：
• 适用场景：xxx
• 前端结合：xxx
• 公众号选题：xxx
• 潜力评估：⭐⭐⭐⭐⭐

━━━━━━━━━━━━━━━━━━━━

（只生成3个产品，保持简洁）

保持专业、实用的风格`
          },
          {
            role: 'user',
            content: '生成今天的 Product Hunt 推送内容（3个产品）'
          }
        ]
      })

      await sendToDiscord(webhookUrl, content, '🏆-product-hunt')
    }

    // 公众号素材任务
    else if (task.taskFn === 'sendWechatMaterialDaily') {
      const content = await callGLM({
        messages: [
          {
            role: 'system',
            content: `你是公众号运营助手。

任务：生成今日公众号素材推送（中文）

输出格式：
📝 公众号素材 - 2026-02-02

━━━━━━━━━━━━━━━━━━━━

💡 选题建议（3-4个）
• 前端 + AI：xxx（60字以内）
• 工具测评：xxx（60字以内）

━━━━━━━━━━━━━━━━━━━━

（精简内容，控制长度）

保持实用、可操作性强的风格`
          },
          {
            role: 'user',
            content: '生成今天的公众号素材推送（精选选题）'
          }
        ]
      })

      await sendToDiscord(webhookUrl, content, '📝-公众号素材')
    }

    // AI Agent 学习任务（每日一次）
    else if (task.taskFn === 'sendAIAgentLearningDaily') {
      const content = await callGLM({
        messages: [
          {
            role: 'system',
            content: `你是 AI Agent 学习导师。

任务：生成今日 AI Agent 学习内容（中文）

输出格式：
🤖 AI Agent 学习 - 今日汇总

━━━━━━━━━━━━━━━━━━━━

📚 今日学习目标（200字）
• xxx

💡 深度讲解要点（200字）
• xxx

🔧 实战演练要点（200字）
• xxx

━━━━━━━━━━━━━━━━━━━━

保持专业、实用的风格

（精简内容，合并三个任务）`
          },
          {
            role: 'user',
            content: '生成今天的 AI Agent 学习内容（每日汇总）'
          }
        ]
      })

      await sendToDiscord(webhookUrl, content, 'ai-agent-learning')
    }

    // 股票分析任务
    else if (task.taskFn === 'sendStockMarketAnalysis') {
      const content = await callGLM({
        messages: [
          {
            role: 'system',
            content: `你是股票分析专家。

任务：生成A股盘后分析（中文）

持仓信息：
• 牧原股份（002714）- 80% 仓位
• 潍柴动力（000338）- 10% 仓位
• 博雅生物（300294）- 5% 仓位
• 派林生物（000403）- 5% 仓位

输出格式：
📊 A股盘后分析 - 2026-02-02

━━━━━━━━━━━━━━━━━━━━

💡 持仓风险提示
• 牧原股份：⚠️ 仓位过重（80%），风险高
• 建议：逐步降到 50-60%

━━━━━━━━━━━━━━━━━━━━

⚠️ 风险提示
由于没有实时行情，提供仓位分析和投资建议

保持专业、客观的风格

（精简内容，突出风险）`
          },
          {
            role: 'user',
            content: '生成今天的A股盘后分析（持仓风险提示）'
          }
        ]
      })

      await sendToDiscord(webhookUrl, content, 'stock-analysis')
    }

    // 加密货币早报任务
    else if (task.taskFn === 'sendCryptoMorningReport') {
      const content = await callGLM({
        messages: [
          {
            role: 'system',
            content: `你是加密货币分析专家。

任务：生成加密货币早报（中文）

输出格式：
💎 加密货币早报 - 2026-02-02

━━━━━━━━━━━━━━━━━━━━

🎯 推荐赛道（2-3个）
• AI + Crypto：xxx（60字以内）
• Layer2：xxx（60字以内）

━━━━━━━━━━━━━━━━━━━━

⚠️ 风险提示
由于没有实时行情，以下内容为市场趋势分析和投资建议

保持专业、实用的风格

（精简内容，突出趋势）`
          },
          {
            role: 'user',
            content: '生成今天的加密货币早报（市场趋势+推荐赛道）'
          }
        ]
      })

      await sendToDiscord(webhookUrl, content, 'crypto-analysis')
    }
  } catch (error) {
    console.error(`[队列] ${task.name} 执行失败:`, error)
    throw error
  }
}

// 调用 GLM API
async function callGLM({ model = 'glm-4.7', messages, temperature = 0.7 }) {
  if (!GLM_API_KEY) {
    console.error('[错误] GLM API Key 未配置')
    return ''
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
        max_tokens: 1000,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[GLM] API 错误: ${response.status}`)
      console.error(`[GLM] 错误详情: ${errorText}`)
      return ''
    }

    const data = await response.json()

    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content
      console.log(`[GLM] ✅ 生成成功，长度: ${content.length}`)
      if (data.usage) {
        console.log(`[GLM] Token 使用: ${JSON.stringify(data.usage)}`)
      }
      return content
    } else {
      console.error('[GLM] 响应格式错误:', data)
      return ''
    }

  } catch (error) {
    console.error('[GLM] 调用失败:', error)
    return ''
  }
}

// 发送到 Discord
async function sendToDiscord(webhookUrl, content, channelName) {
  console.log(`\n[Discord] 发送到频道: ${channelName}`)
  console.log(`[Discord] 内容长度: ${content.length}`)
  console.log(`[Discord] 内容预览:`)
  console.log(content.substring(0, 200))
  console.log(`[Discord] ... (内容已截断)\n`)

  // 创建日志目录
  const logDir = '/root/.openclaw/workspace/discord/logs'
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }

  // 生成文件名
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const logFile = `${logDir}/push-${channelName}-${timestamp}.md`

  // 写入日志文件
  const logContent = `# Discord 推送日志

**频道**: ${channelName}
**时间**: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
**长度**: ${content.length} 字符
**方式**: ${webhookUrl ? 'Webhook' : '仅日志'}

---

## 推送内容

${content}

---

*此文件由 OpenClaw 自动生成（v9 - 单任务队列）*
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
        console.log(`[Discord] ✅ Webhook 推送成功到 ${channelName}`)
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
    console.log(`[Discord] 提示: 在 config/glm.json 中配置 discord.webhooks.${channelName}`)
  }
}

// 导出处理函数
module.exports = { executeAllTasks }

// 如果直接运行（测试用）
if (require.main === module) {
  const startTime = Date.now()
  
  console.log(`\n${'='.repeat(50)}`)
  console.log(`OpenClaw 单任务队列 v9（串行处理）`)
  console.log(`${'='.repeat(50)}\n`)
  
  executeAllTasks().then(() => {
    console.log(`\n[完成] 所有任务执行成功`)
    console.log(`${'='.repeat(50)}\n`)
    process.exit(0)
  }).catch(err => {
    console.error(`\n[失败] 执行失败: `, err)
    console.error(err.stack)
    console.log(`${'='.repeat(50)}\n`)
    process.exit(1)
  })
}
