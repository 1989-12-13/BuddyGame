export const BALANCE = {
  /** Max value for any metric (life, order, trust, medical) */
  maxMetric: 100,
  /** Min value for any metric */
  minMetric: 0,
  /** Max resources (fire, medical, transport) */
  maxResourceUnit: 10,
  /** Min value for any resource */
  minResource: 0,
  /** Default max rounds */
  maxRounds: 8,
  /** Promise penalties/bonuses */
  promiseBrokenTrustPenalty: 22,
  promiseFulfilledTrustBonus: 12,
  promiseFulfilledSuppliesBonus: 15,
} as const
