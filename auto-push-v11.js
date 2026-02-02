// 自动推送处理器 v11（修复语法错误 + 增强日志）
// 修复三元表达式语法错误，加强错误处理

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

// 调用计数器（避免并发限制）
let callCount = Date.now()
const MIN_CALL_INTERVAL = 60000 // 60秒延迟
const RETRY_COOLDOWN = 60000 // 60秒冷却

// 延迟函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 主处理函数
async function handleTrigger(triggerText) {
  console.log(`\n[推送] =====================`)
  console.log(`[推送] 触发信号: ${triggerText}`)
  console.log(`[推送] 时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`)
  console.log(`[推送] =====================\n`)

  let content = ''
  let webhookUrl = ''

  try {
    switch (triggerText) {
      case 'TRIGGER_ALL_TASKS_QUEUE':
        await executeAllTasks()
        return

      case 'TRIGGER_PRODUCT_HUNT_DAILY':
        webhookUrl = DISCORD_CONFIG.webhooks['product-hunt'] || DISCORD_CONFIG.webhooks['news-selection']
        if (webhookUrl) {
          console.log(`[推送] 使用 Webhook: product-hunt`)
          content = await sendProductHuntDaily()
        } else {
          console.log(`[推送] 未配置对应 Webhook`)
        }
        break

      case 'TRIGGER_WECHAT_MATERIAL_DAILY':
        webhookUrl = DISCORD_CONFIG.webhooks['wechat-material'] || DISCORD_CONFIG.webhooks['tools-radar']
        if (webhookUrl) {
          console.log(`[推送] 使用 Webhook: wechat-material`)
          await sleep(60000)
          content = await sendWechatMaterialDaily()
        }
        break

      case 'TRIGGER_AI_AGENT_LEARNING_DAILY':
        webhookUrl = DISCORD_CONFIG.webhooks['ai-agent-learning']
        if (webhookUrl) {
          console.log(`[推送] 使用 Webhook: ai-agent-learning`)
          await sleep(120000)
          content = await sendAIAgentLearning('daily')
        }
        break

      case 'TRIGGER_STOCK_MARKET_ANALYSIS':
        webhookUrl = DISCORD_CONFIG.webhooks['stock-analysis'] || DISCORD_CONFIG.webhooks['crypto-analysis']
        if (webhookUrl) {
          console.log(`[推送] 使用 Webhook: stock-analysis`)
          await sleep(180000)
          content = await sendStockMarketAnalysis()
        }
        break

      case 'TRIGGER_CRYPTO_MORNING_REPORT':
        webhookUrl = DISCORD_CONFIG.webhooks['crypto-analysis'] || DISCORD_CONFIG.webhooks['product-hunt']
        if (webhookUrl) {
          console.log(`[推送] 使用 Webhook: crypto-analysis`)
          await sleep(240000)
          content = await sendCryptoMorningReport()
        }
        break

      default:
        console.log(`[推送] 未知的触发信号: ${triggerText}`)
    }

    if (content && webhookUrl) {
      console.log(`[推送] 准备推送到 Discord，长度: ${content.length}`)
      await sendToDiscord(webhookUrl, content, 'product-hunt')
    }

    console.log(`\n[推送] ✅ 完成`)
    console.log(`[推送] =====================\n`)
  } catch (error) {
    console.error(`[推送] ❌ 处理失败:`, error)
    console.error(`[推送] 错误详情:`, error.stack)
  }
}

