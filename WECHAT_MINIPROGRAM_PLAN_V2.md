# 微信小程序：一键配图助手 - 更新版

**更新时间**: 2026-01-31
**基于**: 腾讯 AI 小程序成长计划

---

## 🎯 产品定位（更新）

**核心优势（利用腾讯资源）：**
- ✅ 免费云开发资源
- ✅ 1亿混元 Token
- ✅ 1万张生图额度
- ✅ 免开发广告接入
- ✅ 官方话题推广支持

**成本优化：**
- MVP 阶段：零成本（使用免费资源）
- 成长期：只需购买超出额度的部分
- 节省：初期节省 ¥2000-5000 API 费用

---

## 🏗️ 技术架构（更新）

### 整体架构
```
┌─────────────────────────────────┐
│   微信小程序前端               │
├─────────────────────────────────┤
│  • 文章输入                   │
│  • 配图预览                   │
│  • 图片编辑                   │
│  • 导出功能                   │
│  • 广告展示（免开发接入）       │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│   腾讯云开发 CloudBase        │
├─────────────────────────────────┤
│  云函数：                      │
│  • article-analyzer            │
│  • image-generator             │
│  • export-handler              │
│                                │
│  数据库：                      │
│  • users                      │
│  • articles                   │
│  • images                     │
│  • styles                     │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│   腾讯混元 AI                 │
├─────────────────────────────────┤
│  • 文生文（1亿 Token）         │
│  • 文生图（1万张图片）         │
│  • Agent 框架                 │
└─────────────────────────────────┘
```

---

## 🔧 核心技术实现

### 1. 云开发 AI 模块接入

**方式一：小程序原生调用（推荐）**

```javascript
// 文生文（文章分析）
const ai = wx.cloud.getAI()
const result = await ai.textGeneration({
  model: "hunyuan-lite",
  messages: [
    {
      role: "system",
      content: "你是一个专业的文章配图分析师..."
    },
    {
      role: "user",
      content: "分析这篇文章需要在哪里配图..."
    }
  ]
})

// 文生图（配图生成）
const imageResult = await ai.imageGeneration({
  prompt: "tech风格的插画，展示AI工作流程...",
  style: "tech"
})
```

**方式二：云函数调用**

```javascript
// 云函数：article-analyzer
const cloud = require("wx-server-sdk")
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event) => {
  const ai = cloud.ai()

  // 分析文章结构
  const analysis = await ai.textGeneration({
    model: "hunyuan-lite",
    messages: [/* ... */]
  })

  // 生成配图
  const images = []
  for (const imgSpec of analysis.imagePositions) {
    const image = await ai.imageGeneration({
      prompt: imgSpec.prompt,
      style: imgSpec.style
    })
    images.push(image)
  }

  return {
    analysis,
    images
  }
}
```

**方式三：Agent 框架集成**

```javascript
// 创建配图 Agent
const agent = wx.cloud.createAgent({
  name: "article-illustrator",
  description: "文章配图专家",
  instructions: "你是一个专业的文章配图助手..."
})

// Agent 自动完成全流程
const result = await agent.sendMessage({
  content: "给这篇文章配图，风格为 tech",
  context: articleContent
})
```

---

### 2. 文章分析云函数

```javascript
// cloudfunctions/article-analyzer/index.js
const cloud = require("wx-server-sdk")
cloud.init()
const db = cloud.database()
const _ = db.command
const ai = cloud.ai()

exports.main = async (event, context) => {
  const { article, style = "auto" } = event

  // 1. 分析文章结构
  const structureAnalysis = await ai.textGeneration({
    model: "hunyuan-lite",
    messages: [
      {
        role: "system",
        content: `你是专业的文章配图分析师。
        任务：分析文章结构，找出需要配图的位置。

        输出格式 JSON：
        {
          "imagePositions": [
            {
              "position": 3,  // 插入位置（第几段后）
              "purpose": "强化核心论点/可视化数据/流程图解",
              "visualContent": "具体描述",
              "fileName": "img_01.png"
            }
          ],
          "recommendedStyle": "tech|warm|minimal|...",
          "reason": "选择理由"
        }`
      },
      {
        role: "user",
        content: `分析以下文章：\n\n${article}`
      }
    ]
  })

  // 2. 自动匹配风格
  let selectedStyle = style
  if (style === "auto") {
    const styleMatch = await ai.textGeneration({
      model: "hunyuan-lite",
      messages: [
        {
          role: "system",
          content: `根据文章内容推荐配图风格。
          风格库：
          - tech: 科技、AI、算法、代码
          - warm: 个人成长、情感、生活
          - minimal: 专业、商务
          - playful: 趣味、轻松
          - notion: 教程、知识分享
          - business: 商业、金融
          - nature: 健康、环保
          - creative: 设计、艺术

          输出：只输出风格名称，如：tech`
        },
        {
          role: "user",
          content: article.substring(0, 500) // 只用前500字匹配风格
        }
      ]
    })
    selectedStyle = styleMatch.content.trim()
  }

  return {
    imagePositions: JSON.parse(structureAnalysis.choices[0].message.content),
    style: selectedStyle
  }
}
```

