import { describe, expect, it } from 'vitest'
import { MIN_MAP_SPAN, STATION_COORDS, lookupCoords, withMinSpan } from './locations'

// 「事发地就在急救站门口」是真实存在的：心脏骤停卡片的 baseStation 是朝阳区望京街道，
// lookupCoords 命中的关键字是「望京」，与救护车所在的望京站坐标完全相同。
// 坐标集合跨度为 0 时 fitBounds 会一路顶到 maxZoom —— 画面上只剩一个点，
// 缩放按钮按下去也看不出任何变化。这组用例锁住「不许退化成点 / 线与回退行为」。
describe('地图坐标的最小跨度', () => {
  it('心脏骤停卡的事发地与望京站坐标完全相同（坍缩的触发条件）', () => {
    expect(lookupCoords('朝阳区望京街道附近')).toEqual(STATION_COORDS.ambulance.pos)
  })

  it('坐标集合退化成单个点时，补成一片以原点为中心的区域', () => {
    const point = { lat: 39.9967, lng: 116.4708 }
    const padded = withMinSpan([point])
    const lats = padded.map(item => item.lat)
    const lngs = padded.map(item => item.lng)

    expect(padded).toHaveLength(3)
    expect(Math.max(...lats) - Math.min(...lats)).toBeCloseTo(MIN_MAP_SPAN, 6)
    expect(Math.max(...lngs) - Math.min(...lngs)).toBeCloseTo(MIN_MAP_SPAN, 6)
    expect((Math.max(...lats) + Math.min(...lats)) / 2).toBeCloseTo(point.lat, 6)
    expect((Math.max(...lngs) + Math.min(...lngs)) / 2).toBeCloseTo(point.lng, 6)
  })

  it('只有一个方向有跨度（退化成一条线）时同样补出面积', () => {
    const line = [{ lat: 39.99, lng: 116.40 }, { lat: 39.99, lng: 116.46 }]
    const padded = withMinSpan(line)
    const lats = padded.map(item => item.lat)
    const lngs = padded.map(item => item.lng)

    expect(padded.length).toBeGreaterThan(line.length)
    // 经纬度是浮点数，补边后落在 MIN_MAP_SPAN 附近即可（39.99 ± 0.01 会有末位误差）
    expect(Math.max(...lats) - Math.min(...lats)).toBeCloseTo(MIN_MAP_SPAN, 6)
    expect(Math.max(...lngs) - Math.min(...lngs)).toBeGreaterThanOrEqual(MIN_MAP_SPAN)
  })

  it('已经铺开的坐标集合原样返回，不额外扩边', () => {
    const spread = [{ lat: 39.90, lng: 116.30 }, { lat: 40.00, lng: 116.47 }]
    expect(withMinSpan(spread)).toBe(spread)
  })

  it('空集合原样返回', () => {
    expect(withMinSpan([])).toEqual([])
  })
})
