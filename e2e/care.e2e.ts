import { test, expect, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/*.basemaps.cartocdn.com/**', route => route.abort())
  await page.route('**/api/tts', route => route.fulfill({ status: 503, body: 'unavailable' }))
})

async function answerNextCall(page: Page) {
  const singleCallButton = page.getByRole('button', { name: '接听来电', exact: true })
  const ringingLine = page.getByRole('button', { name: /^响铃/ }).first()
  await singleCallButton.or(ringingLine).first().click()
}

async function confirmLocation(page: Page) {
  await page.getByRole('button', { name: /确认位置|具体在哪个小区、哪条路/ }).click()
}

async function dispatchScenario(page: Page, name: string) {
  await page.clock.install()
  await page.goto('/')
  await page.getByRole('button', { name: '场景练习', exact: true }).click()
  await page.getByRole('button', { name: `练习${name}`, exact: true }).click()
  await answerNextCall(page)
  await confirmLocation(page)
  await page.clock.runFor(2200)
  await page.getByRole('button', { name: name === '心脏骤停' ? '无意识' : '有意识', exact: true }).click()
  await page.getByRole('button', { name: name === '心脏骤停' ? '无呼吸/异常' : '正常呼吸', exact: true }).click()
  await page.getByRole('button', { name: name === '心脏骤停' ? /E-ECHO/ : /D-DELTA/ }).click()
  await page.getByRole('button', { name: '规划救援路线', exact: true }).click()
  for (const node of ['北城路口', '高架入口', '中心交汇点', '医院联络道', '河畔路口', '事件现场']) await page.getByRole('button', { name: `选择节点 ${node}`, exact: true }).click()
  await page.getByRole('button', { name: '确认路线并派车', exact: true }).click()
}
async function acknowledge(page: Page) { await page.getByRole('button', { name: '我已核对，继续指导', exact: true }).click() }

for (const theme of ['light', 'dark']) {
  test(`task card and care controls remain readable in ${theme} theme`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('buddy-game-theme', value), theme)
    await page.setViewportSize({ width: 1920, height: 1080 })
    await dispatchScenario(page, '刀割伤大出血')
    await page.getByText('协议编号对照', { exact: true }).click()
    const conscious = page.getByRole('button', { name: '有意识', exact: true })
    const unconscious = page.getByRole('button', { name: '无意识', exact: true })
    await expect(conscious).toHaveAttribute('aria-pressed', 'true')
    await unconscious.click()
    await expect(unconscious).toHaveAttribute('aria-pressed', 'true')
    await expect(conscious).toHaveAttribute('aria-pressed', 'false')
    await unconscious.focus()
    await expect(unconscious).toBeFocused()
    // Measure rendered foreground/background, including browser-resolved color-mix values.
    for (const control of [conscious, unconscious, page.getByRole('button', { name: '结束当前通话', exact: true })]) {
      const ratio = await control.evaluate(el => {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1
        const ctx = canvas.getContext('2d')!
        const luminance = (color: string) => {
          ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1)
          const rgb = [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3).map(v => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
          return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
        }
        const style = getComputedStyle(el)
        let background = style.backgroundColor
        let parent = el.parentElement
        while (background === 'rgba(0, 0, 0, 0)' && parent) { background = getComputedStyle(parent).backgroundColor; parent = parent.parentElement }
        const a = luminance(style.color), b = luminance(background)
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
      })
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    }
    await conscious.click()
    await page.getByRole('button', { name: '保留玻璃，用干净布料在异物周围加压', exact: true }).click()
    await acknowledge(page)
    await page.getByRole('button', { name: '开始本步操作', exact: true }).click()
    await page.getByRole('button', { name: '用干净布料在异物周围加压', exact: true }).click()
    await expect(page.getByRole('button', { name: '确认操作顺序', exact: true })).toBeDisabled()
    await page.locator('.minigame-title').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `artifacts/palette-${theme}-desktop.png` })
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.getByRole('button', { name: '任务卡', exact: true }).click()
    await conscious.scrollIntoViewIfNeeded()
    await page.screenshot({ path: `artifacts/palette-${theme}-drawer.png` })
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('button', { name: '结束当前通话', exact: true })).toBeInViewport()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    await page.screenshot({ path: `artifacts/palette-${theme}-mobile.png` })
  })
}