---

### 3. 图片生成云函数

```javascript
// cloudfunctions/image-generator/index.js
const cloud = require("wx-server-sdk")
cloud.init()
const ai = cloud.ai()
const fs = require("fs")
const path = require("path")
const wxfs = cloud.getWXFileSystemManager()

exports.main = async (event, context) => {
  const { imagePositions, style, articleId } = event

  const generatedImages = []

  // 生成每张图
  for (const position of imagePositions) {
    const prompt = generatePrompt(position, style)

    try {
      // 调用混元文生图
      const result = await ai.imageGeneration({
        model: "hunyuan-image-pro", // 或 hunyuan-image-lite
        prompt: prompt,
        style: style,
        width: 1024,
        height: 576, // 16:9 比例
        response_format: "url"
      })

      // 保存图片到云存储
      const cloudPath = `images/${articleId}/${position.fileName}`
      await wxfs.uploadFile({
        cloudPath: cloudPath,
        filePath: result.imageURL // 临时文件需要处理
      })

      generatedImages.push({
        fileName: position.fileName,
        cloudPath: cloudPath,
        prompt: prompt,
        position: position.position
      })

      // 延迟避免并发限制
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`生成失败: ${position.fileName}`, error)

      // 自动重试一次
      try {
        const retryResult = await ai.imageGeneration({
          model: "hunyuan-image-lite", // 失败用轻量版
          prompt: prompt,
          style: style,
          width: 1024,
          height: 576
        })

        const cloudPath = `images/${articleId}/${position.fileName}`
        await wxfs.uploadFile({
          cloudPath: cloudPath,
          filePath: retryResult.imageURL
        })

        generatedImages.push({
          fileName: position.fileName,
          cloudPath: cloudPath,
          prompt: prompt,
          position: position.position
        })
      } catch (retryError) {
        console.error(`重试也失败`, retryError)
      }
    }
  }

  return {
    success: true,
    images: generatedImages,
    total: generatedImages.length
  }
}

// 生成提示词模板
function generatePrompt(position, style) {
  const styleTemplates = {
    tech: `创建科技风格的信息图插画。
    风格：蓝紫色调，电路元素，数据流
    内容：${position.visualContent}
    规格：16:9，横向，信息图
    原则：简洁、突出关键词、充足留白`,

    warm: `创建温暖亲和风格的信息图插画。
    风格：暖色调，人物元素，温馨场景
    内容：${position.visualContent}
    规格：16:9，横向，信息图
    原则：柔和、温暖、情感化`,

    minimal: `创建极简主义风格的信息图插画。
    风格：灰度色调，几何元素，线条
    内容：${position.visualContent}
    规格：16:9，横向，信息图
    原则：简洁、留白、专业`
  }

  return styleTemplates[style] || styleTemplates.tech
}
```

---

### 4. 广告接入（免开发模式）

```javascript
// app.js
App({
  onLaunch() {
    // 广告组件会自动智能插入
    // 无需额外代码
  }
})

// 或指定位置
Page({
  data: {
    adUnitId: "adunit-xxxxxxxx" // 从后台获取
  },

  onLoad() {
    // 广告组件会自动加载
  }
})

// WXML
<ad unit-id="{{adUnitId}}"></ad>
```

**后台配置：**
```
小程序后台 → 流量主 → 智能接入
→ 设置广告类型（banner/激励视频/插屏）
→ 设置展示规则
→ 实时预览效果
→ 一键上线
```

