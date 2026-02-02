// 简单诊断脚本 - 逐步检查
// 用于排查为什么 Discord 没有收到推送

const fs = require('fs')

// 加载配置
let GLM_API_KEY = ''
let DISCORD_WEBHOOK_URL = ''

try {
  const config = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/config/glm.json', 'utf8'))
  GLM_API_KEY = config.glm.apiKey
  if (config.discord && config.discord.webhooks) {
    DISCORD_WEBHOOK_URL = config.discord.webhooks['product-hunt'] || config.discord.webhooks['news-selection']
  }
  console.log('[配置] ✅ 配置加载成功')
  console.log('[配置] GLM API Key:', GLM_API_KEY ? '已配置' : '❌ 未配置')
  console.log('[配置] Discord Webhook:', DISCORD_WEBHOOK_URL ? '已配置' : '❌ 未配置')
} catch (e) {
  console.error('[配置] ❌ 配置加载失败:', e.message)
  process.exit(1)
}

// 测试1：GLM API 是否工作
async function testGLMAPI() {
  console.log('\n[测试1] GLM API 连接测试')
  console.log('[测试1] ======================\n')

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4.7',
        messages: [
          { role: 'user', content: '测试消息' }
        ],
        max_tokens: 100
      })
    })

    console.log('[测试1] 响应状态:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[测试1] ❌ GLM API 调用失败')
      console.error('[测试1] 状态码:', response.status)
      console.error('[测试1] 错误详情:', errorText)
      return false
    }

    const data = await response.json()

    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content
      console.log('[测试1] ✅ GLM API 调用成功')
      console.log('[测试1] 返回内容:', content)
      return true
    } else {
      console.error('[测试1] ❌ GLM API 响应格式错误')
      console.error('[测试1] 响应数据:', data)
      return false
    }

  } catch (error) {
    console.error('[测试1] ❌ 网络错误:', error)
    return false
  }
}

// 测试2：Discord Webhook 是否工作
async function testDiscordWebhook() {
  console.log('\n[测试2] Discord Webhook 测试')
  console.log('[测试2] ======================\n')

  if (!DISCORD_WEBHOOK_URL) {
    console.error('[测试2] ❌ Discord Webhook URL 未配置')
    return false
  }

  const testMessage = '🧪 诊断测试消息 - 这是一条从服务器直接发送的测试消息，如果你能看到这条消息，说明 Discord Webhook 完全正常工作！'

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: testMessage,
        username: '🧪 诊断助手'
      })
    })

    console.log('[测试2] 响应状态:', response.status)

    if (response.ok) {
      console.log('[测试2] ✅ Discord Webhook 发送成功')
      console.log('[测试2] 你应该能在 Discord 看到："🧪 诊断测试消息"')
      return true
    } else {
      const errorText = await response.text()
      console.error('[测试2] ❌ Discord Webhook 发送失败')
      console.error('[测试2] 状态码:', response.status)
      console.error('[测试2] 错误详情:', errorText)
      return false
    }

  } catch (error) {
    console.error('[测试2] ❌ 网络错误:', error)
    return false
  }
}

