// ============================================================
// 同时启动 TTS 后端 + Vite dev server (零依赖, 跨平台)
// 用法: node scripts/dev.mjs
// ============================================================

import { spawn } from 'node:child_process'

const PROCS = [
  { name: 'server', cmd: 'node', args: ['server/tts-server.mjs'], color: 36 },
  { name: 'vite',   cmd: 'vite',  args: [],                          color: 33 },
]

const COLOR = {
  reset: '\x1b[0m',
  gray:  '\x1b[90m',
}

function pipe(stream, name, color) {
  let buf = ''
  stream.setEncoding('utf8')
  stream.on('data', (chunk) => {
    buf += chunk
    let nl
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl)
      buf = buf.slice(nl + 1)
      process.stdout.write(`${COLOR.gray}[${name}]${COLOR.reset} ${line}\n`)
    }
  })
  stream.on('end', () => {
    if (buf) process.stdout.write(`${COLOR.gray}[${name}]${COLOR.reset} ${buf}\n`)
  })
}

const children = PROCS.map(({ name, cmd, args, color }) => {
  // Windows 下 spawn 找不到 .mjs 时显式带 node; npm/pnpm 的 bin 通常在 PATH 上
  const child = spawn(cmd, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    env: { ...process.env, FORCE_COLOR: '1' },
  })
  pipe(child.stdout, name, color)
  pipe(child.stderr, name, color)
  child.on('exit', (code) => {
    process.stdout.write(`${COLOR.gray}[${name}]${COLOR.reset} 退出 code=${code}\n`)
    children.forEach((c) => { if (c !== child) c.kill() })
    process.exit(code ?? 0)
  })
  return child
})

const shutdown = () => {
  children.forEach((c) => c.kill())
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)