// 推送 Product Hunt 每日精选
async function sendProductHuntDaily() {
  console.log('[推送] 开始生成 Product Hunt 每日精选')

  const result = await callGLM({
    messages: [
      {
        role: 'system',
        content: '你是 Product Hunt 分析专家。\n\n任务：生成今日 Product Hunt 精选推送（中文）\n\n输出格式：\n🏆 Product Hunt 每日精选 - 日期\n\n━━━━━━━━━━━━━━━━━━━━\n\n🔥 TOP 1：产品名称\n描述：xxx（80字以内）\n\n分析：\n• 适用场景：xxx\n• 前端结合：xxx\n• 公众号选题：xxx\n• 潜力评估：⭐⭐⭐\n\n━━━━━━━━━━━━━━━━━━━━\n\n（只生成3个产品，保持简洁）\n\n保持专业、实用的风格，适合前端开发者参考'
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
        content: '你是公众号运营助手。\n\n任务：生成今日公众号素材推送（中文）\n\n输出格式：\n📝 公众号素材 - 日期\n\n━━━━━━━━━━━━━━━━━━━━\n\n💡 选题建议（3个）\n• 前端 + AI：xxx（60字以内）\n• 工具测评：xxx（60字以内）\n• 实战案例：xxx（60字以内）\n\n━━━━━━━━━━━━━━━━━━━━\n\n（精简内容，只保留最重要的）\n\n保持实用、可操作性强的风格'
      },
      {
        role: 'user',
        content: '生成今天的公众号素材推送（精选选题）'
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

// 推送 AI Agent 学习
async function sendAIAgentLearning(type) {
  console.log(`[推送] 开始生成 AI Agent 学习内容: ${type}`)

  const typeText = type === 'daily' ? '学习目标' : '学习要点'

  const result = await callGLM({
    messages: [
      {
        role: 'system',
        content: `你是 AI Agent 学习导师。\n\n任务：生成今日 ${typeText}（中文）\n\n输出格式：\n🤖 AI Agent 学习 - ${typeText}\n\n━━━━━━━━━━━━━━━━━━━━\n\n${type === 'daily' ? '今日学习目标：\n• 本节核心概念（150-200字）\n• 预计学习时长：xxx分钟\n• 关键知识点：1.xxx 2.xxx\n\n（保持简洁，重点明确）' : '学习要点：\n• 概念1（100字）\n• 概念2（100字）\n• 概念3（100字）\n\n（精简内容）'}\n\n━━━━━━━━━━━━━━━━━━━━\n\n保持专业、实用的风格，适合有一定基础的程序员学习`
      },
      {
        role: 'user',
        content: `生成今日 ${typeText}内容（精简版，200-300字）`
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

// 推送股票分析
async function sendStockMarketAnalysis() {
  console.log('[推送] 开始生成股票盘后分析')

  const result = await callGLM({
    messages: [
      {
        role: 'system',
        content: '你是股票分析专家。\n\n任务：生成A股盘后分析（中文）\n\n持仓信息：\n• 牧原股份（002714）- 80% 仓位\n• 潍柴动力（000338）- 10% 仓位\n• 博雅生物（300294）- 5% 仓位\n• 派林生物（000403）- 5% 仓位\n\n输出格式：\n📊 A股盘后分析 - 日期\n\n━━━━━━━━━━━━━━━━━━━━\n\n💡 持仓风险提示\n• 牧原股份：⚠️ 仓位过重（80%），风险高\n• 建议：逐步降到 50-60%\n• 潍柴动力：✅ 仓位合理\n• 博雅生物 + 派林生物：⚠️ 重复持仓，建议优化\n\n━━━━━━━━━━━━━━━━━━━━\n\n⚠️ 风险提示\n由于没有实时行情，提供仓位分析和投资建议\n\n保持专业、客观的风格（不提供具体买卖建议）'
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
        content: '你是加密货币分析专家。\n\n任务：生成加密货币早报（中文）\n\n输出格式：\n💎 加密货币早报 - 日期\n\n━━━━━━━━━━━━━━━━━━━━\n\n🎯 推荐赛道（2个）\n• AI + Crypto：xxx（60字以内）\n• Layer2：xxx（60字以内）\n\n━━━━━━━━━━━━━━━━━━━━\n\n⚠️ 风险提示\n由于没有实时行情，以下内容为市场趋势分析和项目推荐\n\n保持专业、实用的风格'
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

// 调用 GLM API（增强错误处理）
async function callGLM({ model = 'glm-4.7', messages, temperature = 0.7 }) {
  if (!GLM_API_KEY) {
    const errorMsg = '❌ GLM API Key 未配置，请在 config/glm.json 中配置'
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
        max_tokens: 1000,
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

    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content
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

// 发送到 Discord（增强错误处理）
async function sendToDiscord(webhookUrl, content, channelName) {
  console.log(`\n[Discord] =====================`)
  console.log(`[Discord] 发送到频道: ${channelName}`)
  console.log(`[Discord] Webhook: ${webhookUrl ? '已配置' : '未配置'}`)
  console.log(`[Discord] 内容类型: ${typeof content}`)
  console.log(`[Discord] 内容长度: ${content.length}`)
  console.log(`[Discord] 内容预览:`)
  console.log(content.substring(0, 200))
  console.log(`[Discord] ... (内容已截断)\n`)

  // 严格类型检查
  if (typeof content !== 'string') {
    console.error(`[Discord] ❌ 内容类型错误: ${typeof content}，期望: string`)
    console.log(`[Discord] 提示: content 变量 = ${JSON.stringify(content)}`)
    console.log(`[Discord] =====================\n`)
    return
  }

  if (content.length === 0) {
    console.error(`[Discord] ❌ 内容为空字符串`)
    console.log(`[Discord] =====================\n`)
    return
  }

  // 创建日志目录
  const logDir = '/root/.openclaw/workspace/discord/logs'
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }

  // 生成文件名
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const channelSafeName = channelName.replace(/[^a-zA-Z0-9-]/g, '-')
  const logFile = `${logDir}/push-${channelSafeName}-${timestamp}.md`

  // 写入日志文件
  const logContent = `# Discord 推送日志

**频道**: ${channelName}
**时间**: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
**长度**: ${content.length} 字符
**方式**: ${webhookUrl ? 'Webhook' : '日志文件'}

---

## 推送内容

${content}

---

*此文件由 OpenClaw 自动生成（v11 - 修复语法错误）*
`

  fs.writeFileSync(logFile, logContent)

  console.log(`[Discord] ✅ 日志已保存到: ${logFile}`)
  console.log(`[Discord] 📁 文件大小: ${Buffer.byteLength(logContent)} 字节`)

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

  console.log(`[Discord] =====================\n`)
}

// 串行执行所有任务
async function executeAllTasks() {
  console.log(`\n${'='.repeat(50)}`)
  console.log('OpenClaw 单任务队列 v11（修复语法错误）')
  console.log(`开始时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`)
  console.log(`${'='.repeat(50)}\n`)

  const TASKS = [
    {
      name: 'Product Hunt 推送',
      taskFn: 'sendProductHuntDaily',
      webhookChannel: 'product-hunt'
    },
    {
      name: '公众号素材推送',
      taskFn: 'sendWechatMaterialDaily',
      webhookChannel: 'wechat-material'
    },
    {
      name: 'AI Agent 学习',
      taskFn: 'sendAIAgentLearning',
      webhookChannel: 'ai-agent-learning'
    },
    {
      name: '股票盘后分析',
      taskFn: 'sendStockMarketAnalysis',
      webhookChannel: 'stock-analysis'
    },
    {
      name: '加密货币早报',
      taskFn: 'sendCryptoMorningReport',
      webhookChannel: 'crypto-analysis'
    }
  ]

  const TASK_INTERVAL = 1800000 // 30分钟

  for (let i = 0; i < TASKS.length; i++) {
    const task = TASKS[i]
    console.log(`\n[队列] ==========`)
    console.log(`[队列] 任务 ${i + 1}/${TASKS.length}: ${task.name}`)
    console.log(`[队列] 开始时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`)
    console.log(`[队列] ==========\n`)

    try {
      const taskFn = eval(task.taskFn)
      const content = await taskFn()

      const webhookUrl = DISCORD_CONFIG.webhooks[task.webhookChannel] || ''

      if (content && webhookUrl) {
        await sendToDiscord(webhookUrl, content, task.webhookChannel)
      }
    } catch (error) {
      console.error(`[队列] ${task.name} 执行失败:`, error)
    }

    // 任务完成后，等待 30 分钟（除了最后一个）
    if (i < TASKS.length - 1) {
      console.log(`\n[队列] 等待 ${TASK_INTERVAL / 60000} 分钟后执行下一个任务...`)
      console.log(`[队列] 预计下一个任务开始时间: ${new Date(Date.now() + TASK_INTERVAL).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`)
      await sleep(TASK_INTERVAL)
    } else {
      console.log(`\n[队列] 所有任务已完成！`)
      console.log(`[队列] 完成时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`)
      console.log(`[队列] ==========\n`)
    }
  }

  console.log(`\n[完成] 处理成功`)
  console.log(`[队列] =====================\n`)
}

// 导出处理函数
module.exports = { handleTrigger }

// 如果直接运行（测试用）
if (require.main === module) {
  const trigger = process.argv[2]

  console.log(`\n${'='.repeat(50)}`)
  console.log('OpenClaw 单任务队列 v11（修复语法错误）')
  console.log(`${'='.repeat(50)}\n`)

  if (trigger) {
    console.log(`[启动] 触发器: ${trigger}`)
    handleTrigger(trigger).then(() => {
      console.log(`\n[完成] 处理成功`)
      console.log(`${'='.repeat(50)}\n`)
      process.exit(0)
    }).catch(err => {
      console.error(`\n[失败] 处理失败: `, err)
      console.error(err.stack)
      console.log(`${'='.repeat(50)}\n`)
      process.exit(1)
    })
  } else {
    console.log('\n[用法] node auto-push-v11.js <trigger>')
    console.log('\n可用的触发器:')
    console.log('  - TRIGGER_ALL_TASKS_QUEUE')
    console.log('  - TRIGGER_PRODUCT_HUNT_DAILY')
    console.log('  - TRIGGER_WECHAT_MATERIAL_DAILY')
    console.log('  - TRIGGER_AI_AGENT_LEARNING_DAILY')
    console.log('  - TRIGGER_STOCK_MARKET_ANALYSIS')
    console.log('  - TRIGGER_CRYPTO_MORNING_REPORT')
    console.log(`\n${'='.repeat(50)}\n`)
    process.exit(1)
  }
}
