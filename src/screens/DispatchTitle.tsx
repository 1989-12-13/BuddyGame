import { Activity, ArrowRight, BookOpen, Headphones, Map, Moon, RotateCcw, Sun } from 'lucide-react'
import { loadCheckpoint } from '../game/core/checkpoint'
import { useTheme } from '../contexts/ThemeContext'
import './game/workbench.css'
import './dispatch-title.css'

interface Props { onStart: (mode?: string) => void; onLevelSelect?: () => void; onKnowledge?: () => void }
export function TitleScreen({ onStart, onLevelSelect, onKnowledge }: Props) {
  const saved = loadCheckpoint()
  const { theme, toggle } = useTheme()
  return <main className="dispatch-title">
    <header className="title-header"><div className="desk-brand"><span className="brand-symbol"><Activity size={26} /></span><strong>120<span>调度台</span></strong></div><div className="title-header-actions"><span className="title-edition"><span className="live-dot" /> 公益急救 · 叙事模拟</span><button className="title-theme" onClick={toggle} aria-label={`切换到${theme === 'dark' ? '明亮' : '夜间'}主题`}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button></div></header>
    <div className="title-layout"><section className="title-copy"><span className="eyebrow">ON THE OTHER END OF THE LINE</span><h1>电话这头，<br />是<span>希望</span>的起点。</h1><p className="title-intro">一座城市，三条线路。<br />戴上耳机，听清那些慌乱的声音。<br />你的每一次确认，都让帮助更近一点。</p>
      <div className="title-actions"><button className="primary" onClick={() => onStart('__shift__')}><Headphones size={20} /> 开始值班<ArrowRight size={20} /></button>{saved && <button className="secondary" onClick={() => onStart('__resume__')}><RotateCcw size={18} /> 继续第 {saved.callIndex + 1} 通</button>}</div>
      <div className="title-secondary"><button onClick={onLevelSelect}><Map size={17} /> 场景练习</button><button onClick={onKnowledge}><BookOpen size={17} /> 急救知识</button></div>
    </section><section className="title-art" aria-label="夜色中的城市与亮着灯的调度工作台">
      <svg className="city-illustration" viewBox="0 0 680 660" role="img" aria-label="原创城市夜景插画">
        <defs><linearGradient id="night" x2="0" y2="1"><stop stopColor="#223f47"/><stop offset="1" stopColor="#13252d"/></linearGradient><linearGradient id="deskLight" x2="1" y2="1"><stop stopColor="#b2d5bd"/><stop offset="1" stopColor="#638d84"/></linearGradient><pattern id="windows" width="22" height="28" patternUnits="userSpaceOnUse"><rect width="7" height="10" x="7" y="8" rx="1" fill="#dcbd7f" opacity=".5"/></pattern></defs>
        <rect x="30" y="20" width="610" height="570" rx="180" fill="url(#night)"/>
        <circle cx="499" cy="121" r="36" fill="#ead5a7"/><circle cx="484" cy="110" r="34" fill="#223c44"/>
        <path d="M65 206H265M391 199H579M135 134H248" stroke="#41616a" strokeWidth="2" opacity=".5"/>
        <g fill="#1c343d"><rect x="67" y="300" width="91" height="198"/><rect x="177" y="237" width="83" height="261"/><rect x="281" y="274" width="63" height="224"/><rect x="373" y="215" width="93" height="283"/><rect x="491" y="294" width="110" height="204"/></g>
        <g fill="url(#windows)"><rect x="74" y="305" width="78" height="183"/><rect x="183" y="245" width="69" height="230"/><rect x="380" y="227" width="80" height="250"/><rect x="500" y="305" width="90" height="174"/></g>
        <path d="M34 488L635 460V590H34Z" fill="#304b4e"/><path d="M73 484L335 462L585 479" fill="none" stroke="#7a9a8b" strokeWidth="3"/>
        <rect x="158" y="331" width="342" height="222" rx="17" fill="#0f222a" stroke="#658a82" strokeWidth="4"/>
        <rect x="174" y="347" width="310" height="175" rx="7" fill="#29454a"/>
        <path d="M188 455L229 453L243 425L261 482L276 395L297 462L315 437L329 449H392" fill="none" stroke="#a1dbc1" strokeWidth="4" strokeLinejoin="round"/>
        <rect x="192" y="363" width="90" height="8" rx="4" fill="#7eaaa1"/><rect x="192" y="381" width="53" height="5" rx="2" fill="#577c77"/>
        <circle cx="436" cy="435" r="29" fill="#88b8a5"/><path d="M425 435H447M436 424V446" stroke="#183d33" strokeWidth="4" strokeLinecap="round"/>
        <path d="M314 554V580M271 582H377" stroke="#517570" strokeWidth="14" strokeLinecap="round"/>
        <path d="M94 589H594L641 623H47Z" fill="url(#deskLight)"/><path d="M47 623H641V639H47Z" fill="#3e635a"/>
        <path d="M192 608L215 588H378L395 608Z" fill="#294a43"/><path d="M230 596H359M244 603H342" stroke="#78988a" strokeWidth="2"/>
        <path d="M525 563V598H559V563" fill="#d1bd95"/><path d="M558 570C582 566 580 591 558 588" fill="none" stroke="#d1bd95" strokeWidth="6"/>
        <path d="M533 546C520 532 548 526 536 511" fill="none" stroke="#76988d" strokeWidth="2"/>
      </svg>
      <div className="art-call-card"><span className="call-card-icon"><Headphones size={22} /></span><div><strong>“喂，120 吗？”</strong><span>请慢慢说，我在听。</span></div><span className="voice-bars"><i/><i/><i/><i/><i/></span></div>
    </section></div>
    <footer className="title-footer"><span>倾听 · 确认 · 行动</span><p>公益科普体验，不能替代专业急救培训。现实紧急情况请拨打 120。</p></footer>
  </main>
}
