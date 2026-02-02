// 自动推送处理器 v6（修复 GLM 响应捕获）
// 优化：确保正确捕获和发送生成的内容

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

// 主处理函数
async function handleTrigger(triggerText) {
  console.log(`\n[推送] =====================`)
  console.log(`[推送] 触发器: ${triggerText}`)
  console.log(`[推送] 时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`)
  console.log(`[推送] =====================\n`)

  let content = ''
  let webhookUrl = ''

  try {
    switch (triggerText) {
      case 'TRIGGER_PRODUCT_HUNT_DAILY':
        webhookUrl = DISCORD_CONFIG.webhooks['product-hunt'] || DISCORD_CONFIG.webhooks['news-selection']
        if (webhookUrl) {
          console.log(`[推送] 使用 Webhook: product-hunt 或 news-selection`)
          content = await sendProductHuntDaily()
        } else {
          console.log(`[推送] 未配置对应 Webhook，使用默认`)
          content = await sendProductHuntDaily()
        }
        break

      case 'TRIGGER_WECHAT_MATERIAL_DAILY':
        webhookUrl = DISCORD_CONFIG.webhooks['wechat-material'] || DISCORD_CONFIG.webhooks['tools-radar']
        if (webhookUrl) {
          console.log(`[推送] 使用 Webhook: wechat-material`)
          await sleep(5000)
          content = await sendWechatMaterialDaily()
        } else {
          console.log(`[推送] 未配置对应 Webhook，使用默认`)
          await sleep(5000)
          content = await sendWechatMaterialDaily()
        }
        break

      case 'TRIGGER_AI_AGENT_LEARNING_0800':
        webhookUrl = DISCORD_CONFIG.webhooks['ai-agent-learning']
        if (webhookUrl) {
          console.log(`[推送] 使用 Webhook: ai-agent-learning`)
          await sleep(10000)
          content = await sendAIAgentLearning('08:00', 'daily-goal')
        }
        break

      case 'TRIGGER_AI_AGENT_LEARNING_1200':
        webhookUrl = DISCORD_CONFIG.webhooks['ai-agent-learning']
        if (webhookUrl) {
          console.log(`[推送] 使用 Webhook: ai-agent-learning`)
          await sleep(15000)
          content = await sendAIAgentLearning('12:00', 'deep-dive')
        }
        break

      case 'TRIGGER_AI_AGENT_LEARNING_1800':
        webhookUrl = DISCORD_CONFIG.webhooks['ai-agent-learning']
        if (webhookUrl) {
          console.log(`[推送] 使用 Webhook: ai-agent-learning`)
          await sleep(20000)
          content = await sendAIAgentLearning('18:00', 'practice')
        }
        break

      case 'TRIGGER_STOCK_MARKET_ANALYSIS':
        webhookUrl = DISCORD_CONFIG.webhooks['stock-analysis'] || DISCORD_CONFIG.webhooks['crypto-analysis']
        if (webhookUrl) {
          console.log(`[推送] 使用 Webhook: stock-analysis`)
          await sleep(25000)
          content = await sendStockMarketAnalysis()
        }
        break

      case 'TRIGGER_CRYPTO_MORNING_REPORT':
        webhookUrl = DISCORD_CONFIG.webhooks['crypto-analysis'] || DISCORD_CONFIG.webhooks['product-hunt']
        if (webhookUrl) {
          console.log(`[推送] 使用 Webhook: crypto-analysis`)
          await sleep(30000)
          content = await sendCryptoMorningReport()
        }
        break

      default:
        console.log(`[推送] 未知的触发器: ${triggerText}`)
    }

    if (content && webhookUrl) {
      console.log(`[推送] 准备推送到 Discord: ${content.length} 字符`)
      await sendToDiscord(webhookUrl, content)
    } else if (content) {
      console.log(`[推送] 内容已生成，但未配置 Webhook`)
      await sendToDiscord('', content) // 保存日志
    } else {
      console.log(`[推送] 内容生成失败`)
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
        content: `你是 Product Hunt 分析专家。

任务：生成今日 Product Hunt 精选推送（中文）

输出格式：
🏆 Product Hunt 每日精选 - 日期

━━━━━━━━━━━━━━━━━━━━

🔥 TOP 1：产品名称
描述：xxx（100字以内）

分析：
• 适用场景：xxx
• 前端结合：xxx
• 公众号选题：xxx
• 潜力评估：⭐⭐⭐⭐

━━━━━━━━━━━━━━━━━━━━

（只生成3-4个产品，保持简洁）

保持专业、实用的风格，适合前端开发者参考`
      },
      {
        role: 'user',
        content: '生成今天的 Product Hunt 推送内容（3-4个产品）'
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
        content: `你是公众号运营助手。

任务：生成今日公众号素材推送（中文）

输出格式：
📝 公众号素材 - 日期

━━━━━━━━━━━━━━━━━━━━

💡 选题建议（3-4个）
• 前端 + AI：xxx（60字以内）
• 工具测评：xxx（60字以内）
• 实战案例：xxx（60字以内）

🎨 标题灵感（3-5个）
• 36岁程序员用AI打造xxx，火了！
• 揭秘：xxx背后的技术真相
• ...

━━━━━━━━━━━━━━━━━━━━

（精简内容，只保留最重要的）

保持实用、可操作性强的风格`
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
async function sendAIAgentLearning(time, type) {
  console.log(`[推送] 开始生成 AI Agent 学习内容 - ${time} (${type})`)

  const typeMap = {
    'daily-goal': '学习目标',
    'deep-dive': '深度讲解',
    'practice': '实战演练'
  }

  const result = await callGLM({
    messages: [
      {
        role: 'system',
        content: `你是 AI Agent 学习导师。

任务：生成${typeMap[type]}内容（中文）

保持专业、实用的风格，适合有一定基础的程序员学习`
      },
      {
        role: 'user',
        content: `生成${typeMap[type]}内容（200-300字）`
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
        content: `你是股票分析专家。

任务：生成A股盘后分析（中文）

持仓信息：
• 牧原股份（002714）- 80% 仓位
• 潍柴动力（000338）- 10% 仓位
• 博雅生物（300294）- 5% 仓位
• 派林生物（000403）- 5% 仓位

输出格式：
📊 A股盘后分析 - 日期

━━━━━━━━━━━━━━━━━━━━

💡 持仓分析
• 牧原股份：⚠️ 仓位过重（80%），风险提示
• 潍柴动力：✅ 仓位合理
• 博雅生物 + 派林生物：⚠️ 重复持仓，建议优化

━━━━━━━━━━━━━━━━━━━━

⚠️ 风险提示
由于没有实时行情，提供仓位分析和投资建议

保持专业、客观的风格（不提供具体买卖建议）

（精简内容，重点突出风险）`
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
        content: `你是加密货币分析专家。

任务：生成加密货币早报（中文）

输出格式：
💎 加密货币早报 - 日期

━━━━━━━━━━━━━━━━━━━━

🎯 推荐赛道（2-3个）
• AI + Crypto：xxx（50字以内）
• Layer2：xxx（50字以内）

━━━━━━━━━━━━━━━━━━━━

⚠️ 风险提示
由于没有实时行情，以下内容为市场趋势分析和投资建议

保持专业、实用的风格

（精简内容，突出重点）`
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

// 调用 GLM API（修复版）
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
        max_tokens: 800, // 降低到 800，避免浪费
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[GLM] API 错误: ${response.status}`)
      console.error(`[GLM] 错误详情: ${errorText}`)

      if (response.status === 429) {
        return { success: false, error: 'GLM API 频率限制，请稍后重试' }
      }

      if (response.status === 401) {
        return { success: false, error: 'GLM API Key 无效或已过期' }
      }

      return { success: false, error: `GLM API 调用失败 (${response.status}): ${errorText}` }
    }

    const data = await response.json()

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content
      console.log(`[GLM] ✅ 生成成功，长度: ${content.length}`)
      if (data.usage) {
        console.log(`[GLM] Token 使用: ${JSON.stringify(data.usage)}`)
      }
      return { success: true, content: content }
    } else {
      console.error('[GLM] 响应格式错误:', data)
      return { success: false, error: 'GLM API 响应格式错误' }
    }

  } catch (error) {
    console.error('[GLM] 调用失败:', error)
    return { success: false, error: `GLM API 调用失败: ${error.message}` }
  }
}

// 发送到 Discord
async function sendToDiscord(webhookUrl, content) {
  console.log(`\n[Discord] =====================`)
  console.log(`[Discord] Webhook URL: ${webhookUrl ? '已配置' : '未配置'}`)
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
  const channelSafeName = webhookUrl ? webhookUrl.split('/')[7] : 'unknown'
  const logFile = `${logDir}/push-${channelSafeName}-${timestamp}.md`

  // 写入日志文件
  const logContent = `# Discord 推送日志

**时间**: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
**Webhook**: ${webhookUrl ? '✅ 已配置' : '❌ 未配置'}
**长度**: ${content.length} 字符

---

## 推送内容

${content}

---

*此文件由 OpenClaw 自动生成（v6 - 修复版）*
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
    console.log(`[Discord] ⚠️  Webhook 未配置，只保存日志`)
  }

  console.log(`[Discord] =====================\n`)
}

// 导出处理函数
module.exports = { handleTrigger }

// 如果直接运行（测试用）
if (require.main === module) {
  const trigger = process.argv[2]

  console.log(`\n${'='.repeat(50)}`)
  console.log('OpenClaw 自动推送处理器 v6（修复 GLM 响应捕获）')
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
    console.log('\n[用法] node auto-push-v6.js <trigger>')
    console.log('\n可用的触发器:')
    console.log('  - TRIGGER_PRODUCT_HUNT_DAILY')
    console.log('  - TRIGGER_WECHAT_MATERIAL_DAILY')
    console.log('  - TRIGGER_AI_AGENT_LEARNING_0800')
    console.log('  - TRIGGER_AI_AGENT_LEARNING_1200')
    console.log('  - TRIGGER_AI_AGENT_LEARNING_1800')
    console.log('  - TRIGGER_STOCK_MARKET_ANALYSIS')
    console.log('  - TRIGGER_CRYPTO_MORNING_REPORT')
    console.log(`\n${'='.repeat(50)}\n`)
    process.exit(1)
  }
}