// 测试3：完整流程（GLM + Discord）
async function testFullFlow() {
  console.log('\n[测试3] 完整流程测试')
  console.log('[测试3] ======================\n')

  try {
    // 步骤1：调用 GLM API
    console.log('[测试3] 步骤1：调用 GLM API...')

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4.7',
        messages: [
          {
            role: 'system',
            content: '你是 Product Hunt 分析专家。\n任务：生成一个简单的 Product Hunt 产品介绍（50字以内）。'
          },
          {
            role: 'user',
            content: '生成一个产品名称和简短描述'
          }
        ],
        max_tokens: 200
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[测试3] ❌ GLM API 调用失败')
      console.error('[测试3] 错误详情:', errorText)
      
      // 即使 GLM 失败，也发送错误消息到 Discord
      await sendToDiscord(`❌ 诊断：GLM API 调用失败\n\n状态: ${response.status}\n错误: ${errorText}`)
      return false
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0]) {
      console.error('[测试3] ❌ GLM API 响应格式错误')
      console.error('[测试3] 响应数据:', data)
      
      await sendToDiscord(`❌ 诊断：GLM API 响应格式错误\n\n数据: ${JSON.stringify(data)}`)
      return false
    }

    const content = data.choices[0].message.content
    console.log('[测试3] ✅ GLM API 调用成功')
    console.log('[测试3] 返回内容:', content)
    console.log('[测试3] 内容长度:', content.length)

    // 步骤2：发送到 Discord
    console.log('[测试3] 步骤2：发送到 Discord...')

    const discordMessage = `🧪 诊断测试 - 完整流程\n\nGLM API 生成的内容：\n\n${content}`

    const response2 = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: discordMessage,
        username: '🧪 诊断助手'
      })
    })

    if (!response2.ok) {
      const errorText = await response2.text()
      console.error('[测试3] ❌ Discord Webhook 发送失败')
      console.error('[测试3] 错误详情:', errorText)
      return false
    }

    console.log('[测试3] ✅ 完整流程成功！')
    console.log('[测试3] 你应该能在 Discord 看到："🧪 诊断测试 - 完整流程" 及其后面的内容')
    return true

  } catch (error) {
    console.error('[测试3] ❌ 完整流程失败:', error)
    
    // 发送错误到 Discord
    await sendToDiscord(`❌ 诊断：完整流程失败\n\n错误: ${error.message}`)
    return false
  }
}

// 发送到 Discord
async function sendToDiscord(message) {
  console.log(`\n[Discord] 准备发送消息...`)
  console.log(`[Discord] 消息长度: ${message.length}`)
  console.log(`[Discord] Webhook: ${DISCORD_WEBHOOK_URL ? '已配置' : '未配置'}\n`)

  if (!DISCORD_WEBHOOK_URL) {
    console.error('[Discord] ❌ Webhook URL 未配置，跳过发送')
    return
  }

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: message,
        username: '🧪 诊断助手'
      })
    })

    if (response.ok) {
      console.log('[Discord] ✅ 消息发送成功')
    } else {
      const errorText = await response.text()
      console.error('[Discord] ❌ 消息发送失败')
      console.error('[Discord] 状态码:', response.status)
      console.error('[Discord] 错误详情:', errorText)
    }
  } catch (error) {
    console.error('[Discord] ❌ 发送失败:', error)
  }
}

// 主函数
async function main() {
  console.log('='.repeat(60))
  console.log('OpenClaw 诊断脚本')
  console.log('='.repeat(60))
  console.log('')

  // 测试1：GLM API
  const glmResult = await testGLMAPI()
  console.log('')

  // 测试2：Discord Webhook
  const webhookResult = await testDiscordWebhook()
  console.log('')

  // 测试3：完整流程
  const fullFlowResult = await testFullFlow()
  console.log('')

  console.log('='.repeat(60))
  console.log('诊断结果汇总：')
  console.log('='.repeat(60))
  console.log(`[GLM API] ${glmResult ? '✅ 正常' : '❌ 异常'}`)
  console.log(`[Discord Webhook] ${webhookResult ? '✅ 正常' : '❌ 异常'}`)
  console.log(`[完整流程] ${fullFlowResult ? '✅ 正常' : '❌ 异常'}`)
  console.log('='.repeat(60))
  console.log('')

  if (!fullFlowResult) {
    console.log('\n[提示] 完整流程失败，无法推送到 Discord')
    console.log('[提示] 请检查：')
    console.log('[提示] 1. GLM API Key 是否正确')
    console.log('[提示] 2. Discord Webhook URL 是否正确')
    console.log('[提示] 3. 查看上面的错误详情')
  } else {
    console.log('\n[成功] 诊断完成！你应该能在 Discord 看到测试消息。')
  }
}

// 运行主函数
if (require.main === module) {
  main().then(() => {
    console.log('\n[完成] 诊断完成')
    process.exit(0)
  }).catch(err => {
    console.error('\n[失败] 诊断失败:', err)
    console.error(err.stack)
    process.exit(1)
  })
}
