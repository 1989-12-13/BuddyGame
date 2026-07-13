// ============================================================
// 简易 LRU 缓存 (无依赖)
// 用 Map 维护插入顺序, 超出容量时淘汰最旧
// ============================================================

export class LRUCache {
  constructor(capacity = 200) {
    this.capacity = capacity
    this.map = new Map()
  }

  get(key) {
    if (!this.map.has(key)) return undefined
    const v = this.map.get(key)
    // 命中后移到末尾 (标记为最新)
    this.map.delete(key)
    this.map.set(key, v)
    return v
  }

  set(key, value) {
    if (this.map.has(key)) this.map.delete(key)
    this.map.set(key, value)
    if (this.map.size > this.capacity) {
      // Map 迭代顺序就是插入顺序, 第一个 key 就是最旧的
      const oldest = this.map.keys().next().value
      this.map.delete(oldest)
    }
  }

  get size() {
    return this.map.size
  }

  clear() {
    this.map.clear()
  }
}