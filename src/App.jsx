import { useState } from 'react'

// ════════════════════════════════════════════════════════
//  数据逻辑（不修改）
// ════════════════════════════════════════════════════════

const SKILL_MAX = 200

const SKILL_LABELS = {
  analysis:     '分析能力',
  execution:    '执行能力',
  ai:           'AI能力',
  communication:'沟通能力',
  creativity:   '创意能力',
  life:         '生活能力',
}

const ATTR_LABELS = {
  happiness: '快乐值',
  energy:    '精力值',
  focus:     '专注值',
}

const SKILL_WEIGHTS = {
  analysis:      0.30,
  execution:     0.20,
  ai:            0.20,
  communication: 0.15,
  creativity:    0.15,
}

const RULES = [
  { match: ['研究同行', '同行账号', '拆解账号', '分析账号'],    skills: { analysis: 3 } },
  { match: ['整理内容', '内容结构', '内容分类', '内容方案'],    skills: { analysis: 2, creativity: 2 } },
  { match: ['看房', '看套房', '看了房'],                       skills: { life: 2 } },
  { match: ['散步', '跑步', '运动', '健身', '打球', '游泳'],   attrs:  { happiness: 3, energy: 2 } },
  { match: ['AI工具', '学AI', 'ChatGPT', 'Claude', '大模型', 'AI课', 'Midjourney', 'Cursor', 'AI知识'], skills: { ai: 3 } },
  { match: ['AI产品', 'PRD', '需求文档', '产品文档', '需求分析', '用户调研', '用户研究'],              skills: { ai: 3, analysis: 2 } },
  { match: ['写文案', '拍视频', '剪辑', '视频脚本', '短视频', '拍摄', '制作内容'],                     skills: { creativity: 3, execution: 2 } },
  { match: ['汇报', '开会', '谈判', '面试', '客户沟通'],        skills: { communication: 3 } },
  { match: ['输出方案', '写方案', '制作方案', '做规划', '写策划', '整理规划'], skills: { execution: 3, analysis: 2 } },
  { match: ['投放', '测试投放', '广告投放', '推广测试'],        skills: { execution: 3 } },
  { match: ['复盘', '写总结', '做总结', '反思'],                skills: { analysis: 3 } },
  { match: ['竞品分析', '分析竞品', '市场调研', '市场分析'],    skills: { analysis: 3 } },
  { match: ['读书', '看书', '阅读', '学习'],                    skills: { analysis: 2 } },
  { match: ['新媒体', '抖音', '小红书', '公众号', '视频号'],    skills: { creativity: 2, execution: 2 } },
  { match: ['找工作', '投简历', '刷题', '准备面试'],            skills: { execution: 2, communication: 1 } },
  { match: ['看电影', '放松', '娱乐'],                          attrs:  { happiness: 2 } },
  { match: ['休息', '午睡', '充电'],                            attrs:  { energy: 2 } },
  { match: ['冥想', '深度工作', '专注学习'],                    attrs:  { focus: 3 } },
]

const INITIAL_DATA = {
  player:     { level: 1, exp: 0 },
  attributes: { happiness: 0, energy: 0, focus: 0 },
  skills:     { analysis: 0, execution: 0, ai: 0, communication: 0, creativity: 0, life: 0 },
  records:    [],
}

function calcSkillPct(points) { return Math.min(Math.round(points / SKILL_MAX * 100), 100) }

function calcTotalProgress(skills) {
  let total = 0
  for (const [key, weight] of Object.entries(SKILL_WEIGHTS)) total += calcSkillPct(skills[key]) * weight
  return Math.round(total)
}

function calcLevel(exp) {
  if (exp < 100)  return 1
  if (exp < 300)  return 2
  if (exp < 600)  return 3
  if (exp < 1000) return 4
  if (exp < 1500) return 5
  return Math.floor(exp / 400) + 2
}

function parseText(text) {
  const skillGains = {}, attrGains = {}
  for (const rule of RULES) {
    for (const kw of rule.match) {
      if (text.includes(kw)) {
        if (rule.skills) for (const [k, v] of Object.entries(rule.skills)) skillGains[k] = (skillGains[k] || 0) + v
        if (rule.attrs)  for (const [k, v] of Object.entries(rule.attrs))  attrGains[k]  = (attrGains[k]  || 0) + v
        break
      }
    }
  }
  const totalExp = [...Object.values(skillGains), ...Object.values(attrGains)].reduce((a, b) => a + b, 0)
  return { skillGains, attrGains, totalExp }
}

function generateComment(skillGains, attrGains, totalExp) {
  if (totalExp === 0) return '今天没有检测到成长活动，试着描述得更具体，比如"研究了同行账号"、"散步30分钟"。'
  const hasCareer = ['analysis','execution','ai','communication','creativity'].some(k => skillGains[k])
  const hasLife   = attrGains.happiness || attrGains.energy || skillGains.life
  if (hasCareer && hasLife) return '你今天同时推进了职业成长与生活规划，多个支线正在稳步前进。'
  if (skillGains.ai)        return '今天在AI能力上有所突破，向AI产品经理又近了一步！'
  if ((skillGains.analysis || 0) >= 3) return '今天大量输入与分析，思维在悄悄升级中。'
  if (hasCareer)            return '今天的努力已被记录，职业成长正在发生。'
  if (hasLife)              return '今天照顾好了自己，能量满满才能继续前行。'
  return '今天的成长已记录，继续保持！'
}

function loadData() {
  try {
    const raw = localStorage.getItem('xhm-life-game')
    if (raw) {
      const s = JSON.parse(raw)
      return {
        player:     { ...INITIAL_DATA.player,     ...s.player },
        attributes: { ...INITIAL_DATA.attributes, ...s.attributes },
        skills:     { ...INITIAL_DATA.skills,      ...s.skills },
        records:    s.records || [],
      }
    }
  } catch {}
  return { ...INITIAL_DATA }
}

function saveData(data) { localStorage.setItem('xhm-life-game', JSON.stringify(data)) }

// ════════════════════════════════════════════════════════
//  像素风木质 UI 样式常量
// ════════════════════════════════════════════════════════

