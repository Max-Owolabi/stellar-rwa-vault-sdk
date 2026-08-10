# Drips Wave 8 Maintainer Application — Planned Issues & Supporting Links

Repository: **`Maxima-Steller/stellar-rwa-vault-sdk`**  
Wave Program: **Stellar Wave Program (Wave 8)**  
Organization: **Maxima-Steller**

---

## 📝 Planned Issues & Types of Work

In `stellar-rwa-vault-sdk`, we have structured a broad, shallow backlog of granular issues tailored for open-source contributors during Drips Wave sprint cycles. The planned work spans four core categories across Drips Wave complexity tiers (**Trivial 100 Pts**, **Medium 150 Pts**, and **High 200 Pts**):

### 1. New Features & RWA Integrations (High & Medium Tier)
- **Tokenized RWA Asset Adapters (150-200 Pts)**: Building plug-and-play asset adapters for real-world asset issuers (e.g. Centrifuge RWA pools, Maple Finance credit pools, and SEP-24 interactive anchor protocol for fiat on/off ramps).
- **Multi-Asset Rebalancing Engine (200 Pts)**: Expanding multi-token collateral allocation baskets, portfolio rebalancing math, and weighted NAV calculation.
- **On-Chain Soroban Smart Contracts (200 Pts)**: Writing native Rust Soroban contract logic and event indexers for real-time off-chain SDK sync.
- **Emergency Circuit Breakers & Loss Reserves (200 Pts)**: Multi-sig emergency withdrawal pause hooks and first-loss insurance reserve fund accounting.

### 2. Regulatory Compliance & Security Hooks (High & Medium Tier)
- **Soroban Identity & Geo-Fencing Hooks (150-200 Pts)**: Geo-IP jurisdiction enforcement, automated accreditation expiry warning reminders, and on-chain identity registry verification.
- **Prometheus Telemetry & Webhooks (150 Pts)**: Exporting live TVL metrics endpoints and HTTP webhook event emitters for vault deposit/withdraw events.

### 3. Developer Tooling & CLI Utilities (Medium & Trivial Tier)
- **Interactive CLI & Testnet Faucet (150 Pts)**: Expanding `npx stellar-rwa-vault` with interactive account balance queries and automated testnet faucet funding scripts.
- **Param & Address Input Validation (100 Pts)**: Sanitize Stellar Memo string byte lengths (max 28 bytes) and ED25519 public key format checks.

### 4. Documentation & Test Suite Expansion (Trivial Tier)
- **API Spec & Frontend Integration Guides (100 Pts)**: OpenAPI/Swagger specs for SDK REST proxies and React/Next.js frontend integration hooks.
- **Yield Math Edge Case Coverage (100 Pts)**: Zero-liquidity share price safe division wrappers and precision guard unit tests.

---

## 🔗 Supporting Links

- **GitHub Repository**: [https://github.com/Maxima-Steller/stellar-rwa-vault-sdk](https://github.com/Maxima-Steller/stellar-rwa-vault-sdk)
- **Open Planned Issues List (20+ Active Issues)**: [https://github.com/Maxima-Steller/stellar-rwa-vault-sdk/issues](https://github.com/Maxima-Steller/stellar-rwa-vault-sdk/issues)
- **Product Requirements Document (PRD)**: [https://github.com/Maxima-Steller/stellar-rwa-vault-sdk/blob/master/PRD.md](https://github.com/Maxima-Steller/stellar-rwa-vault-sdk/blob/master/PRD.md)
- **Technical System Architecture**: [https://github.com/Maxima-Steller/stellar-rwa-vault-sdk/blob/master/architecture.md](https://github.com/Maxima-Steller/stellar-rwa-vault-sdk/blob/master/architecture.md)
- **Drips Wave Backlog & Points Allocation**: [https://github.com/Maxima-Steller/stellar-rwa-vault-sdk/blob/master/drips-wave-issues.md](https://github.com/Maxima-Steller/stellar-rwa-vault-sdk/blob/master/drips-wave-issues.md)

### Key Sample Planned Issues for Contributors:
1. [#9 - Implement Centrifuge RWA pool token asset adapter (200 Pts)](https://github.com/Maxima-Steller/stellar-rwa-vault-sdk/issues/9)
2. [#10 - Add Prometheus metrics exporter for vault TVL and share price (150 Pts)](https://github.com/Maxima-Steller/stellar-rwa-vault-sdk/issues/10)
3. [#12 - Implement multi-sig emergency circuit breaker withdrawal pause hook (200 Pts)](https://github.com/Maxima-Steller/stellar-rwa-vault-sdk/issues/12)
4. [#19 - Add interactive vault balance query command to CLI (150 Pts)](https://github.com/Maxima-Steller/stellar-rwa-vault-sdk/issues/19)
5. [#24 - Add React & Next.js frontend integration code snippet examples (100 Pts)](https://github.com/Maxima-Steller/stellar-rwa-vault-sdk/issues/24)
