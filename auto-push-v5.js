// 自动推送处理器 v5（Discord Webhook 集成）
// 优化：Webhook调用、队列化、错误处理、重试机制

const fs = require('fs')

// GLM 配置
let GLM_API_KEY = ''
let DISCORD_WEBHOOK_URL = ''
try {
  const config = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/config/glm.json', 'utf8'))
  GLM_API_KEY = config.glm.apiKey
  DISCORD_WEBHOOK_URL = config.discord?.webhookUrl || ''
  console.log('[配置] GLM-4.7 已加载')
  console.log('[配置] Discord Webhook:', DISCORD_WEBHOOK_URL ? '已配置' : '未配置')
} catch (e) {
  console.error('[错误] 配置未找到:', e.message)
}

// 调用延迟（避免并发限制）
const MIN_CALL_INTERVAL = 5000 // 5秒延迟（比 v4 的 2 秒更长）

// 延迟函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Discord 推送函数（通过 Webhook）
async function sendToDiscord(channel, content) {
  console.log(`\n[Discord] =====================`)
  console.log(`[Discord] 发送到频道: ${channel}`)
  console.log(`[Discord] 内容长度: ${content.length}`)
  console.log(`[Discord] 内容预览:`)
  console.log(content.substring(0, 200))
  console.log(`[Discord] ... (内容已截断)\n`)

  // 保存到日志（总是保存）
  const logDir = '/root/.openclaw/workspace/discord/logs'
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const channelSafeName = channel.replace(/[^a-zA-Z0-9-]/g, '-')
  const logFile = `${logDir}/push-${channelSafeName}-${timestamp}.md`

  const logContent = `# Discord 推送日志

**频道**: ${channel}
**时间**: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
**长度**: ${content.length} 字符
**方式**: ${DISCORD_WEBHOOK_URL ? 'Webhook' : '日志文件'}

---

## 推送内容

${content}

---

*此文件由 OpenClaw 自动生成（v5 - Webhook集成）*`

  fs.writeFileSync(logFile, logContent)

  console.log(`[Discord] ✅ 日志已保存到: ${logFile}`)
  console.log(`[Discord] 📁 文件大小: ${Buffer.byteLength(logContent)} 字节`)

  // 如果配置了 Webhook，发送到 Discord
  if (DISCORD_WEBHOOK_URL) {
    try {
      console.log(`[Discord] 🚀 通过 Webhook 发送...`)

      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content,
          username: '🤖 OpenClaw',
          avatar_url: config.discord?.avatarUrl || ''
        })
      })

      if (response.ok) {
        console.log(`[Discord] ✅ Webhook 推送成功`)
      } else {
        const errorText = await response.text()
        console.error(`[Discord] ❌ Webhook 推送失败: ${response.status}`)
        console.error(`[Discord] 错误详情: ${errorText}`)

        // 尝试重试
        await sendToDiscordRetry(content)
      }

    } catch (error) {
      console.error(`[Discord] ❌ Webhook 调用失败:`, error)
      await sendToDiscordRetry(content)
    }
  } else {
    console.log(`[Discord] ⚠️ Webhook 未配置，只保存日志`)
    console.log(`[Discord] 提示: 在 config/glm.json 中配置 discord.webhookUrl`)
  }

  console.log(`[Discord] =====================\n`)
}

// Webhook 推送重试
async function sendToDiscordRetry(content, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Discord] Webhook 重试 ${attempt}/${maxRetries}...`)

      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content,
          username: '🤖 OpenClaw',
          avatar_url: config.discord?.avatarUrl || ''
        })
      })

      if (response.ok) {
        console.log(`[Discord] ✅ Webhook 重试成功`)
        return true
      } else {
        console.error(`[Discord] ❌ Webhook 重试失败: ${response.status}`)
      }

    } catch (error) {
      console.error(`[Discord] ❌ Webhook 重试异常:`, error)

      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 2000
        console.log(`[Discord] 等待 ${waitTime}ms 后重试...`)
        await sleep(waitTime)
      }
    }
  }

  console.error(`[Discord] ❌ Webhook 重试 ${maxRetries} 次全部失败`)
  return false
}

// 主处理函数
async function handleTrigger(triggerText) {
  console.log(`\n[推送] =====================`)
  console.log(`[推送] 收到触发信号: ${triggerText}`)
  console.log(`[推送] 时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`)
  console.log(`[推送] 推送方式: ${DISCORD_WEBHOOK_URL ? 'Webhook' : '仅日志'}`)
  console.log(`[推送] =====================\n`)

  try {
    switch (triggerText) {
      case 'TRIGGER_PRODUCT_HUNT_DAILY':
        await sendProductHuntDaily()
        break
      case 'TRIGGER_WECHAT_MATERIAL_DAILY':
        await sleep(5000) // 延迟避免并发
        await sendWechatMaterialDaily()
        break
      case 'TRIGGER_AI_AGENT_LEARNING_0800':
        await sleep(10000) // 更长延迟
        await sendAIAgentLearning('08:00', 'daily-goal')
        break
      case 'TRIGGER_AI_AGENT_LEARNING_1200':
        await sleep(15000)
        await sendAIAgentLearning('12:00', 'deep-dive')
        break
      case 'TRIGGER_AI_AGENT_LEARNING_1800':
        await sleep(20000)
        await sendAIAgentLearning('18:00', 'practice')
        break
      case 'TRIGGER_STOCK_MARKET_ANALYSIS':
        await sleep(25000)
        await sendStockMarketAnalysis()
        break
      case 'TRIGGER_CRYPTO_MORNING_REPORT':
        await sleep(30000)
        await sendCryptoMorningReport()
        break
      default:
        console.log(`[推送] 未知的触发信号: ${triggerText}`)
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

  const content = await callGLMWithRetry({
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

🔥 TOP 2：xxx
...

⚠️ 注意：
1. 由于没有实时 API，请生成 3-4 个热门产品的模板
2. 每个产品包含：名称、描述、分析
3. 保持专业、简洁的风格

（只生成3-4个产品，控制 token 使用）`
      },
      {
        role: 'user',
        content: '生成今天的 Product Hunt 推送内容（3-4个产品）'
      }
    ]
  })

  await sendToDiscord('🏆-product-hunt', content)
}