---

### 5. 导出功能

```javascript
// 导出为 Markdown
exportToMarkdown(article, images) {
  let content = article

  // 按位置插入图片
  images.sort((a, b) => a.position - b.position)

  images.forEach((img, index) => {
    const imgMark = `
![${img.prompt.substring(0, 20)}](https://你的CDN/${img.cloudPath})
`
    // 找到对应段落插入
    const lines = content.split('\n')
    const insertIndex = Math.min(img.position, lines.length - 1)
    lines.splice(insertIndex, 0, imgMark)
    content = lines.join('\n')
  })

  return content
}

// 导出为 HTML
exportToHTML(article, images) {
  let content = article.replace(/\n/g, '<br/>')

  images.forEach((img, index) => {
    const imgTag = `
<img src="https://你的CDN/${img.cloudPath}" alt="${img.prompt.substring(0, 30)}" style="max-width: 100%; margin: 20px 0;" />
`
    const lines = content.split('<br/>')
    const insertIndex = Math.min(img.position, lines.length - 1)
    lines.splice(insertIndex, 0, imgTag)
    content = lines.join('<br/>')
  })

  return content
}
```

---

## 📅 开发计划（更新）

### 第一周：基础架构

**Day 1-2：环境搭建**
- ✅ 创建微信小程序
- ✅ 开通云开发
- ✅ 申请 AI 小程序成长计划
- ✅ 配置混元 AI 模块
- ✅ 创建数据库（users, articles, images）

**Day 3-5：前端开发**
- ✅ 文章输入页面
- ✅ 风格选择组件
- ✅ 配图进度展示
- ✅ 基础 UI 布局

**Day 6-7：后端开发**
- ✅ article-analyzer 云函数
- ✅ image-generator 云函数
- ✅ 数据库操作

---

### 第二周：核心功能

**Day 8-10：配图生成**
- ✅ 文章分析逻辑
- ✅ 风格匹配算法
- ✅ 图片生成调用
- ✅ 错误重试机制

**Day 11-13：预览编辑**
- ✅ 配图预览界面
- ✅ 单张删除功能
- ✅ 重新生成功能
- ✅ 图片位置调整

**Day 14：测试**
- ✅ 功能测试
- ✅ 性能测试
- ✅ Bug 修复

---

### 第三周：优化与导出

**Day 15-17：导出功能**
- ✅ Markdown 导出
- ✅ HTML 导出
- ✅ 图片打包下载

**Day 18-19：用户体验优化**
- ✅ 加载动画
- ✅ 错误提示
- ✅ 成功反馈

**Day 20-21：广告接入**
- ✅ 申请流量主
- ✅ 配置智能广告
- ✅ 实时预览广告

---

### 第四周：上线准备

**Day 22-24：小程序审核**
- ✅ 提交审核材料
- ✅ 配置隐私协议
- ✅ 等待审核结果

**Day 25-26：内容准备**
- ✅ 准备公众号推广文章
- ✅ 添加 #来微信做个小程序 话题
- ✅ 设计宣传图

**Day 27-28：上线**
- ✅ 上线发布
- ✅ 监控数据
- ✅ 收集反馈

**总计：4周（28天）MVP上线**

---

## 💰 成本与收益（更新）

### 开发成本（MVP 阶段）

**固定成本：**
- 微信开发者工具：免费
- 云开发环境：免费（AI成长计划）
- 混元 Token：免费（1亿额度）
- 生图额度：免费（1万张图片）

**总计：¥0**

---

### 运营成本（每月）

**免费额度用完前：**
- 云开发：¥0
- AI 调用：¥0
- 存储：¥0

**免费额度用完后：**

**混元大模型：**
- 文生文：¥0.018/1K tokens
- 文生图：¥0.008/张（lite）
- 假设每月 1000万 tokens + 5000张图
- 成本：¥180 + ¥40 = ¥220/月

**云开发：**
- 基础版：¥19.9/月
- 存储空间：¥0.1/GB/月

**每月运营成本：约 ¥240**

---

### 收益预估

**免费版：**
- 广告收入：¥0.001-0.01/展示
- 假设 1000 用户 × 10次/天 × 30天 = 30万展示
- 广告收入：¥300-3000/月

**付费版：**
- 定价：¥9.9/月
- 假设 100 付费用户
- 订阅收入：¥990/月

**总收入预估：¥1290-3990/月**

---

## 🎯 公众号推广策略（新增）

### 1. 话题参与

**发布内容：**
```
标题：我用AI小程序自动给公众号配图，效率提升10倍！

正文：
- 介绍配图痛点
- 展示小程序功能
- 使用视频/动图演示
- 邀请用户体验

话题标签：
#来微信做个小程序
#AI小程序
#公众号运营
#内容创作
```

**最佳发布时间：**
- 工作日：19:00-21:00
- 周末：10:00-12:00, 15:00-17:00

---

### 2. 官方推广机会

**获得条件：**
- 使用 #来微信做个小程序 话题
- 小程序功能与 AI 相关
- 内容原创、有价值

**推广资源：**
- 微信官方推荐
- 小程序搜索加权
- 相关活动曝光

---

### 3. 引导转化

**转化路径：**
```
公众号文章
    ↓
点击小程序卡片
    ↓
体验配图功能（免费3次）
    ↓
满意 → 升级付费版
不满意 → 收集反馈
```

**激励机制：**
- 新用户送 10次免费配图
- 邀请好友各得 5次
- 分享到朋友圈额外 3次

---

## 🚀 优化后的 MVP 范围

### 必须包含（V1.0）

**核心功能：**
- ✅ 文章输入（粘贴）
- ✅ 文章分析（AI）
- ✅ 风格选择（3种：tech、warm、minimal）
- ✅ 图片生成（混元文生图）
- ✅ 预览界面
- ✅ 导出 Markdown
- ✅ 广告智能接入

---

### 可选功能（V1.1）

**增强功能：**
- ⭕ 公众号链接导入
- ⭕ Markdown 文件上传
- ⭕ 更多风格（全部9种）
- ⭕ 预览编辑（删除/重新生成）
- ⭕ HTML 导出
- ⭕ 图片打包下载

---

### 延后功能（V2.0）

**高级功能：**
- ⏸️ 自定义风格
- ⏸️ 历史记录
- ⏸️ 批量配图
- ⏸️ 图片编辑
- ⏸️ API 开放

---

## 📊 技术风险与对策

### 风险1：并发限制（EXCEED_CONCURRENT_REQUEST_LIMIT）

**现状：**
- 免费版有并发限制
- 用户多时可能出现错误

**对策：**
```javascript
// 1. 提示用户稍后重试
wx.showToast({
  title: "系统繁忙，请稍后重试",
  icon: "none"
})

// 2. 队列机制
// 使用云函数队列处理请求

// 3. 购买混元资源包
// 资源包用完后，购买可解除并发限制
```

---

### 风险2：免费额度用完

**对策：**
1. 监控用量（云开发控制台）
2. 接近额度时提醒
3. 引导购买资源包
4. 或限制每日免费次数

---

### 风险3：图片质量不稳定

**对策：**
1. 使用 hunyuan-image-pro（高质量）
2. 失败时自动降级到 lite
3. 用户反馈机制
4. 持续优化提示词

---

### 风险4：小程序审核不通过

**对策：**
1. 符合《小程序运营规范》
2. 内容安全过滤
3. 隐私协议完善
4. 备案材料齐全

---

## 📞 下一步行动

**立即开始：**
1. 申请 AI 小程序成长计划
2. 创建小程序项目
3. 开通云开发
4. 配置混元 AI

**第一周完成：**
1. 基础架构搭建
2. 文章输入页面
3. 配图生成云函数

**第一月目标：**
1. MVP 上线
2. 100 个种子用户
3. 公众号推广文章发布
4. 获得 #来微信做个小程序 话题曝光

---

## 💡 成功指标

**第一阶段（上线后1个月）：**
- 用户数：100+
- 日活：20+
- 配图次数：1000+
- 广告收入：¥100+
- 付费转化率：5%

**第二阶段（上线后3个月）：**
- 用户数：1000+
- 日活：100+
- 配图次数：10000+
- 广告收入：¥1000+
- 付费用户：50+

---

*本方案基于腾讯 AI 小程序成长计划，充分利用免费资源实现低成本 MVP*