const W = {
  // 主面板（亮木色）
  panel: {
    background: 'linear-gradient(160deg,#d4aa6a 0%,#c49450 60%,#b8843a 100%)',
    border: '3px solid #3d1a00',
    boxShadow: 'inset 0 0 0 2px #e8c87a, 0 4px 16px rgba(0,0,0,0.55)',
  },
  // 面板标题栏
  header: {
    background: 'linear-gradient(180deg,#9b6420 0%,#7a4a10 100%)',
    borderBottom: '3px solid #3d1a00',
    padding: '6px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  // 内嵌卡片（浅木色）
  card: {
    background: 'linear-gradient(160deg,#e8c87a 0%,#d4a96a 100%)',
    border: '2px solid #8b5213',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
  },
  // 深色内嵌区域
  inset: {
    background: '#2e1400',
    border: '2px solid #1a0800',
    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
  },
  // 深色面板（结算结果区）
  dark: {
    background: '#4a2800',
    border: '3px solid #3d1a00',
    boxShadow: 'inset 0 0 0 1px #6b3d10',
  },
}

// 技能颜色表
const SC = {
  analysis:     { bar: '#5ab4ff', bg: '#0a1e35' },
  execution:    { bar: '#5aff9a', bg: '#0a2010' },
  ai:           { bar: '#cc5aff', bg: '#20093a' },
  communication:{ bar: '#ff5acc', bg: '#35092a' },
  creativity:   { bar: '#ffd040', bg: '#352800' },
  life:         { bar: '#5aff70', bg: '#0a2a10' },
}

// ════════════════════════════════════════════════════════
//  基础 UI 组件
// ════════════════════════════════════════════════════════

function Panel({ children, style = {}, className = '' }) {
  return (
    <div className={className} style={{ ...W.panel, ...style }}>
      {children}
    </div>
  )
}

function PanelWithTitle({ children, icon, title, style = {}, contentStyle = {}, className = '' }) {
  return (
    <div className={className} style={{ ...W.panel, ...style, padding: 0, overflow: 'hidden' }}>
      <div style={W.header}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <span style={{ color: '#ffe8a0', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em' }}>{title}</span>
      </div>
      <div style={{ padding: '10px 12px', ...contentStyle }}>
        {children}
      </div>
    </div>
  )
}

// 像素进度条
function PixelBar({ value, max = 100, color = '#5ab4ff', bg = '#0a1020', height = 10 }) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  return (
    <div style={{ height, background: bg, border: '2px solid #1a0800', overflow: 'hidden', position: 'relative' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.5s ease' }} />
    </div>
  )
}

// 小技能行（右侧面板）
function SkillRow({ sk, points, icon }) {
  const pct = calcSkillPct(points)
  const c   = SC[sk]
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
        <span style={{ fontSize: 12 }}>{icon}</span>
        <span style={{ color: '#7a4a10', fontSize: 11, fontWeight: 700, flex: 1 }}>{SKILL_LABELS[sk]}</span>
        <span style={{ color: '#4a2000', fontSize: 11, fontFamily: 'monospace', fontWeight: 700 }}>{points}</span>
      </div>
      <PixelBar value={pct} color={c.bar} bg={c.bg} height={8} />
    </div>
  )
}

// ════════════════════════════════════════════════════════
//  顶部信息栏
// ════════════════════════════════════════════════════════

function TopBar({ data }) {
  const { player, attributes } = data
  const level = calcLevel(player.exp)

  const thresholds = [0, 100, 300, 600, 1000, 1500]
  const lvIdx      = Math.min(level - 1, thresholds.length - 1)
  const prevExp    = thresholds[lvIdx] || 0
  const nextExp    = thresholds[lvIdx + 1] || prevExp + 500
  const expInLv    = player.exp - prevExp
  const expNeeded  = nextExp - prevExp

  const today = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })

  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
      background: 'linear-gradient(180deg,#5a3010 0%,#3d1e08 100%)',
      borderBottom: '3px solid #1a0800',
      boxShadow: '0 3px 10px rgba(0,0,0,0.7)',
    }}>
      {/* 玩家卡 */}
      <div style={{ ...W.panel, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', minWidth: 240, height: 56 }}>
        <div style={{
          width: 40, height: 40, flexShrink: 0,
          background: 'linear-gradient(135deg,#c49450,#7a4a10)',
          border: '2px solid #3d1a00',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 900, color: '#fff8e0',
        }}>夏</div>
        <div>
          <div style={{ color: '#3d1a00', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>夏浩铭</div>
          <div style={{ color: '#7a4a10', fontSize: 11 }}>Lv.{level} · AI产品经理候补生</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <div style={{ flex: 1 }}><PixelBar value={expInLv} max={expNeeded} color="#ffc020" bg="#2a1000" height={6} /></div>
            <span style={{ color: '#7a4a10', fontSize: 10, whiteSpace: 'nowrap' }}>{player.exp} EXP</span>
          </div>
        </div>
      </div>

      {/* 快乐值 */}
      <div style={{ ...W.panel, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', height: 56, minWidth: 150 }}>
        <span style={{ fontSize: 18 }}>❤️</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#7a4a10', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>快乐值 {attributes.happiness}</div>
          <PixelBar value={Math.min(attributes.happiness, 100)} color="#ff6060" bg="#2a0a0a" height={8} />
        </div>
      </div>

      {/* 精力值 */}
      <div style={{ ...W.panel, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', height: 56, minWidth: 150 }}>
        <span style={{ fontSize: 18 }}>⚡</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#7a4a10', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>精力值 {attributes.energy}</div>
          <PixelBar value={Math.min(attributes.energy, 100)} color="#50e870" bg="#0a200a" height={8} />
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* 日期 */}
      <div style={{ ...W.panel, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', height: 56 }}>
        <span style={{ fontSize: 20 }}>☀️</span>
        <div>
          <div style={{ color: '#3d1a00', fontWeight: 700, fontSize: 13 }}>成都 · 晴天</div>
          <div style={{ color: '#7a4a10', fontSize: 11 }}>{today}</div>
        </div>
      </div>

      {/* 工具图标 */}
      {['🎁', '📖', '⚙️'].map((icon, i) => (
        <button key={i} style={{
          ...W.panel, width: 42, height: 42, fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #3d1a00', transition: 'filter 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.2)'}
          onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
        >{icon}</button>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════
//  左侧面板：任务
// ════════════════════════════════════════════════════════

function LeftPanel({ data }) {
  const progress = calcTotalProgress(data.skills)
  return (
    <div style={{
      width: 288, flexShrink: 0, padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
      background: 'rgba(10,4,0,0.55)', borderRight: '3px solid #1a0800', overflowY: 'auto',
    }}>
      {/* 主线任务 */}
      <PanelWithTitle icon="⭐" title="主线任务">
        <div style={{ ...W.card, padding: '8px 10px', display: 'flex', alignItems: 'flex-start', gap: 8 }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.05)'}
          onMouseLeave={e => e.currentTarget.style.filter = 'none'}
        >
          <span style={{ fontSize: 20, marginTop: 1 }}>🌿</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#3d1a00', fontWeight: 700, fontSize: 13 }}>天天开心</div>
            <div style={{ color: '#7a4a10', fontSize: 11, margin: '2px 0 4px' }}>永久进行中...</div>
            <PixelBar value={100} color="#777" bg="#1a0a00" height={6} />
            <div style={{ color: '#9a6a30', fontSize: 10, marginTop: 2 }}>∞</div>
          </div>
        </div>
      </PanelWithTitle>

      {/* 支线任务 */}
      <PanelWithTitle icon="🌿" title="支线任务">
        {/* 进行中 */}
        <div style={{ ...W.card, padding: '8px 10px', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6,
          border: '2px solid #a06020', boxShadow: '0 0 0 1px #e8a830' }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
          onMouseLeave={e => e.currentTarget.style.filter = 'none'}
        >
          <div style={{
            width: 32, height: 32, flexShrink: 0, fontSize: 16,
            background: '#6b3d0f', border: '2px solid #3d1a00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>👤</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#3d1a00', fontWeight: 700, fontSize: 12, lineHeight: 1.3 }}>
              从装修获客到AI产品经理
            </div>
            <div style={{ margin: '4px 0 2px' }}>
              <PixelBar value={progress} color="#d4a800" bg="#1a1000" height={8} />
            </div>
            <div style={{ color: '#7a4a10', fontSize: 11 }}>{progress}%</div>
          </div>
        </div>

        {/* 未解锁 */}
        {[0, 1].map(i => (
          <div key={i} style={{
            padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,0,0,0.35)', border: '2px solid #2a1000',
            marginBottom: i === 0 ? 6 : 0,
          }}>
            <span style={{ fontSize: 18, opacity: 0.5 }}>🔒</span>
            <div>
              <div style={{ color: '#6b3d0f', fontSize: 12, fontWeight: 700, opacity: 0.6 }}>???</div>
              <div style={{ color: '#4a2800', fontSize: 10, opacity: 0.5 }}>未解锁</div>
            </div>
          </div>
        ))}
      </PanelWithTitle>
    </div>
  )
}

// ════════════════════════════════════════════════════════
//  中央面板：农场背景 + 选择频道
// ════════════════════════════════════════════════════════

const CHANNELS = [
  { icon: '🌧️', name: '天气预报',   id: 'weather' },
  { icon: '🎲', name: '算命占卜',   id: 'fortune' },
  { icon: '🏠', name: '离地而居',   id: 'housing' },
  { icon: '📹', name: '内容创作',   id: 'content' },
  { icon: '🤖', name: 'AI产品经理', id: 'aipm'    },
  { icon: '🎬', name: '视频制作',   id: 'video'   },
]

function CenterPanel() {
  const [hovered, setHovered] = useState(null)
  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {/* 农场背景 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg,#1a2e4a 0%,#2a4a6c 22%,#3a6a4a 58%,#2a5a2a 72%,#1a3a0a 100%)',
      }} />

      {/* 星星 */}
      {[...Array(16)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute', width: 2, height: 2, background: '#fff',
          left: `${8 + i * 5.5}%`, top: `${4 + (i % 5) * 4}%`,
          opacity: 0.5 + (i % 3) * 0.2,
        }} />
      ))}

      {/* 地面层 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
        background: 'linear-gradient(0deg,#1a3a08 0%,#2a5a14 50%,transparent 100%)',
      }} />

      {/* 简单像素树（装饰） */}
      {[{x:'8%',h:120},{x:'82%',h:100},{x:'12%',h:80},{x:'75%',h:130}].map((t,i)=>(
        <div key={i} style={{
          position:'absolute', bottom:'28%', left:t.x,
          width:20, height:t.h,
          background:'linear-gradient(180deg,#1a4a0a 0%,#0d2a04 100%)',
          boxShadow:'12px 0 0 #1a4a0a, -8px 0 0 #0d2a04',
          imageRendering:'pixelated',
        }}/>
      ))}

      {/* 选择频道浮窗 */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        ...W.panel, padding: 0, overflow: 'hidden', minWidth: 300,
        boxShadow: `${W.panel.boxShadow}, 0 8px 40px rgba(0,0,0,0.75)`,
        zIndex: 10,
      }}>
        {/* 频道标题 */}
        <div style={{
          ...W.header, justifyContent: 'center',
          padding: '10px 24px', borderBottom: '3px solid #3d1a00',
        }}>
          <span style={{ fontSize: 16 }}>🌿</span>
          <span style={{ color: '#ffe8a0', fontWeight: 900, fontSize: 16, letterSpacing: '0.15em', margin: '0 10px' }}>
            选择频道
          </span>
          <span style={{ fontSize: 16 }}>🌿</span>
        </div>

        {/* 频道列表 */}
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CHANNELS.map(ch => (
            <button key={ch.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', width: '100%', textAlign: 'left',
                background: hovered === ch.id
                  ? 'linear-gradient(160deg,#ead890 0%,#d4b840 100%)'
                  : 'linear-gradient(160deg,#d4aa6a 0%,#c49450 100%)',
                border: '2px solid #4a2000',
                boxShadow: hovered === ch.id
                  ? 'inset 0 0 0 1px rgba(255,255,255,0.4), 2px 2px 0 #2a1000'
                  : 'inset 0 0 0 1px #e8c87a, 3px 3px 0 #2a1000',
                transform: hovered === ch.id ? 'translate(-1px,-1px)' : 'none',
                transition: 'all 0.1s',
              }}
              onMouseEnter={() => setHovered(ch.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <span style={{ fontSize: 22, width: 28, textAlign: 'center' }}>{ch.icon}</span>
              <span style={{ color: '#3d1a00', fontWeight: 700, fontSize: 15 }}>{ch.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════
//  右侧面板：角色 + 技能
// ════════════════════════════════════════════════════════

const SKILL_META = [
  { key: 'analysis',     icon: '🔬' },
  { key: 'execution',    icon: '⚡' },
  { key: 'ai',           icon: '🤖' },
  { key: 'communication',icon: '💬' },
  { key: 'creativity',   icon: '✨' },
  { key: 'life',         icon: '🌿' },
]

function RightPanel({ data }) {
  const [activeTab, setActiveTab] = useState(0)
  const tabIcons = ['👤','💇','👕','👖','💍']

  return (
    <div style={{
      width: 320, flexShrink: 0, padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
      background: 'rgba(10,4,0,0.55)', borderLeft: '3px solid #1a0800', overflowY: 'auto',
    }}>
      {/* 角色面板 */}
      <Panel style={{ padding: 0, overflow: 'hidden' }}>
        {/* 标签页 */}
        <div style={{ display: 'flex', borderBottom: '3px solid #3d1a00' }}>
          {tabIcons.map((icon, i) => (
            <button key={i}
              onClick={() => setActiveTab(i)}
              style={{
                flex: 1, height: 36, fontSize: 16,
                background: activeTab === i
                  ? 'linear-gradient(180deg,#d4aa6a,#c49450)'
                  : 'linear-gradient(180deg,#7a4a10,#5a3008)',
                border: 'none', borderRight: '1px solid #3d1a00',
                transition: 'filter 0.15s',
              }}
              onMouseEnter={e => { if (activeTab !== i) e.currentTarget.style.filter = 'brightness(1.2)' }}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >{icon}</button>
          ))}
        </div>

        <div style={{ padding: 10 }}>
          {/* 角色外观区 */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            {/* 角色预览框 */}
            <div style={{
              width: 90, height: 110, flexShrink: 0,
              background: 'linear-gradient(180deg,#4a8a2a 0%,#2a5a10 100%)',
              border: '3px solid #3d1a00', boxShadow: 'inset 0 0 0 1px #6aaa3a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 44, imageRendering: 'pixelated',
            }}>🧑‍💼</div>

            {/* 角色信息 */}
            <div style={{ flex: 1 }}>
              <div style={{ ...W.card, padding: '6px 8px', marginBottom: 6 }}>
                <div style={{ color: '#7a4a10', fontSize: 10 }}>名字</div>
                <div style={{ color: '#3d1a00', fontWeight: 700, fontSize: 13 }}>夏浩铭</div>
              </div>
              <div style={{ ...W.card, padding: '6px 8px', marginBottom: 6 }}>
                <div style={{ color: '#7a4a10', fontSize: 10 }}>当前章节</div>
                <div style={{ color: '#3d1a00', fontSize: 11, fontWeight: 500 }}>第三章《AI转型》</div>
              </div>
              <div style={{ ...W.card, padding: '6px 8px' }}>
                <div style={{ color: '#7a4a10', fontSize: 10 }}>目标称号</div>
                <div style={{ color: '#3d1a00', fontSize: 11, fontWeight: 700 }}>AI产品经理</div>
              </div>
            </div>
          </div>

          {/* 占位提示 */}
          <div style={{
            textAlign: 'center', padding: '4px 8px', fontSize: 10,
            color: '#9a6a30', background: 'rgba(0,0,0,0.2)',
            border: '1px dashed #6b3d10',
          }}>
            换装系统 · 即将开放
          </div>
        </div>
      </Panel>

      {/* 属性与技能 */}
      <PanelWithTitle icon="⚔️" title="属性与技能">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px' }}>
          {SKILL_META.map(({ key, icon }) => (
            <SkillRow key={key} sk={key} points={data.skills[key]} icon={icon} />
          ))}
        </div>
      </PanelWithTitle>
    </div>
  )
}

// ════════════════════════════════════════════════════════
//  底部导航
// ════════════════════════════════════════════════════════

const NAV = [
  { id: 'home',    icon: '⚔️', label: '主页'   },
  { id: 'tasks',   icon: '⭐', label: '任务'   },
  { id: 'settle',  icon: '📋', label: '结算'   },
  { id: 'char',    icon: '👤', label: '角色'   },
  { id: 'achieve', icon: '🏆', label: '成就'   },
]

function BottomNav({ tab, onChange }) {
  return (
    <div style={{
      height: '100%', display: 'flex',
      background: 'linear-gradient(0deg,#2a1200 0%,#3d1e08 100%)',
      borderTop: '3px solid #1a0800',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.7)',
    }}>
      {NAV.map(t => {
        const active = tab === t.id
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 3, height: '100%',
            background: active ? 'linear-gradient(180deg,#c49450 0%,#8b5213 100%)' : 'transparent',
            border: 'none', borderRight: '1px solid #1a0800',
            borderTop: active ? '3px solid #e8c870' : '3px solid transparent',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(196,148,80,0.2)' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ fontSize: 24 }}>{t.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: active ? '#fff8e0' : '#c49450' }}>
              {t.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ════════════════════════════════════════════════════════
//  首页（完整三栏布局）
// ════════════════════════════════════════════════════════

function HomePage({ data }) {
  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      <LeftPanel data={data} />
      <CenterPanel />
      <RightPanel data={data} />
    </div>
  )
}

// ════════════════════════════════════════════════════════
//  每日结算页（重新设计风格，逻辑不变）
// ════════════════════════════════════════════════════════

function DailySettlement({ data, onUpdate }) {
  const [text, setText]     = useState('')
  const [result, setResult] = useState(null)
  const today = new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit' }).replace(/\//g,'-')

  function handleSettle() {
    if (!text.trim()) return
    const { skillGains, attrGains, totalExp } = parseText(text)
    const newSkills = { ...data.skills }
    for (const [k,v] of Object.entries(skillGains)) newSkills[k] = (newSkills[k]||0) + v
    const newAttrs = { ...data.attributes }
    for (const [k,v] of Object.entries(attrGains))  newAttrs[k]  = (newAttrs[k] ||0) + v
    const newExp      = data.player.exp + totalExp
    const newProgress = calcTotalProgress(newSkills)
    const comment     = generateComment(skillGains, attrGains, totalExp)
    const record = { date:today, text, skillGains, attrGains, totalExp, progress:newProgress, comment }
    onUpdate({ ...data, player: { level:calcLevel(newExp), exp:newExp }, attributes:newAttrs, skills:newSkills, records:[record,...data.records] })
    setResult({ skillGains, attrGains, totalExp, progress:newProgress, comment })
  }

  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
      background: 'linear-gradient(180deg,#1a2a0a 0%,#0d1505 100%)',
    }}>
      <div style={{ ...W.panel, width: '100%', maxWidth: 680, padding: 0, overflow: 'hidden' }}>
        {/* 标题 */}
        <div style={{ ...W.header, padding: '10px 16px' }}>
          <span>📋</span>
          <span style={{ color:'#ffe8a0', fontWeight:900, fontSize:16, letterSpacing:'0.1em', flex:1 }}>每日结算</span>
          <span style={{ color:'#c49450', fontSize:12 }}>{today}</span>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ color:'#3d1a00', fontWeight:700, fontSize:14, marginBottom:8 }}>今天做了什么？</div>
            <textarea
              rows={5}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={'例如：\n研究了5个同行账号\n整理了内容结构\n散步30分钟'}
              style={{
                ...W.inset, width:'100%', padding:12, resize:'none',
                color:'#e8c87a', fontSize:13, lineHeight:1.7, fontFamily:'inherit',
              }}
            />
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={handleSettle} disabled={!text.trim()} style={{
              flex:1, padding:'12px 0', fontWeight:900, fontSize:14, letterSpacing:'0.05em',
              background: text.trim() ? 'linear-gradient(180deg,#d4aa6a 0%,#8b5213 100%)' : '#3d2810',
              border: '2px solid #3d1a00',
              boxShadow: text.trim() ? '3px 3px 0 #1a0800' : 'none',
              color: text.trim() ? '#3d1a00' : '#6b4a2a',
              transition: 'all 0.1s',
            }}
              onMouseEnter={e => { if(text.trim()) { e.currentTarget.style.transform='translate(-1px,-1px)'; e.currentTarget.style.boxShadow='4px 4px 0 #1a0800' } }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=text.trim()?'3px 3px 0 #1a0800':'none' }}
            >✨ 开始结算</button>
            {result && (
              <button onClick={() => { setText(''); setResult(null) }} style={{
                padding:'12px 18px', fontWeight:700, fontSize:13,
                background:'linear-gradient(180deg,#7a4a10 0%,#4a2800 100%)',
                border:'2px solid #3d1a00', color:'#e8c87a', boxShadow:'2px 2px 0 #1a0800',
              }}>重置</button>
            )}
          </div>

          {/* 结算结果 */}
          {result && (
            <div style={{ ...W.dark, padding:14 }}>
              <div style={{ color:'#c49450', fontWeight:700, fontSize:11, letterSpacing:'0.15em', marginBottom:12, textAlign:'center' }}>
                ─── 结算结果 ───
              </div>

              {Object.keys(result.skillGains).length > 0 && (
                <div style={{ marginBottom:10 }}>
                  <div style={{ color:'#9a6a30', fontSize:11, marginBottom:4 }}>技能成长</div>
                  {Object.entries(result.skillGains).map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', borderBottom:'1px solid rgba(139,82,19,0.3)' }}>
                      <span style={{ color:'#d4a96a', fontSize:13 }}>{SKILL_LABELS[k]}</span>
                      <span style={{ color:'#70ff90', fontWeight:700 }}>+{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {Object.keys(result.attrGains).length > 0 && (
                <div style={{ marginBottom:10 }}>
                  <div style={{ color:'#9a6a30', fontSize:11, marginBottom:4 }}>属性变化</div>
                  {Object.entries(result.attrGains).map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', borderBottom:'1px solid rgba(139,82,19,0.3)' }}>
                      <span style={{ color:'#d4a96a', fontSize:13 }}>{ATTR_LABELS[k]}</span>
                      <span style={{ color:'#60f0a0', fontWeight:700 }}>+{v}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ borderTop:'2px solid #6b3d10', paddingTop:8, display:'flex', flexDirection:'column', gap:4 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:'#9a6a30', fontSize:13 }}>今日经验值</span>
                  <span style={{ color:'#ffd040', fontWeight:900 }}>+{result.totalExp} EXP</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:'#9a6a30', fontSize:13 }}>AI产品经理总进度</span>
                  <span style={{ color:'#ffd040', fontWeight:900 }}>{result.progress}%</span>
                </div>
              </div>

              <div style={{
                marginTop:10, padding:'8px 12px', fontSize:12, lineHeight:1.7,
                fontStyle:'italic', color:'#e8c870',
                background:'rgba(0,0,0,0.3)', borderLeft:'3px solid #c49450',
              }}>
                {result.comment}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════
//  占位页面
// ════════════════════════════════════════════════════════

function PlaceholderPage({ icon, title }) {
  return (
    <div style={{
      height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16,
      background:'linear-gradient(180deg,#1a2a0a 0%,#0d1505 100%)',
    }}>
      <div style={{ fontSize:72 }}>{icon}</div>
      <div style={{ ...W.panel, padding:'10px 28px', color:'#7a4a10', fontWeight:900, fontSize:16, letterSpacing:'0.1em' }}>
        {title} · 开发中
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════
//  任务页面
// ════════════════════════════════════════════════════════

const QUEST_STAGES = [
  { id: 0, title: '研究同行10家账号',       rewardDesc: '分析能力 +2', rewards: { analysis: 2 } },
  { id: 1, title: '搭建自媒体内容输出流程', rewardDesc: '执行能力 +2', rewards: { execution: 2 } },
  { id: 2, title: 'AI辅助内容生产落地',     rewardDesc: 'AI能力 +3',   rewards: { ai: 3 } },
  { id: 3, title: '数据复盘与投流试错',     rewardDesc: '分析能力 +3', rewards: { analysis: 3 } },
  { id: 4, title: '输出可复用获客方案',     rewardDesc: '所有技能 +2', rewards: { analysis: 2, execution: 2, ai: 2, communication: 2, creativity: 2, life: 2 }, titleUnlock: 'AI产品经理候补生' },
]

const RANDOM_EVENT_POOL = [
  { id: 'walk',   text: '去天府绿道散步？',           canReject: true,  accept: { attrs: { happiness: 2, energy: 1 } },                                        desc: '心情+2，精力+1' },
  { id: 'food',   text: '吃顿好的螺蛳粉？',           canReject: true,  accept: { attrs: { happiness: 3 } },                                                   desc: '心情+3' },
  { id: 'video',  text: '刷了2小时短视频...',         canReject: false, accept: { attrs: { energy: -1 } },                                                     desc: '精力-1' },
  { id: 'aitool', text: '发现一个新AI工具！',         canReject: true,  accept: { skills: { ai: 1 } },                                                         desc: 'AI能力+1' },
  { id: 'rest',   text: '今天状态很差，要不要休息？', canReject: true,  accept: { attrs: { energy: 2 } },                                                      desc: '精力+2' },
  { id: 'book',   text: '下雨了，窝在家看会书？',     canReject: true,  accept: { skills: { analysis: 1 } },                                                   desc: '分析能力+1' },
  { id: 'chat',   text: '遇到有趣的人，聊了一路',     canReject: true,  accept: { skills: { communication: 1 }, attrs: { happiness: 2 } },                     desc: '沟通能力+1，心情+2' },
]

function loadQuestState() {
  try {
    const raw = localStorage.getItem('xhm-quest-state')
    if (raw) return JSON.parse(raw)
  } catch {}
  return { completedStages: [], dismissedEvents: {} }
}

function saveQuestState(s) { localStorage.setItem('xhm-quest-state', JSON.stringify(s)) }

function pickTodayEventIds() {
  const today = new Date().toISOString().slice(0, 10)
  const seed  = parseInt(today.replace(/-/g, ''), 10)
  const count = 1 + (seed % 2)
  return [...RANDOM_EVENT_POOL]
    .map((e, i) => ({ e, s: (seed * 31 + i * 17) % 100 }))
    .sort((a, b) => a.s - b.s)
    .slice(0, count)
    .map(x => x.e.id)
}

function RewardModal({ stage, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}>
      <div style={{ ...W.panel, width: 320, padding: 0, overflow: 'hidden' }}>
        <div style={{ ...W.header, justifyContent: 'center', padding: '10px 20px' }}>
          <span style={{ color: '#ffe8a0', fontWeight: 900, fontSize: 16, letterSpacing: '0.1em' }}>✨ 任务完成！</span>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...W.card, padding: '8px 12px' }}>
            <div style={{ color: '#7a4a10', fontSize: 11, marginBottom: 2 }}>完成任务</div>
            <div style={{ color: '#3d1a00', fontWeight: 700, fontSize: 13 }}>{stage.title}</div>
          </div>
          <div style={{ ...W.dark, padding: '10px 14px' }}>
            <div style={{ color: '#c49450', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>获得奖励</div>
            {Object.entries(stage.rewards).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(139,82,19,0.3)' }}>
                <span style={{ color: '#d4a96a', fontSize: 13 }}>{SKILL_LABELS[k]}</span>
                <span style={{ color: '#70ff90', fontWeight: 700 }}>+{v}</span>
              </div>
            ))}
            {stage.titleUnlock && (
              <div style={{ marginTop: 10, padding: '8px', background: 'rgba(255,215,0,0.1)', border: '1px solid #d4a800', textAlign: 'center' }}>
                <span style={{ color: '#ffd040', fontSize: 12, fontWeight: 700 }}>🏆 解锁称号：{stage.titleUnlock}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            padding: '10px 0', fontWeight: 900, fontSize: 14,
            background: 'linear-gradient(180deg,#d4aa6a 0%,#8b5213 100%)',
            border: '2px solid #3d1a00', color: '#3d1a00',
            boxShadow: '3px 3px 0 #1a0800', transition: 'all 0.1s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '4px 4px 0 #1a0800' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '3px 3px 0 #1a0800' }}
          >确认领取</button>
        </div>
      </div>
    </div>
  )
}

function TasksPage({ data, onUpdate }) {
  const [questState, setQuestState] = useState(loadQuestState)
  const [modal, setModal]           = useState(null)

  const today          = new Date().toISOString().slice(0, 10)
  const todayEventIds  = pickTodayEventIds()
  const dismissed      = questState.dismissedEvents[today] || []
  const activeEventIds = todayEventIds.filter(id => !dismissed.includes(id))

  const completedCount  = questState.completedStages.length
  const questProgress   = Math.round(completedCount / QUEST_STAGES.length * 100)
  const currentStageIdx = QUEST_STAGES.findIndex(s => !questState.completedStages.includes(s.id))
  const allDone         = currentStageIdx === -1

  function pushQuestState(next) { setQuestState(next); saveQuestState(next) }

  function handleCompleteStage(idx) {
    const stage = QUEST_STAGES[idx]
    setModal({
      stage,
      onClose: () => {
        const newSkills = { ...data.skills }
        for (const [k, v] of Object.entries(stage.rewards)) newSkills[k] = (newSkills[k] || 0) + v
        onUpdate({ ...data, skills: newSkills })
        pushQuestState({ ...questState, completedStages: [...questState.completedStages, idx] })
        setModal(null)
      },
    })
  }

  function handleEventAction(eventId, accept) {
    const ev = RANDOM_EVENT_POOL.find(e => e.id === eventId)
    if (accept && ev) {
      const newSkills = { ...data.skills }
      const newAttrs  = { ...data.attributes }
      if (ev.accept.skills) for (const [k, v] of Object.entries(ev.accept.skills)) newSkills[k] = (newSkills[k] || 0) + v
      if (ev.accept.attrs)  for (const [k, v] of Object.entries(ev.accept.attrs))  newAttrs[k]  = (newAttrs[k]  || 0) + v
      onUpdate({ ...data, skills: newSkills, attributes: newAttrs })
    }
    pushQuestState({ ...questState, dismissedEvents: { ...questState.dismissedEvents, [today]: [...dismissed, eventId] } })
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'linear-gradient(180deg,#1a2a0a 0%,#0d1505 100%)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 主线任务 */}
        <PanelWithTitle icon="⭐" title="主线任务">
          <div style={{ ...W.card, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>🌿</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#3d1a00', fontWeight: 700, fontSize: 14 }}>天天开心</div>
              <div style={{ color: '#7a4a10', fontSize: 12, marginTop: 3 }}>永久进行中 · 无法完成</div>
            </div>
            <div style={{ ...W.inset, padding: '4px 12px', fontSize: 13, color: '#9a6a30', fontFamily: 'monospace' }}>∞</div>
          </div>
        </PanelWithTitle>

        {/* 支线任务 */}
        <PanelWithTitle icon="🌱" title="支线任务">
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ color: '#3d1a00', fontWeight: 700, fontSize: 13 }}>从0到1成为AI产品经理</span>
              <span style={{ color: '#7a4a10', fontSize: 12, fontFamily: 'monospace' }}>{questProgress}%</span>
            </div>
            <PixelBar value={questProgress} color="#d4a800" bg="#1a1000" height={10} />
          </div>

          {questState.completedStages.map(idx => {
            const s = QUEST_STAGES[idx]
            return (
              <div key={idx} style={{
                padding: '8px 12px', marginBottom: 6,
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(0,80,20,0.2)', border: '2px solid #1a4010',
              }}>
                <span style={{ fontSize: 16 }}>✅</span>
                <div>
                  <div style={{ color: '#4a7a30', fontWeight: 700, fontSize: 12, textDecoration: 'line-through' }}>{s.title}</div>
                  <div style={{ color: '#3a5a20', fontSize: 11 }}>{s.rewardDesc}</div>
                </div>
              </div>
            )
          })}

          {!allDone && (() => {
            const s = QUEST_STAGES[currentStageIdx]
            return (
              <div style={{ ...W.card, padding: '10px 14px', marginBottom: 6, border: '2px solid #a06020', boxShadow: '0 0 0 1px #e8a830' }}>
                <div style={{ color: '#7a4a10', fontSize: 11, marginBottom: 4 }}>进行中 · 阶段 {currentStageIdx + 1}/{QUEST_STAGES.length}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#3d1a00', fontWeight: 700, fontSize: 13 }}>{s.title}</div>
                    <div style={{ color: '#7a4a10', fontSize: 11, marginTop: 4 }}>奖励：{s.rewardDesc}</div>
                  </div>
                  <button onClick={() => handleCompleteStage(currentStageIdx)} style={{
                    padding: '8px 16px', fontWeight: 700, fontSize: 12, flexShrink: 0,
                    background: 'linear-gradient(180deg,#d4aa6a 0%,#8b5213 100%)',
                    border: '2px solid #3d1a00', color: '#3d1a00',
                    boxShadow: '2px 2px 0 #1a0800', transition: 'all 0.1s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0 #1a0800' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0 #1a0800' }}
                  >完成</button>
                </div>
              </div>
            )
          })()}

          {!allDone && QUEST_STAGES.slice(currentStageIdx + 1).map((s, i, arr) => (
            <div key={s.id} style={{
              padding: '8px 12px', marginBottom: i < arr.length - 1 ? 6 : 0,
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(0,0,0,0.35)', border: '2px solid #2a1000',
            }}>
              <span style={{ fontSize: 16, opacity: 0.45 }}>🔒</span>
              <div>
                <div style={{ color: '#6b3d0f', fontSize: 12, fontWeight: 700, opacity: 0.55 }}>{s.title}</div>
                <div style={{ color: '#4a2800', fontSize: 10, opacity: 0.5 }}>完成上一阶段后解锁</div>
              </div>
            </div>
          ))}

          {allDone && (
            <div style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,215,0,0.08)', border: '2px solid #d4a800' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>🏆</div>
              <div style={{ color: '#ffd040', fontWeight: 900, fontSize: 14 }}>支线任务全部完成！</div>
              <div style={{ color: '#c49450', fontSize: 12, marginTop: 4 }}>称号已解锁：AI产品经理候补生</div>
            </div>
          )}
        </PanelWithTitle>

        {/* 今日事件 */}
        <PanelWithTitle icon="🎲" title="今日事件">
          {activeEventIds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: '#7a4a10', fontSize: 13 }}>
              今日事件已处理完毕 · 明天再来看看 ✨
            </div>
          ) : (
            activeEventIds.map(eventId => {
              const ev = RANDOM_EVENT_POOL.find(e => e.id === eventId)
              return ev ? (
                <div key={eventId} style={{ ...W.card, padding: '12px 14px', marginBottom: 8 }}>
                  <div style={{ color: '#3d1a00', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{ev.text}</div>
                  <div style={{ color: '#7a4a10', fontSize: 11, marginBottom: 10 }}>
                    {ev.canReject ? `接受效果：${ev.desc}` : `结果：${ev.desc}`}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleEventAction(eventId, true)} style={{
                      flex: 1, padding: '8px 0', fontWeight: 700, fontSize: 12,
                      background: 'linear-gradient(180deg,#5a9040 0%,#3a6020 100%)',
                      border: '2px solid #2a4010', color: '#c8f0a0',
                      boxShadow: '2px 2px 0 #1a2808', transition: 'all 0.1s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0 #1a2808' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0 #1a2808' }}
                    >{ev.canReject ? '接受' : '确认'}</button>
                    {ev.canReject && (
                      <button onClick={() => handleEventAction(eventId, false)} style={{
                        flex: 1, padding: '8px 0', fontWeight: 700, fontSize: 12,
                        background: 'linear-gradient(180deg,#6a3010 0%,#4a1a00 100%)',
                        border: '2px solid #3d1a00', color: '#d4a96a',
                        boxShadow: '2px 2px 0 #1a0800', transition: 'all 0.1s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0 #1a0800' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0 #1a0800' }}
                      >拒绝</button>
                    )}
                  </div>
                </div>
              ) : null
            })
          )}
        </PanelWithTitle>

      </div>
      {modal && <RewardModal stage={modal.stage} onClose={modal.onClose} />}
    </div>
  )
}

// ════════════════════════════════════════════════════════
//  角色页面
// ════════════════════════════════════════════════════════

const CHAR_TABS = [
  { label: '角色', icon: '👤' },
  { label: '外观', icon: '👕' },
]

function CharPage({ data }) {
  const [activeTab, setActiveTab] = useState(0)
  const [questState]              = useState(loadQuestState)

  const level      = calcLevel(data.player.exp)
  const thresholds = [0, 100, 300, 600, 1000, 1500]
  const lvIdx      = Math.min(level - 1, thresholds.length - 1)
  const prevExp    = thresholds[lvIdx] || 0
  const nextExp    = thresholds[lvIdx + 1] || prevExp + 500
  const expInLv    = data.player.exp - prevExp
  const expNeeded  = nextExp - prevExp

  const unlockedTitles = questState.completedStages
    .map(idx => QUEST_STAGES[idx]?.titleUnlock)
    .filter(Boolean)
  const currentTitle = unlockedTitles.length > 0
    ? unlockedTitles[unlockedTitles.length - 1]
    : 'AI产品经理候补生'

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'linear-gradient(180deg,#1a2a0a 0%,#0d1505 100%)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 标签页切换 */}
        <div style={{ ...W.panel, padding: 0, overflow: 'hidden', display: 'flex' }}>
          {CHAR_TABS.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              flex: 1, padding: '11px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: activeTab === i ? 'linear-gradient(180deg,#d4aa6a,#c49450)' : 'linear-gradient(180deg,#7a4a10,#5a3008)',
              border: 'none', borderRight: i < CHAR_TABS.length - 1 ? '2px solid #3d1a00' : 'none',
              transition: 'filter 0.15s',
            }}
              onMouseEnter={e => { if (activeTab !== i) e.currentTarget.style.filter = 'brightness(1.2)' }}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span style={{ color: activeTab === i ? '#3d1a00' : '#d4a96a', fontWeight: 700, fontSize: 13 }}>{t.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 0 && <>
          {/* 角色信息区 */}
          <PanelWithTitle icon="👤" title="角色信息">
            <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
              <div style={{
                width: 96, height: 120, flexShrink: 0,
                background: 'linear-gradient(180deg,#4a8a2a 0%,#2a5a10 100%)',
                border: '3px solid #3d1a00', boxShadow: 'inset 0 0 0 1px #6aaa3a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 50,
              }}>🧑‍💼</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ ...W.card, padding: '6px 10px' }}>
                  <div style={{ color: '#7a4a10', fontSize: 10 }}>名字</div>
                  <div style={{ color: '#3d1a00', fontWeight: 700, fontSize: 14 }}>夏浩铭</div>
                </div>
                <div style={{ ...W.card, padding: '6px 10px' }}>
                  <div style={{ color: '#7a4a10', fontSize: 10 }}>当前章节</div>
                  <div style={{ color: '#3d1a00', fontWeight: 700, fontSize: 12 }}>第三章《AI转型》</div>
                </div>
                <div style={{ ...W.card, padding: '6px 10px' }}>
                  <div style={{ color: '#7a4a10', fontSize: 10 }}>当前称号</div>
                  <div style={{ color: unlockedTitles.length > 0 ? '#d4a800' : '#9a6a30', fontWeight: 700, fontSize: 12 }}>
                    {currentTitle}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ ...W.dark, padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ color: '#c49450', fontWeight: 700, fontSize: 14 }}>Lv.{level}</span>
                <span style={{ color: '#9a6a30', fontSize: 11, fontFamily: 'monospace' }}>{data.player.exp} / {nextExp} EXP</span>
              </div>
              <PixelBar value={expInLv} max={expNeeded} color="#ffc020" bg="#2a1000" height={10} />
              <div style={{ color: '#6b4a20', fontSize: 10, marginTop: 4 }}>距下一等级还需 {Math.max(0, expNeeded - expInLv)} EXP</div>
            </div>
          </PanelWithTitle>

          {/* 属性与技能 */}
          <PanelWithTitle icon="⚔️" title="属性与技能">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SKILL_META.map(({ key, icon }) => {
                const pts = data.skills[key] || 0
                const pct = Math.min(Math.round(pts / 50 * 100), 100)
                const c   = SC[key]
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{icon}</span>
                      <span style={{ color: '#7a4a10', fontWeight: 700, fontSize: 13, flex: 1 }}>{SKILL_LABELS[key]}</span>
                      <span style={{ color: '#4a2000', fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>{pts}</span>
                      <span style={{ color: '#6b4a20', fontSize: 11, minWidth: 28 }}>/ 50</span>
                    </div>
                    <PixelBar value={pct} color={c.bar} bg={c.bg} height={10} />
                  </div>
                )
              })}
            </div>
          </PanelWithTitle>

          {/* 已解锁称号 */}
          <PanelWithTitle icon="🏆" title="已解锁称号">
            {unlockedTitles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '14px 0', color: '#7a4a10', fontSize: 12 }}>
                暂无称号 · 完成支线任务解锁
              </div>
            ) : (
              unlockedTitles.map((title, i) => (
                <div key={i} style={{
                  ...W.dark, padding: '10px 14px', marginBottom: i < unlockedTitles.length - 1 ? 8 : 0,
                  display: 'flex', alignItems: 'center', gap: 10,
                  border: '1px solid #d4a800', boxShadow: '0 0 8px rgba(212,168,0,0.2)',
                }}>
                  <span style={{ fontSize: 22 }}>🏆</span>
                  <div>
                    <div style={{ color: '#ffd040', fontWeight: 700, fontSize: 13 }}>{title}</div>
                    <div style={{ color: '#9a6a30', fontSize: 11, marginTop: 2 }}>支线任务奖励</div>
                  </div>
                </div>
              ))
            )}
          </PanelWithTitle>
        </>}

        {activeTab === 1 && (
          <PanelWithTitle icon="👕" title="外观 · 开发中">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '16px 0' }}>
              <div style={{
                width: 120, height: 150,
                background: 'linear-gradient(180deg,#4a8a2a 0%,#2a5a10 100%)',
                border: '3px solid #3d1a00', boxShadow: 'inset 0 0 0 1px #6aaa3a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 60,
              }}>🧑‍💼</div>
              <div style={{
                padding: '6px 20px', fontSize: 11, color: '#9a6a30',
                background: 'rgba(0,0,0,0.25)', border: '1px dashed #6b3d10',
              }}>
                换装系统 · 即将开放
              </div>
            </div>
          </PanelWithTitle>
        )}

      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════
//  成就页面
// ════════════════════════════════════════════════════════

const ACHIEVEMENTS = [
  { id: 'study7',   title: '连续学习7天',     desc: '坚持学习，连续打卡7天',        questTrigger: null,  alwaysUnlocked: false },
  { id: 'firstvid', title: '发布第一条视频',   desc: '人生的第一条作品诞生',          questTrigger: null,  alwaysUnlocked: false },
  { id: 'offer',    title: '获得Offer',        desc: '收到AI产品经理的Offer',         questTrigger: null,  alwaysUnlocked: false },
  { id: 'lifegame', title: '独立开发人生游戏', desc: '从想法到实现，完成第一版',      questTrigger: null,  alwaysUnlocked: true },
  { id: 'aipm1',    title: 'AI产品经理 Lv.1',  desc: '正式踏上AI产品经理的成长之路', questTrigger: 'all', alwaysUnlocked: false },
  { id: 'fans1k',   title: '粉丝突破1000',     desc: '粉丝数达到1000人',             questTrigger: null,  alwaysUnlocked: false },
]

const MILESTONES = [
  { date: '2023.03', icon: '🏠', title: '第一次装修获客',   desc: '成功签下第一个装修客户，赚到第一桶金！', unlocked: true  },
  { date: '2024.01', icon: '🤖', title: '开始学习AI',       desc: '第一次接触ChatGPT，打开新世界的大门！',  unlocked: true  },
  { date: '2026.06', icon: '💻', title: '独立开发人生游戏', desc: '使用Claude Code开发人生游戏V1版本！',     unlocked: true  },
  { date: '???',     icon: '🔒', title: '???',              desc: '尚未解锁',                              unlocked: false },
]

function AchievePage({ data }) {
  const [questState] = useState(loadQuestState)
  const today   = new Date().toISOString().slice(0, 10).replace(/-/g, '.')
  const allDone = questState.completedStages.length >= QUEST_STAGES.length

  function getUnlock(ach) {
    if (ach.alwaysUnlocked)                    return { unlocked: true,  date: today }
    if (ach.questTrigger === 'all' && allDone) return { unlocked: true,  date: today }
    return { unlocked: false, date: null }
  }

  const col      = { display: 'flex', flexDirection: 'column', minHeight: 0 }
  const fillBody = { flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }

  return (
    <div style={{
      height: '100%', overflow: 'hidden', padding: 10,
      background: 'linear-gradient(180deg,#1a2a0a 0%,#0d1505 100%)',
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
    }}>

      {/* ── 左栏 ── */}
      <div style={{ ...col, gap: 10 }}>

        {/* 人生里程碑 */}
        <PanelWithTitle icon="🗺️" title="人生里程碑"
          style={{ flex: 3, minHeight: 0, ...col }}
          contentStyle={fillBody}
        >
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {MILESTONES.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: i < MILESTONES.length - 1 ? 12 : 0 }}>
                {/* 竖轴：日期badge + 连接线 */}
                <div style={{ ...col, alignItems: 'center', flexShrink: 0, width: 46 }}>
                  <div style={{
                    background: m.unlocked ? 'linear-gradient(180deg,#5ab84e,#3a8a2e)' : '#2e2018',
                    border: '2px solid #1a0800', padding: '2px 4px',
                    fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
                    color: m.unlocked ? '#c8ffaa' : '#6a5a48',
                    whiteSpace: 'nowrap', textAlign: 'center',
                  }}>
                    {m.date}
                  </div>
                  {i < MILESTONES.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 18, background: '#5a3a10', marginTop: 2 }} />
                  )}
                </div>
                {/* 图标框 */}
                <div style={{
                  width: 36, height: 36, flexShrink: 0, marginTop: 2,
                  background: m.unlocked ? 'linear-gradient(180deg,#4a8a2a,#2a5a10)' : '#1e1408',
                  border: `2px solid ${m.unlocked ? '#3d1a00' : '#2a1a08'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>
                  {m.icon}
                </div>
                {/* 文字 */}
                <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                  <div style={{ color: m.unlocked ? '#3d1a00' : '#7a5a38', fontWeight: 700, fontSize: 13 }}>{m.title}</div>
                  <div style={{ color: m.unlocked ? '#7a4a10' : '#5a4028', fontSize: 11, marginTop: 2 }}>{m.desc}</div>
                </div>
                {/* 星星 */}
                <span style={{
                  fontSize: 20, flexShrink: 0, marginTop: 6,
                  color: m.unlocked ? '#d4a800' : '#7a7060',
                  textShadow: m.unlocked ? '0 0 8px rgba(212,168,0,0.6)' : 'none',
                }}>
                  {m.unlocked ? '★' : '☆'}
                </span>
              </div>
            ))}
          </div>
        </PanelWithTitle>

        {/* 技能成长历史 */}
        <PanelWithTitle icon="📊" title="技能成长历史"
          style={{ flex: 2, minHeight: 0, ...col }}
          contentStyle={fillBody}
        >
          <div style={{ ...col, gap: 8, overflowY: 'auto', flex: 1 }}>
            {SKILL_META.map(({ key, icon }) => {
              const pts = data.skills[key] || 0
              const lv  = Math.floor(pts / 5)
              const pct = Math.min(Math.round(pts / 50 * 100), 100)
              const c   = SC[key]
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, flexShrink: 0, width: 18, textAlign: 'center' }}>{icon}</span>
                  <span style={{ color: '#7a4a10', fontWeight: 700, fontSize: 11, flexShrink: 0, width: 54 }}>{SKILL_LABELS[key]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <PixelBar value={pct} color={c.bar} bg={c.bg} height={8} />
                  </div>
                  <span style={{ color: '#4a2000', fontFamily: 'monospace', fontWeight: 700, fontSize: 11, flexShrink: 0, minWidth: 30, textAlign: 'right' }}>Lv.{lv}</span>
                </div>
              )
            })}
          </div>
        </PanelWithTitle>
      </div>

      {/* ── 右栏 ── */}
      <div style={{ ...col, gap: 10 }}>

        {/* 成就墙 */}
        <PanelWithTitle icon="🏆" title="成就墙"
          style={{ flex: 3, minHeight: 0, ...col }}
          contentStyle={fillBody}
        >
          <div style={{ ...W.card, padding: 0, overflow: 'hidden', flex: 1, overflowY: 'auto' }}>
            {ACHIEVEMENTS.map((ach, i) => {
              const { unlocked, date } = getUnlock(ach)
              const isLast = i === ACHIEVEMENTS.length - 1
              return (
                <div key={ach.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  borderBottom: isLast ? 'none' : '1px solid rgba(139,82,19,0.3)',
                  background: unlocked ? 'transparent' : 'rgba(0,0,0,0.08)',
                }}>
                  <span style={{
                    fontSize: 26, flexShrink: 0, width: 30, textAlign: 'center',
                    color: unlocked ? '#d4a800' : '#7a7060',
                    textShadow: unlocked ? '0 0 10px rgba(212,168,0,0.6)' : 'none',
                  }}>
                    {unlocked ? '★' : '☆'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: unlocked ? '#3d1a00' : '#7a5a38', fontWeight: 700, fontSize: 13 }}>{ach.title}</div>
                    <div style={{ color: unlocked ? '#7a4a10' : '#6a4a28', fontSize: 11, marginTop: 2 }}>{ach.desc}</div>
                  </div>
                  <div style={{
                    flexShrink: 0, fontSize: 11, textAlign: 'right',
                    color: unlocked ? '#9a6a30' : '#5a4028',
                    fontFamily: unlocked ? 'monospace' : 'inherit',
                    minWidth: 50,
                  }}>
                    {unlocked ? date : '未解锁'}
                  </div>
                </div>
              )
            })}
          </div>
        </PanelWithTitle>

        {/* 本周总结 */}
        <PanelWithTitle icon="📅" title="本周总结"
          style={{ flex: 2, minHeight: 0, ...col }}
          contentStyle={fillBody}
        >
          <div style={{ ...col, flex: 1, gap: 8 }}>
            {/* 3个统计卡片 */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ ...W.card, flex: 1, padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ color: '#7a4a10', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>完成任务</div>
                <div style={{ color: '#3d1a00', fontWeight: 900, fontSize: 24, fontFamily: 'monospace', lineHeight: 1 }}>
                  {questState.completedStages.length}
                </div>
                <div style={{ fontSize: 14, marginTop: 4 }}>🌱</div>
              </div>
              <div style={{ ...W.card, flex: 1, padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ color: '#7a4a10', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>获得经验</div>
                <div style={{ color: '#3d1a00', fontWeight: 900, fontSize: 24, fontFamily: 'monospace', lineHeight: 1 }}>
                  +{data.player.exp}
                </div>
                <div style={{ fontSize: 14, marginTop: 4 }}>⭐</div>
              </div>
              <div style={{ ...W.card, flex: 1, padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ color: '#7a4a10', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>成长值</div>
                <div style={{ color: '#3d1a00', fontWeight: 900, fontSize: 24, fontFamily: 'monospace', lineHeight: 1 }}>
                  +{calcTotalProgress(data.skills)}
                </div>
                <div style={{ fontSize: 14, marginTop: 4 }}>❤️</div>
              </div>
            </div>
            {/* 鼓励语 */}
            <div style={{ ...W.card, flex: 1, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>🧑‍💼</span>
              <div style={{ color: '#5a3010', fontSize: 12, lineHeight: 1.7, fontStyle: 'italic' }}>
                每一次努力，都是在为未来的自己铺路。<br />
                坚持下去，你正在成为你想成为的人！
              </div>
            </div>
          </div>
        </PanelWithTitle>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════
//  主 App
// ════════════════════════════════════════════════════════

export default function App() {
  const [data, setData] = useState(loadData)
  const [tab,  setTab]  = useState('home')

  function handleUpdate(d) { setData(d); saveData(d) }

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: '#0d0500',
      fontFamily: "'Noto Sans SC', 'Microsoft YaHei', sans-serif",
    }}>
      <div style={{ height: 72, flexShrink: 0 }}>
        <TopBar data={data} />
      </div>

      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {tab === 'home'    && <HomePage      data={data}                       />}
        {tab === 'settle'  && <DailySettlement data={data} onUpdate={handleUpdate} />}
        {tab === 'tasks'   && <TasksPage data={data} onUpdate={handleUpdate}    />}
        {tab === 'char'    && <CharPage data={data}                              />}
        {tab === 'achieve' && <AchievePage data={data}                              />}
      </div>

      <div style={{ height: 72, flexShrink: 0 }}>
        <BottomNav tab={tab} onChange={setTab} />
      </div>
    </div>
  )
}