// 推送公众号素材
async function sendWechatMaterialDaily() {
  console.log('[推送] 开始生成公众号素材推送')

  const content = await callGLMWithRetry({
    messages: [
      {
        role: 'system',
        content: `你是公众号运营助手。

任务：生成今日公众号素材推送（中文）

输出格式：
📝 公众号素材 - 日期

━━━━━━━━━━━━━━━━━━━━

🔥 今日热点（3-4条）
• 热点1：xxx（50字以内）
• 热点2：xxx（50字以内）

💡 选题建议（3-4个）
• 前端 + AI：xxx（60字以内）
• 工具测评：xxx（60字以内）
• 实战案例：xxx（60字以内）

━━━━━━━━━━━━━━━━━━━━

🎨 标题灵感（3-5个）
• 36岁程序员用AI打造xxx，火了！
• 揭秘：xxx背后的技术真相
• ...

💡 内容来源：基于当天热点和AI、前端领域趋势生成

保持专业、实用、可操作的风格

（精简内容，控制长度）`
      },
      {
        role: 'user',
        content: '生成今天的公众号素材推送（热点+选题+标题）'
      }
    ]
  })

  await sendToDiscord('📝-公众号素材', content)
}

// 推送 AI Agent 学习内容
async function sendAIAgentLearning(time, type) {
  console.log(`[推送] 开始生成 AI Agent 学习内容 - ${time} (${type})`)

  const typeMap = {
    'daily-goal': '学习目标',
    'deep-dive': '深度讲解',
    'practice': '实战演练'
  }

  const typeInstructions = {
    'daily-goal': `生成今日学习目标

格式：
🤖 AI Agent 学习 - ${time} - ${typeMap[type]}

━━━━━━━━━━━━━━━━━━━━

今日学习目标：
• 本节核心概念（150-200字）
• 预计学习时长：xxx分钟
• 关键知识点：1.xxx 2.xxx 3.xxx

课前阅读（可选）：
• 推荐学习资料链接（如有）`,

    'deep-dive': `生成深度讲解

格式：
🤖 AI Agent 学习 - ${time} - 深度讲解

━━━━━━━━━━━━━━━━━━━━

核心技术详解（600-800字）：
• 概念定义：xxx
• 技术原理：xxx
• 实现方式：xxx

代码示例（可选）：
\`\`\`javascript
// 简要示例
\`\`\`

常见误区：
• 误区1：xxx
• 误区2：xxx

（深入浅出，重点突出）`,

    'practice': `生成实战演练

格式：
🤖 AI Agent 学习 - ${time} - 实战演练

━━━━━━━━━━━━━━━━━━━━

代码实现（200-300行）：
\`\`\`javascript
// 完整可运行代码
\`\`\`

实战步骤：
• 步骤1：xxx
• 步骤2：xxx
• 步骤3：xxx

注意事项：
• xxx
• xxx

（可运行、有注释、实用）`
  }

  const content = await callGLMWithRetry({
    messages: [
      {
        role: 'system',
        content: `你是 AI Agent 学习导师。

任务：生成${typeMap[type]}内容（中文）

${typeInstructions[type]}

保持专业、实用的风格，适合有一定基础的程序员学习

（精简内容，提高可读性）`
      },
      {
        role: 'user',
        content: `生成${typeMap[type]}内容`
      }
    ]
  })

  await sendToDiscord('ai-agent-learning', content)
}