test('chapter 3 keeps feedback until acknowledgment and stops an unfinished speech clip', async ({ page }) => {
  await page.addInitScript(() => {
    const clips: { paused: boolean }[] = []
    Object.assign(window, { careTestClips: clips, Audio: class extends EventTarget {
      paused = true; volume = 1; muted = false
      constructor() { super(); clips.push(this) }
      play() { this.paused = false; return Promise.resolve() }
      pause() { this.paused = true }
    } })
  })
  await page.route('**/api/tts', route => route.fulfill({ status: 200, contentType: 'audio/wav', body: 'simulated long speech' }))
  await page.setViewportSize({ width: 1366, height: 768 })
  await dispatchScenario(page, '刀割伤大出血')
  const answer = page.getByRole('button', { name: '保留玻璃，用干净布料在异物周围加压', exact: true })
  await answer.dblclick()
  await expect(page.getByRole('region', { name: '本步指导反馈' })).toBeVisible()
  await expect(page.getByRole('button', { name: '开始本步操作' })).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => (window as unknown as { careTestClips: { paused: boolean }[] }).careTestClips.filter(clip => !clip.paused).length)).toBe(1)
  await page.screenshot({ path: 'artifacts/chapter3-feedback.png' })
  await acknowledge(page)
  await expect.poll(() => page.evaluate(() => (window as unknown as { careTestClips: { paused: boolean }[] }).careTestClips.filter(clip => !clip.paused).length)).toBe(0)
  await page.getByRole('button', { name: '开始本步操作' }).click()
  const choices = ['先确认周围安全并做好防护', '保留嵌入伤口的玻璃', '用干净布料在异物周围加压', '保持观察并向调度员报告变化']
  for (const name of choices) await page.getByRole('button', { name, exact: true }).click()
  await expect(page.getByRole('region', { name: '本步指导反馈' })).toHaveCount(0)
  await page.getByRole('button', { name: '确认操作顺序' }).click()
  await expect(page.getByRole('region', { name: '本步指导反馈' })).toBeVisible()
})

test('cardiac care reaches rhythm and breaths; pause freezes vitals and active time', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await dispatchScenario(page, '心脏骤停')
  await page.getByRole('button', { name: '在安全条件下让患者仰卧于坚实平面', exact: true }).click(); await acknowledge(page)
  await page.getByRole('button', { name: '掌根放在胸部中央、胸骨下半部', exact: true }).click(); await acknowledge(page)
  await page.getByRole('button', { name: '开始本步操作' }).click()
  await page.getByRole('button', { name: '胸外按压节奏操作区' }).focus()
  await page.keyboard.press('Space')
  const meter = page.getByRole('meter', { name: '模拟照护余量' })
  await page.getByRole('button', { name: '暂停值班' }).click()
  const before = await meter.getAttribute('aria-valuenow')
  await page.clock.runFor(10000)
  await expect(meter).toHaveAttribute('aria-valuenow', before!)
  await page.getByRole('button', { name: '继续值班', exact: true }).click()
  await page.clock.runFor(31500)
  await acknowledge(page)
  await page.getByRole('button', { name: '开始本步操作' }).click()
  const breathing = page.getByRole('button', { name: '按住进行一次通气' })
  await breathing.focus()
  for (let i = 0; i < 2; i++) { await page.keyboard.down('Space'); await page.clock.runFor(1000); await page.keyboard.up('Space') }
  await page.getByRole('button', { name: '记录练习结果' }).click()
  await expect(page.getByRole('region', { name: '本步指导反馈' })).toBeVisible()
  await page.screenshot({ path: 'artifacts/cardiac-vitals-1280.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: '任务卡', exact: true }).click()
  await expect(meter).toBeVisible()
  await expect(page.getByRole('button', { name: '结束当前通话' })).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await page.screenshot({ path: 'artifacts/vitals-mobile.png' })
})

test('stroke traffic update allows one reroute and arrival requires a fact-based handoff', async ({ page }) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 1366, height: 768 })
  await dispatchScenario(page, '疑似脑卒中')

  const reroute = page.getByRole('region', { name: '途中路况选择' })
  await page.clock.runFor(60_000)
  await expect(reroute).toBeVisible()
  await page.getByRole('button', { name: /改走备选路线/ }).click()
  await expect(reroute).toHaveCount(0)

  const handoff = page.getByRole('region', { name: '现场交接' })
  await page.clock.runFor(600_000)
  await expect(handoff).toBeVisible()
  const prompt = await handoff.getByText(/请选择 \d+ 项/).innerText()
  const requiredCount = Number(prompt.match(/请选择 (\d+) 项/)?.[1] ?? 0)
  expect(requiredCount).toBeGreaterThanOrEqual(3)
  const facts = handoff.locator('.handoff-facts button')
  for (let index = 0; index < requiredCount; index++) await facts.nth(index).click()
  await handoff.getByRole('button', { name: '提交交接记录' }).click()
  await expect(handoff.getByText('交接信息完整，可以交给现场人员。')).toBeVisible()
  await expect(handoff.getByRole('button', { name: /完成交接/ })).toBeVisible()
})
