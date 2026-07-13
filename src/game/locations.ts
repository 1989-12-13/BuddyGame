// ============================================================
// 地点坐标 — baseStation 字符串 → 真实经纬度（北京城区近似点）
// 用于 leaflet 地图渲染
// ============================================================

export interface LatLng {
  lat: number
  lng: number
}

/** baseStation 关键字 → 真实坐标的映射 */
const COORDS: Record<string, LatLng> = {
  '望京':          { lat: 39.9967, lng: 116.4708 },
  '望京soho':      { lat: 39.9967, lng: 116.4708 },
  '中关村':        { lat: 39.9836, lng: 116.3162 },
  '方庄':          { lat: 39.8636, lng: 116.4328 },
  '潘家园':        { lat: 39.8772, lng: 116.4608 },
  '国贸CBD':       { lat: 39.9087, lng: 116.4574 },
  '奥体中心':      { lat: 39.9929, lng: 116.3962 },
  '奥林匹克森林公园': { lat: 40.0059, lng: 116.3962 },
  '双井':          { lat: 39.8892, lng: 116.4608 },
  '南锣鼓巷':      { lat: 39.9384, lng: 116.4037 },
  '鼓楼大街':      { lat: 39.9494, lng: 116.3936 },
  '东直门':        { lat: 39.9447, lng: 116.4347 },
  '东四':          { lat: 39.9284, lng: 116.4189 },
  '月坛':          { lat: 39.9151, lng: 116.3528 },
  '新街口':        { lat: 39.9447, lng: 116.3725 },
  '西单':          { lat: 39.9151, lng: 116.3725 },
  '德胜门':        { lat: 39.9494, lng: 116.3806 },
  '金融街':        { lat: 39.9151, lng: 116.3594 },
  '苏州街':        { lat: 39.9836, lng: 116.3162 },
  '五道口':        { lat: 39.9918, lng: 116.3364 },
  '上地':          { lat: 39.9994, lng: 116.3031 },
  '马家堡':        { lat: 39.8531, lng: 116.3878 },
  '公益西桥':      { lat: 39.8231, lng: 116.3878 },
  '科技园':        { lat: 39.8231, lng: 116.2775 },
  '黄村':          { lat: 39.7287, lng: 116.3403 },
  '亦庄':          { lat: 39.7915, lng: 116.5067 },
  '回龙观':        { lat: 40.0739, lng: 116.3378 },
  '沙河':          { lat: 40.1334, lng: 116.2943 },
  '梨园':          { lat: 39.9028, lng: 116.6794 },
}

/** 站点（救护车库）固定坐标 */
export const STATION_COORDS: Record<string, { name: string; pos: LatLng }> = {
  ambulance_a: { name: '望京站', pos: { lat: 39.9967, lng: 116.4708 } },
  ambulance_b: { name: '中关村站', pos: { lat: 39.9836, lng: 116.3162 } },
  ambulance_c: { name: '方庄站', pos: { lat: 39.8636, lng: 116.4328 } },
}

/** 默认地图中心（北京中心） */
export const DEFAULT_CENTER: LatLng = { lat: 39.92, lng: 116.40 }

/** 默认缩放等级 */
export const DEFAULT_ZOOM = 11

/**
 * 根据 baseStation 字符串查找坐标（最长匹配优先）
 * @returns 找到的坐标，未找到返回 null
 */
export function lookupCoords(baseStation: string): LatLng | null {
  // 按 key 长度倒序，优先匹配更具体的（如"望京soho"在前）
  const keys = Object.keys(COORDS).sort((a, b) => b.length - a.length)
  for (const k of keys) {
    if (baseStation.includes(k)) return COORDS[k]
  }
  return null
}