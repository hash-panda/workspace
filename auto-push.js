// 自动推送处理器
// 处理所有定时任务触发的事件

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Discord 配置
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || ''

// GLM 配置
let GLM_API_KEY = ''
try {
  const glmConfig = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/config/glm.json', 'utf8'))
  GLM_API_KEY = glmConfig.glm.apiKey
  console.log('[配置] GLM-4.7 已加载')
} catch (e) {
  console.error('[错误] GLM 配置未找到:', e.message)
  console.log('[提示] 请在 config/glm.json 中配置 API Key')
}

// Product Hunt 配置
let PH_TOKEN = ''
try {
  const phConfig = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/config/product-hunt.json', 'utf8'))
  PH_TOKEN = phConfig.developerToken
} catch (e) {
  console.log('Product Hunt 配置未找到')
}

// 主处理函数
async function handleTrigger(triggerText) {
  console.log(`[推送] 收到触发信号: ${triggerText}`)

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
        console.log(`未知的触发信号: ${triggerText}`)
    }
  } catch (error) {
    console.error(`[推送] 处理失败:`, error)
  }
}

// 推送 Product Hunt 每日精选
async function sendProductHuntDaily() {
  console.log('[推送] 开始推送 Product Hunt 每日精选')

  // 使用 GLM 生成分析
  const content = await callGLM({
    messages: [
      {
        role: 'system',
        content: `你是 Product Hunt 分析专家。

任务：生成今日 Product Hunt 精选推送

输出格式：
🏆 Product Hunt 每日精选 - 日期

━━━━━━━━━━━━━━━━━━━━

🔥 TOP 1：产品名称
描述：xxx
分析：
• 适用场景：xxx
• 前端结合：xxx
• 公众号选题：xxx
• 潜力评估：⭐⭐⭐⭐

━━━━━━━━━━━━━━━━━━━━

🔥 TOP 2：xxx
...

注意：由于没有实时 API，请生成模板格式，实际数据需要后续补充。`
      },
      {
        role: 'user',
        content: '生成今天的 Product Hunt 推送模板'
      }
    ]
  })

  await sendToDiscord('🏆-product-hunt', content)
}

// 推送公众号素材
async function sendWechatMaterialDaily() {
  console.log('[推送] 开始推送公众号素材')

  const content = await callGLM({
    messages: [
      {
        role: 'system',
        content: `你是公众号运营助手。

任务：生成今日公众号素材推送

输出格式：
📝 公众号素材 - 日期

━━━━━━━━━━━━━━━━━━━━

🔥 今日热点
• 热点1：xxx
• 热点2：xxx

💡 选题建议
• 前端 + AI：xxx
• 工具测评：xxx
• 实战案例：xxx

🎨 标题灵感
• 36岁程序员用AI打造xxx，火了！
• 揭秘：xxx背后的技术真相
• ...
`
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
  console.log(`[推送] 开始推送 AI Agent 学习 - ${time}`)

  const typeMap = {
    'daily-goal': '学习目标',
    'deep-dive': '深度讲解',
    'practice': '实战演练'
  }

  const content = await callGLM({
    messages: [
      {
        role: 'system',
        content: `你是 AI Agent 学习导师。

任务：生成${typeMap[type]}内容

输出格式：
🤖 AI Agent 学习 - ${time} - ${typeMap[type]}

━━━━━━━━━━━━━━━━━━━━

${type === 'daily-goal' ? '今日学习目标：
• 本节核心概念（200字）
• 预计学习时长
• 关键知识点列表' : type === 'deep-dive' ? '深度讲解：
• 核心技术详解（800-1000字）
• 图表/代码示例
• 常见误区' : '实战演练：
• 代码实现示例
• 调试技巧
• 扩展思考'}
`
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
  console.log('[推送] 开始推送股票盘后分析')

  const content = await callGLM({
    messages: [
      {
        role: 'system',
        content: `你是股票分析专家。

任务：生成A股盘后分析

输出格式：
📊 A股盘后分析 - 日期

━━━━━━━━━━━━━━━━━━━━

📈 大盘走势
• 沪指：xxx (涨跌幅)
• 深成指：xxx
• 创业板指：xxx

🔥 板块热点
• 涨幅榜：xxx, xxx
• 政策相关：xxx

📰 重磅新闻
• xxx
• xxx

💡 你的持仓
• 牧原股份：xxx (涨跌幅)
• 潍柴动力：xxx (涨跌幅)
• 博雅生物：xxx (涨跌幅)
• 派林生物：xxx (涨跌幅)

注意：由于没有实时行情 API，请生成模板格式。`
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
  console.log('[推送] 开始推送加密货币早报')

  const content = await callGLM({
    messages: [
      {
        role: 'system',
        content: `你是加密货币分析专家。

任务：生成加密货币早报

输出格式：
💎 加密货币早报 - 日期

━━━━━━━━━━━━━━━━━━━━

🔥 市场概况
• BTC：$xxx (+xx%) / -xx%
• ETH：$xxx (+xx%) / -xx%

📊 板块表现
• Layer2：+xx%
• DeFi：+xx%
• AI赛道：+xx%

📰 重磅新闻
• xxx
• xxx

💡 今日关注
• xxx

注意：由于没有实时行情 API，请生成模板格式。`
      },
      {
        role: 'user',
        content: '生成今天的加密货币早报'
      }
    ]
  })

  await sendToDiscord('crypto-analysis', content)
}

// 调用 GLM API
async function callGLM({ model = 'glm-4.7', messages, temperature = 0.7 }) {
  if (!GLM_API_KEY) {
    console.error('GLM API Key 未配置')
    return '❌ GLM API Key 未配置'
  }

  try {
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
        max_tokens: 2000
      })
    })

    const data = await response.json()

    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content
    } else {
      console.error('GLM API 响应格式错误:', data)
      return '❌ GLM API 响应错误'
    }
  } catch (error) {
    console.error('GLM API 调用失败:', error)
    return `❌ GLM API 调用失败: ${error.message}`
  }
}

// 发送到 Discord
async function sendToDiscord(channel, content) {
  console.log(`[推送] 发送到频道: ${channel}`)
  console.log(`[推送] 内容:\n${content}`)

  // TODO: 实现 Discord API 调用
  // 目前先保存到日志
  const logDir = '/root/.openclaw/workspace/discord/logs'
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const logFile = `${logDir}/push-${timestamp}.md`

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }

  fs.writeFileSync(logFile, `频道: ${channel}\n时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n${content}`)

  console.log(`[推送] 已保存到: ${logFile}`)
}

// 导出处理函数
module.exports = { handleTrigger }

// 如果直接运行（测试用）
if (require.main === module) {
  const trigger = process.argv[2]
  if (trigger) {
    handleTrigger(trigger).then(() => {
      console.log('[推送] 完成')
      process.exit(0)
    }).catch(err => {
      console.error('[推送] 错误:', err)
      process.exit(1)
    })
  } else {
    console.log('用法: node auto-push.js <trigger>')
    process.exit(1)
  }
}
