# Phase 32: Loyalty Program - Context

## Decisions
- **Points Ratio**: 1 point per 10 MAD spent.
- **Trigger**: Points awarded ONLY when `Paiement.statut == 'COMPLETE'`.
- **Tiers**: Bronze (default), Silver (500 pts), Gold (1500 pts).

## Agent's Discretion
- **UI Design**: Visual style of the "Loyalty Card" in the Portail Client.
- **Reward Types**: Implementation details for discount application (fixed vs percentage).

## Deferred Ideas
- **Referral Program**: Out of scope for this phase.
- **Point Expiration**: Deferred to a later maintenance phase.
