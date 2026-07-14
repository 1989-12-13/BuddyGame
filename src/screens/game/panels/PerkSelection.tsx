import { ROGUE_PERKS, type RoguePerkId } from '../../../game/core/perks'
import { styles } from '../styles'

export function PerkSelection({
  choices,
  owned,
  onChoose,
}: {
  choices: RoguePerkId[]
  owned: RoguePerkId[]
  onChoose: (perkId: RoguePerkId) => void
}) {
  return (
    <div style={styles.perkScreen}>
      <div style={styles.perkHeader}>班次经验</div>
      <h2 style={styles.perkTitle}>选择一项后续收益</h2>
      <p style={styles.perkSubtitle}>
        已获得 {owned.length} 项收益。每次选择只影响本轮值班，用来形成轻量肉鸽节奏。
      </p>
      <div style={styles.perkGrid}>
        {choices.map(id => {
          const perk = ROGUE_PERKS[id]
          return (
            <button key={id} style={styles.perkCard} onClick={() => onChoose(id)}>
              <span style={styles.perkCategory}>{perk.category.toUpperCase()}</span>
              <span style={styles.perkName}>{perk.title}</span>
              <span style={styles.perkDesc}>{perk.description}</span>
              <span style={styles.perkEffect}>{perk.effect}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
