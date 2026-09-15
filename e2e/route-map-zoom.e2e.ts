import { test, expect, type Page } from '@playwright/test'

const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

test.beforeEach(async ({ page }) => {
  await page.route('**/*.basemaps.cartocdn.com/**', route =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1x1 }))
  await page.route('**/api/tts', route => route.fulfill({ status: 503, body: 'unavailable' }))
})

interface MapState { zoom: number | null; spreadX: number; spreadY: number; distinct: number }

async function openCardiacRoutePlanner(page: Page) {
  await page.clock.install()
  await page.goto('/')
  await page.getByRole('button', { name: '场景练习', exact: true }).click()
  await page.getByRole('button', { name: '练习心脏骤停', exact: true }).click()
  await page.getByRole('button', { name: '接听来电', exact: true }).click()
  await page.clock.runFor(2200)
  await page.getByLabel('事件地址').fill('朝阳区望京西园三区12号楼2单元501室')
  await page.getByLabel('联系电话').fill('13800004321')
  await page.getByRole('button', { name: '无意识', exact: true }).click()
  await page.getByRole('button', { name: '无呼吸/异常', exact: true }).click()
  await page.getByRole('button', { name: /E-ECHO/ }).click()
  const planner = page.getByTestId('route-planner')
  // 四项齐了会「自动摆出路线选择」，所以先等一会儿再决定要不要点按钮
  await planner.waitFor({ state: 'visible', timeout: 8000 }).catch(() => undefined)
  if (!(await planner.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: '规划救援路线', exact: true }).click()
  }
  await expect(planner).toBeVisible({ timeout: 15000 })
  await page.clock.runFor(700)
}

test('route planner keeps the road network readable and the zoom buttons functional', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1366, height: 768 })
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await openCardiacRoutePlanner(page)

  const nodeButtons = page.locator('[data-testid="route-planner"] button[aria-label^="选择节点"]')

  const snapshot = async (): Promise<MapState> => ({
    zoom: await page.evaluate(() => {
      const zs = [...document.querySelectorAll('.leaflet-tile-pane img.leaflet-tile')]
        .map(img => img.getAttribute('src')?.match(/\/(\d+)\/(-?\d+)\/(-?\d+)\.png/)?.[1])
        .filter(Boolean).map(Number)
      return zs.length ? Math.max(...zs) : null
    }),
    ...(await nodeButtons.evaluateAll(els => {
      const boxes = els.map(el => {
        const r = el.getBoundingClientRect()
        return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }
      })
      const xs = boxes.map(b => b.x)
      const ys = boxes.map(b => b.y)
      return {
        spreadX: Math.max(...xs) - Math.min(...xs),
        spreadY: Math.max(...ys) - Math.min(...ys),
        distinct: new Set(boxes.map(b => `${b.x},${b.y}`)).size,
      }
    })),
  })

  const clickZoom = async (which: 'in' | 'out', times: number) => {
    for (let i = 0; i < times; i += 1) {
      await page.locator(`.leaflet-control-zoom-${which}`).click({ timeout: 5000 })
      await page.clock.runFor(450)
    }
  }

  const initial = await snapshot()
  await clickZoom('in', 3)
  const zoomedIn = await snapshot()
  await clickZoom('out', 5)
  const zoomedOut = await snapshot()

  const zoomInCover = await page.evaluate(() => {
    const btn = document.querySelector('.leaflet-control-zoom-in')
    if (!btn) return 'no-button'
    const r = btn.getBoundingClientRect()
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    if (!top) return 'null'
    return (btn === top || btn.contains(top)) ? 'OK' : `BLOCKED by <${top.tagName.toLowerCase()} class="${top.className}">`
  })

  await page.screenshot({ path: 'artifacts/route-map-zoom.png', fullPage: true })

  console.log('PROBE_RESULT ' + JSON.stringify({ initial, zoomedIn, zoomedOut, zoomInCover, errors }))

  // 路网不能坍缩成一个点：心脏骤停卡的事发地与望京站坐标完全相同
  expect(initial.distinct).toBeGreaterThanOrEqual(11)
  expect(initial.spreadX).toBeGreaterThan(40)
  expect(initial.spreadY).toBeGreaterThan(40)
  expect(errors).toEqual([])

  // 缩放按钮必须真的改变视野
  expect(zoomedIn.spreadX).toBeGreaterThan(initial.spreadX * 1.2)
  expect(zoomedIn.spreadY).toBeGreaterThan(initial.spreadY * 1.2)
  expect(zoomedOut.spreadX).toBeLessThan(zoomedIn.spreadX * 0.8)
  expect(zoomedOut.spreadY).toBeLessThan(zoomedIn.spreadY * 0.8)
})
