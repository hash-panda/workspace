// 自动推送处理器 v2（GLM-4.7 集成）
// 处理所有定时任务触发的事件

const fs = require('fs')

// GLM 配置
let GLM_API_KEY = ''
try {
  const glmConfig = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/config/glm.json', 'utf8'))
  GLM_API_KEY = glmConfig.glm.apiKey
  console.log('[配置] GLM-4.7 已加载')
} catch (e) {
  console.error('[错误] GLM 配置未找到:', e.message)
}

// Product Hunt 配置（用于后续集成）
let PH_TOKEN = ''
try {
  const phConfig = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/config/product-hunt.json', 'utf8'))
  PH_TOKEN = phConfig.developerToken
  console.log('[配置] Product Hunt 已加载')
} catch (e) {
  console.log('[提示] Product Hunt 配置未找到（非必需）')
}

// 主处理函数
async function handleTrigger(triggerText) {
  console.log(`\n[推送] =====================`)
  console.log(`[推送] 收到触发信号: ${triggerText}`)
  console.log(`[推送] 时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`)
  console.log(`[推送] =====================\n`)

  try {
    switch (triggerText) {
      case 'TRIGGER_PRODUCT_HUNT_DAILY':
        await sendProductHuntDaily()
        break
      case 'TRIGGER_WECHAT_MATERIAL_DAILY':
        await sendWechatMaterialDaily()
        break
      case 'TRIGGER_AI_AGENT_LEARNING_0800':
        await sendAIAgentLearning('08:00', 'daily-goal')
        break
      case 'TRIGGER_AI_AGENT_LEARNING_1200':
        await sendAIAgentLearning('12:00', 'deep-dive')
        break
      case 'TRIGGER_AI_AGENT_LEARNING_1800':
        await sendAIAgentLearning('18:00', 'practice')
        break
      case 'TRIGGER_STOCK_MARKET_ANALYSIS':
        await sendStockMarketAnalysis()
        break
      case 'TRIGGER_CRYPTO_MORNING_REPORT':
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

  const content = await callGLM({
    messages: [
      {
        role: 'system',
        content: `你是 Product Hunt 分析专家。

任务：生成今日 Product Hunt 精选推送（中文）

输出格式：
🏆 Product Hunt 每日精选 - 2026-02-01

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
1. 由于没有实时 API，请生成 3-5 个热门产品的模板
2. 每个产品包含名称、描述、分析
3. 保持专业、简洁的风格`
      },
      {
        role: 'user',
        content: '生成今天的 Product Hunt 推送内容'
      }
    ]
  })

  await sendToDiscord('🏆-product-hunt', content)
}

// 推送公众号素材
async function sendWechatMaterialDaily() {
  console.log('[推送] 开始生成公众号素材推送')

  const content = await callGLM({
    messages: [
      {
        role: 'system',
        content: `你是公众号运营助手。

任务：生成今日公众号素材推送（中文）

输出格式：
📝 公众号素材 - 2026-02-01

━━━━━━━━━━━━━━━━━━━━

🔥 今日热点
• 热点1：xxx（50字以内）
• 热点2：xxx（50字以内）

💡 选题建议
• 前端 + AI：xxx（80字以内）
• 工具测评：xxx（80字以内）
• 实战案例：xxx（80字以内）

🎨 标题灵感
• 36岁程序员用AI打造xxx，火了！
• 揭秘：xxx背后的技术真相
• ...

━━━━━━━━━━━━━━━━━━━━

💡 内容来源：基于当天热点和AI、前端领域趋势生成

保持专业、实用的风格`
      },
      {
        role: 'user',
        content: '生成今天的公众号素材推送'
      }
    ]
  })

  await sendToDiscord('📝-公众号素材', content)
}

// 推送 AI Agent 学习内容
async function sendAIAgentLearning(time, type) {
  console.log(`[推送] 开始生成 AI Agent 学习内容 - ${time} (${type})`)

  const typeMap = {
    'daily-goal': '今日学习目标',
    'deep-dive': '深度讲解',
    'practice': '实战演练'
  }

  const typeInstructions = {
    'daily-goal': `生成今日学习目标

格式：
今日学习目标：
• 本节核心概念（200字）
• 预计学习时长：xxx分钟
• 关键知识点列表：1.xxx 2.xxx 3.xxx

课前阅读：
• 推荐学习资料（可选）`,

    'deep-dive': `生成深度讲解

格式：
核心技术详解（800-1000字）
• 概念定义
• 技术原理
• 实现方式

代码示例：
\`\`\`javascript
// 示例代码
\`\`\`

常见误区：
• 误区1：xxx
• 误区2：xxx`,

    'practice': `生成实战演练

格式：
代码实现示例（完整可运行）
\`\`\`javascript
// 完整代码
\`\`\`

调试技巧：
• 如何调试
• 常见错误及解决

扩展思考：
• 如何优化
• 进阶方向`
  }

  const content = await callGLM({
    messages: [
      {
        role: 'system',
        content: `你是 AI Agent 学习导师。

任务：生成${typeMap[type]}内容（中文）

${typeInstructions[type]}

保持专业、实用的风格，适合有一定基础的程序员学习`
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
📊 A股盘后分析 - 2026-02-01

━━━━━━━━━━━━━━━━━━━━

📈 大盘走势
• 沪指：xxx (涨跌幅)
• 深成指：xxx
• 创业板指：xxx

🔥 板块热点
• 涨幅榜：xxx, xxx, xxx
• 政策相关：xxx

📰 重磅新闻
• xxx（100字以内）
• xxx（100字以内）

━━━━━━━━━━━━━━━━━━━━

💡 你的持仓
• 牧原股份：xxx元 (涨跌幅) 收益：xxx%
• 潍柴动力：xxx元 (涨跌幅) 收益：xxx%
• 博雅生物：xxx元 (涨跌幅) 收益：xxx%
• 派林生物：xxx元 (涨跌幅) 收益：xxx%

总收益：xxx% | 总仓位：100%

⚠️ 注意：
1. 由于没有实时行情 API，请生成模板格式
2. 可以提示牧原股份仓位过重的风险
3. 给出合理的涨跌幅假设`
      },
      {
        role: 'user',
        content: '生成今天的A股盘后分析'
      }
    ]
  })

  await sendToDiscord('stock-analysis', content)
}

// 推送加密货币早报
async function sendCryptoMorningReport() {
  console.log('[推送] 开始生成加密货币早报')

  const content = await callGLM({
    messages: [
      {
        role: 'system',
        content: `你是加密货币分析专家。

任务：生成加密货币早报（中文）

输出格式：
💎 加密货币早报 - 2026-02-01

━━━━━━━━━━━━━━━━━━━━

🔥 市场概况
• BTC：$xxx (+xx%) / -xx%
• ETH：$xxx (+xx%) / -xx%
• 总市值：$xxx亿
• 24h成交量：$xxx亿

📊 板块表现
• Layer2：+xx%
• DeFi：+xx%
• AI赛道：+xx%

📰 重磅新闻
• xxx（100字以内）
• xxx（100字以内）

━━━━━━━━━━━━━━━━━━━━

💡 今日关注
• 项目1：xxx（80字以内）
• 项目2：xxx（80字以内）

⚠️ 注意：
1. 由于没有实时行情 API，请生成模板格式
2. 可以参考近期 BTC、ETH 价格范围
3. 保持市场趋势分析的专业性`
      },
      {
        role: 'user',
        content: '生成今天的加密货币早报'
      }
    ]
  })

  await sendToDiscord('crypto-analysis', content)
}

// 调用 GLM API（官方格式 v2）
async function callGLM({ model = 'glm-4.7', messages, temperature = 0.7 }) {
  if (!GLM_API_KEY) {
    console.error('[错误] GLM API Key 未配置')
    console.error('[提示] 请在 config/glm.json 中配置 API Key')
    return '❌ GLM API Key 未配置，请在 config/glm.json 中配置'
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

      if (response.status === 401) {
        return '❌ GLM API Key 无效或已过期'
      } else if (response.status === 429) {
        return '❌ GLM API 调用频率超限'
      }

      return `❌ GLM API 调用失败 (${response.status})`
    }

    const data = await response.json()

    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content
      console.log(`[GLM] ✅ 生成成功，长度: ${content.length}`)
      console.log(`[GLM] Token 使用: ${JSON.stringify(data.usage || {})}`)
      return content
    } else {
      console.error('[GLM] 响应格式错误:', data)
      return '❌ GLM API 响应格式错误'
    }
  } catch (error) {
    console.error('[GLM] 调用失败:', error)
    return `❌ GLM API 调用失败: ${error.message}`
  }
}

// 发送到 Discord（目前保存到日志）
async function sendToDiscord(channel, content) {
  console.log(`\n[推送] 发送到频道: ${channel}`)
  console.log(`[推送] 内容长度: ${content.length}`)
  console.log(`[推送] 内容预览:`)
  console.log(content.substring(0, 200))
  console.log(`[推送] ... (内容已截断)\n`)

  // 创建日志目录
  const logDir = '/root/.openclaw/workspace/discord/logs'

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }

  // 生成文件名
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const channelSafeName = channel.replace(/[^a-zA-Z0-9-]/g, '-')
  const logFile = `${logDir}/push-${channelSafeName}-${timestamp}.md`

  // 写入日志文件
  const logContent = `# Discord 推送日志

**频道**: ${channel}
**时间**: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
**长度**: ${content.length} 字符

---

## 推送内容

${content}

---

*此文件由 OpenClaw 自动生成*
`

  fs.writeFileSync(logFile, logContent)

  console.log(`[推送] ✅ 已保存到: ${logFile}`)
  console.log(`[推送] 📁 文件大小: ${Buffer.byteLength(logContent)} 字节`)

  // TODO: 实现 Discord API 调用
  // 需要配置 Discord Webhook
  // await sendDiscordWebhook(channel, content)
}

// 导出处理函数
module.exports = { handleTrigger }

// 如果直接运行（测试用）
if (require.main === module) {
  const trigger = process.argv[2]

  console.log(`\n${'='.repeat(50)}`)
  console.log('OpenClaw 自动推送处理器 v2')
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
    console.log('\n[用法] node auto-push.js <trigger>')
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
