// 简化推送 v1（最简单的 Prompt）
// 逐步验证 GLM API 是否能正常返回内容

const fs = require('fs')

// GLM 配置
let GLM_API_KEY = ''
let DISCORD_WEBHOOK_URL = ''

try {
  const config = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/config/glm.json', 'utf8'))
  GLM_API_KEY = config.glm.apiKey
  if (config.discord && config.discord.webhooks) {
    DISCORD_WEBHOOK_URL = config.discord.webhooks['product-hunt'] || config.discord.webhooks['news-selection']
  }
  console.log('[配置] GLM-4.7 已加载')
  console.log('[配置] Discord Webhook:', DISCORD_WEBHOOK_URL ? '已配置' : '未配置')
} catch (e) {
  console.error('[错误] GLM 配置未找到:', e.message)
}

// 调用 GLM API（简化版 - 最简单的 Prompt）
async function callGLMSimple() {
  console.log('\n[GLM] 调用简化版测试')
  console.log('[GLM] 使用最简单的 Prompt\n')

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
          {
            role: 'user',
            content: '请生成一个简单的测试内容：Hello World'
          }
        ],
        temperature: 0.7,
        max_tokens: 100,
        stream: false
      })
    })

    console.log(`[GLM] 响应状态: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[GLM] API 错误: ${response.status}`)
      console.error(`[GLM] 错误详情: ${errorText}`)
      return ''
    }

    const data = await response.json()
    console.log(`[GLM] 响应数据: ${JSON.stringify(data)}`)

    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content
      console.log(`[GLM] ✅ 生成成功`)
      console.log(`[GLM] 内容: ${content}`)
      console.log(`[GLM] 内容长度: ${content.length}`)
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

// 主函数
async function main() {
  console.log('='.repeat(50))
  console.log('简化推送测试 v1')
  console.log('='.repeat(50))

  // 测试1：最简单的 Prompt
  console.log('\n[测试] 测试1：最简单的 Prompt')
  console.log('[测试] ======================\n')

  const simpleContent = await callGLMSimple()

  if (simpleContent && simpleContent.length > 0) {
    console.log(`[测试] ✅ 测试1成功，获得内容：${simpleContent}`)

    // 如果成功，推送到 Discord
    if (DISCORD_WEBHOOK_URL) {
      console.log(`[测试] 准备推送到 Discord`)

      try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: `🧪 简化测试成功！\n\nGLM 返回内容：\n${simpleContent}`,
            username: '🤖 OpenClaw'
          })
        })

        if (response.ok) {
          console.log(`[测试] ✅ Discord 推送成功`)
        } else {
          console.error(`[测试] ❌ Discord 推送失败: ${response.status}`)
        }
      } catch (error) {
        console.error(`[测试] ❌ Discord 推送失败:`, error)
      }
    }

    console.log('\n[测试] 测试1完成')
    console.log('[测试] 你应该能在 Discord 看到消息了！')
    console.log('[测试] 如果看到消息，说明问题已解决')
    console.log('[测试] 如果还是没看到，需要进一步排查')
  } else {
    console.error(`[测试] ❌ 测试1失败，内容为空或未定义`)
  }

  console.log('\n' + '='.repeat(50))
  console.log('简化推送测试 v1 完成')
  console.log('='.repeat(50))
}

// 运行主函数
if (require.main === module) {
  main().then(() => {
    console.log('\n[完成] 测试成功')
    process.exit(0)
  }).catch(err => {
    console.error('\n[失败] 测试失败:', err)
    console.error(err.stack)
    process.exit(1)
  })
}
