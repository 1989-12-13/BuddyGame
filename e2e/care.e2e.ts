import { test, expect, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/*.basemaps.cartocdn.com/**', route => route.abort())
  await page.route('**/api/tts', route => route.fulfill({ status: 503, body: 'unavailable' }))
})

async function dispatchScenario(page: Page, name: string) {
  await page.goto('/')
  await page.getByRole('button', { name: '场景练习', exact: true }).click()
  await page.getByRole('button', { name: `练习${name}`, exact: true }).click()
  await page.getByRole('button', { name: '接听来电', exact: true }).click()
  await page.clock.install()
  await page.getByRole('button', { name: '确认位置', exact: true }).click()
  await page.clock.runFor(2200)
  await page.getByRole('group', { name: '患者有意识吗？' }).getByRole('button', { name: name === '心脏骤停' ? '没有' : '有', exact: true }).click()
  await page.getByRole('group', { name: '患者有正常呼吸吗？' }).getByRole('button', { name: name === '心脏骤停' ? '没有' : '有', exact: true }).click()
  await page.getByLabel('响应优先级').selectOption(name === '心脏骤停' ? 'ECHO' : 'DELTA')
  await page.getByRole('button', { name: '规划救援路线', exact: true }).click()
  for (const node of ['北城路口', '高架入口', '中心交汇点', '医院联络道', '河畔路口', '事件现场']) await page.getByRole('button', { name: `选择节点 ${node}`, exact: true }).click()
  await page.getByRole('button', { name: '确认路线并派车', exact: true }).click()
}
async function acknowledge(page: Page) { await page.getByRole('button', { name: '我已核对，继续指导', exact: true }).click() }

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
  await dispatchScenario(page, '玻璃割伤大出血')
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