// 推送股票盘后分析
async function sendStockMarketAnalysis() {
  console.log('[推送] 开始生成股票盘后分析')

  const content = await callGLMWithRetry({
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

⚠️ 风险提示：
1. 由于没有实时行情，无法提供准确涨跌幅
2. 牧原股份仓位过重，建议逐步降到50-60%
3. 重复持仓建议优化

投资建议仅供参考，投资有风险

保持专业、客观的风格（不提供具体买卖建议）

（精简内容，重点突出风险）`
      },
      {
        role: 'user',
        content: '生成今天的A股盘后分析（持仓风险提示）'
      }
    ]
  })

  await sendToDiscord('stock-analysis', content)
}

// 推送加密货币早报
async function sendCryptoMorningReport() {
  console.log('[推送] 开始生成加密货币早报')

  const content = await callGLMWithRetry({
    messages: [
      {
        role: 'system',
        content: `你是加密货币分析专家。

任务：生成加密货币早报（中文）

输出格式：
💎 加密货币早报 - 日期

━━━━━━━━━━━━━━━━━━━━

🔥 市场趋势（2-3条）
• BTC/ETH 趋势：xxx（80字以内）
• 总市值变化：xxx（50字以内）

📊 推荐赛道（3-4个）
• AI + Crypto：xxx（60字以内）
• Layer2：xxx（60字以内）
• RWA：xxx（60字以内）

⚠️ 风险提示：
由于没有实时行情，以下内容为市场趋势分析和项目推荐。投资有风险，请谨慎决策。

保持专业、实用的风格

（精简内容，控制长度）`
      },
      {
        role: 'user',
        content: '生成今天的加密货币早报（市场趋势+推荐赛道）'
      }
    ]
  })

  await sendToDiscord('crypto-analysis', content)
}

// 调用 GLM API（带重试机制 v3）
async function callGLMWithRetry({ model = 'glm-4.7', messages, temperature = 0.7, maxRetries = 3 }) {
  if (!GLM_API_KEY) {
    console.error('[错误] GLM API Key 未配置')
    console.error('[提示] 请在 config/glm.json 中配置 API Key')
    return '❌ GLM API Key 未配置，请在 config/glm.json 中配置'
  }

  // 检查调用间隔
  if (global.callCount) {
    const now = Date.now()
    const timeSinceLastCall = now - global.callCount

    if (timeSinceLastCall < MIN_CALL_INTERVAL) {
      const waitTime = MIN_CALL_INTERVAL - timeSinceLastCall
      console.log(`[GLM] 等待 ${waitTime}ms 以满足调用间隔`)
      await sleep(waitTime)
    }

    global.callCount = Date.now()
  } else {
    global.callCount = Date.now()
  }

  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[GLM] 调用尝试 ${attempt}/${maxRetries}: ${model}`)
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
          max_tokens: 1000, // 降低到 1000，控制成本
          stream: false
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[GLM] API 错误: ${response.status}`)
        console.error(`[GLM] 错误详情: ${errorText}`)

        // 检查是否是频率限制
        if (response.status === 429) {
          const waitTime = Math.min(Math.pow(2, attempt) * 5000, 60000) // 最大等待 60 秒
          console.log(`[GLM] 频率限制，等待 ${waitTime}ms 后重试...`)

          if (attempt < maxRetries) {
            await sleep(waitTime)
            lastError = `429 频率限制 (尝试 ${attempt}/${maxRetries})`
            continue
          }
        }

        if (response.status === 401) {
          console.error('[GLM] API Key 无效或已过期')
          return '❌ GLM API Key 无效或已过期'
        }

        return `❌ GLM API 调用失败 (${response.status}): ${errorText}`
      }

      const data = await response.json()

      if (data.choices && data.choices[0]) {
        const content = data.choices[0].message.content
        console.log(`[GLM] ✅ 生成成功（尝试 ${attempt}/${maxRetries}）`)
        console.log(`[GLM] 内容长度: ${content.length}`)
        if (data.usage) {
          console.log(`[GLM] Token 使用: ${JSON.stringify(data.usage)}`)
        }
        return content
      } else {
        console.error('[GLM] 响应格式错误:', data)
        return '❌ GLM API 响应格式错误'
      }

    } catch (error) {
      console.error(`[GLM] 调用失败 (尝试 ${attempt}/${maxRetries}):`, error)
      lastError = error.message

      if (attempt < maxRetries) {
        const waitTime = Math.min(Math.pow(2, attempt) * 2000, 10000) // 最大等待 10 秒
        console.log(`[GLM] 网络错误，等待 ${waitTime}ms 后重试...`)
        await sleep(waitTime)
        continue
      }
    }
  }

  // 所有重试都失败
  console.error(`[GLM] ❌ 所有重试失败: ${maxRetries} 次`)
  return `❌ GLM API 调用失败（重试${maxRetries}次后）: ${lastError}`
}

// 导出处理函数
module.exports = { handleTrigger }

// 如果直接运行（测试用）
if (require.main === module) {
  const trigger = process.argv[2]

  console.log(`\n${'='.repeat(50)}`)
  console.log('OpenClaw 自动推送处理器 v5（Webhook 集成）')
  console.log(`${'='.repeat(50)}\n`)

  if (trigger) {
    console.log(`[启动] 触发器: ${trigger}`)
    handleTrigger(trigger).then(() => {
      console.log(`\n[完成] 处理成功`)
      console.log(`${'='.repeat(50)}\n`)
      process.exit(0)
    }).catch(err => {
      console.error(`\n[失败] 处理失败:`, err)
      console.error(err.stack)
      console.log(`${'='.repeat(50)}\n`)
      process.exit(1)
    })
  } else {
    console.log('\n[用法] node auto-push-v5.js <trigger>')
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
