# Drips Wave 8 Backlog Issues & Points Budget

Repository: `stellar-rwa-vault-sdk`
Program: **Stellar Wave Program (Wave 8)**

This document tracks all open issues created for future development phases of the **Stellar RWA Vault SDK**, structured according to the **Drips Wave Maintainer Rules** for Wave 8.

---

## 🏆 Points Allocation Breakdown Summary

| Issue ID | Complexity | Drips Points | Feature Name | Description |
| :--- | :---: | :---: | :--- | :--- |
| **ISSUE-1** | `Medium` | **150 Pts** | Treasury Bill Asset Adapter | Support for tokenized T-Bill issuers (e.g. Ondo USDY / WisdomTree). |
| **ISSUE-2** | `High` | **200 Pts** | Multi-Asset Vault Accounting Engine | Multi-collateral allocations, weighted NAV, rebalancing math. |
| **ISSUE-3** | `Trivial` | **100 Pts** | Yield Precision & Rounding Fix | High-frequency compound yield precision guard & edge-case math fix. |
| **ISSUE-4** | `Medium` | **150 Pts** | Testnet Faucet & Test Harness Script | Automated testnet deployment & mock asset minting script. |
| **ISSUE-5** | `High` | **200 Pts** | Soroban Identity Registry Hook | On-chain compliance identity hook & accredited status verification. |
| **ISSUE-6** | `Trivial` | **100 Pts** | Input Validation & Address Sanitization | Zod parameter validation decorators & address format checks. |
| **ISSUE-7** | `Medium` | **150 Pts** | SDK CLI Generator (`@stellar-rwa/vault-cli`) | Project scaffolding CLI tool for new vault deployments. |

**Total Open Points Pool**: **1,050 Points**

---

## 📋 Detailed Issue Specifications

### Issue #1: Tokenized Treasury Bill Asset Adapter
- **Title**: `feat(adapters): Implement Tokenized Treasury Bill Asset Adapter (Ondo USDY / WisdomTree)`
- **Complexity**: **Medium** (150 Points)
- **Labels**: `Stellar Wave`, `medium`, `adapter`, `150-pts`
- **Description**:
  Extend the `IAssetAdapter` interface to support tokenized Treasury Bill issuers like Ondo USDY or WisdomTree T-Bills.
  The adapter must:
  1. Fetch and parse Oracle / daily NAV price updates from off-chain feeds.
  2. Adjust underlying asset valuation dynamically during share conversion (`convertToAssets` and `convertToShares`).
  3. Provide mock test fixtures for local testing without requiring active Stellar Testnet connections.
- **Acceptance Criteria**:
  - `TreasuryBillAdapter` class implementing `IAssetAdapter`.
  - Unit tests covering daily NAV fluctuation scenarios.
  - Full TypeScript typing and zero compile warnings.

---

### Issue #2: Multi-Asset Vault Accounting & Rebalancing Engine
- **Title**: `feat(accounting): Design and implement multi-asset collateral accounting module`
- **Complexity**: **High** (200 Points)
- **Labels**: `Stellar Wave`, `high`, `accounting`, `200-pts`
- **Description**:
  Upgrade the single-asset vault accounting model (`RWAStandardVault`) to support multi-asset collateral baskets (e.g. 50% USDC + 50% T-Bills).
  Requirements:
  1. Track individual asset weights and target asset ratios.
  2. Implement portfolio rebalancing calculations when deposits or withdrawals drift asset weights from targets.
  3. Aggregate Net Asset Value (NAV) across all underlying asset adapters.
- **Acceptance Criteria**:
  - `MultiAssetVault` core class supporting arrays of `IAssetAdapter` and weight ratios.
  - Rebalancing math verification unit tests.
  - Comprehensive documentation in `architecture.md`.

---

### Issue #3: Precision Rounding & Guard Math Fix in Cumulative Yield Engine
- **Title**: `fix(math): Resolve rounding drift bug in cumulative compound yield math under micro-transactions`
- **Complexity**: **Trivial** (100 Points)
- **Labels**: `Stellar Wave`, `trivial`, `bug`, `math`, `100-pts`
- **Description**:
  Under high-frequency micro-deposits (e.g. 1-stroop transactions), cumulative compound yield calculations experience minor 1-stroop rounding drift over millions of iterations.
  Tasks:
  1. Enhance `YieldMath.calculateLinearYield` and `convertToShares` to enforce explicit rounding-down guards.
  2. Add unit tests for 1-stroop deposits and sub-second timestamp intervals.
- **Acceptance Criteria**:
  - 100% precision accuracy test passing across 1,000,000 simulated micro-transactions without fractional asset leakage.

---

### Issue #4: Stellar Testnet Faucet & Sandbox Deployment Script
- **Title**: `feat(tooling): Build automated testnet faucet and vault deployment script`
- **Complexity**: **Medium** (150 Points)
- **Labels**: `Stellar Wave`, `medium`, `tooling`, `150-pts`
- **Description**:
  Create a CLI test harness script (`scripts/deploy-testnet-vault.ts`) that:
  1. Funds developer accounts on Stellar Testnet via Friendbot API.
  2. Mints test SAC (Stellar Asset Contract) tokens.
  3. Deploys a configured `RWAStandardVault` to Stellar Testnet.
  4. Generates a local `vault-config.json` file for frontend consumption.
- **Acceptance Criteria**:
  - `npm run testnet:deploy` command works out of the box with zero manual config required.

---

### Issue #5: Soroban Identity Registry & Accreditation Compliance Hook
- **Title**: `feat(compliance): Implement Soroban Identity Registry & Accreditation Hook`
- **Complexity**: **High** (200 Points)
- **Labels**: `Stellar Wave`, `high`, `compliance`, `200-pts`
- **Description**:
  Build an advanced compliance hook (`SorobanIdentityHook`) that queries on-chain identity contracts (SEP-12 / Soroban identity registries) to verify:
  1. Investor KYC status hash.
  2. Accredited investor badge expiry.
  3. Transfer restriction flags according to Reg D / Reg S requirements.
- **Acceptance Criteria**:
  - `SorobanIdentityHook` implementing `IComplianceHook`.
  - Mock Soroban smart contract client tests.

---

### Issue #6: Parameter Input Validation & Address Sanitization Decorators
- **Title**: `refactor(validation): Add comprehensive Zod input validation and address format sanitization`
- **Complexity**: **Trivial** (100 Points)
- **Labels**: `Stellar Wave`, `trivial`, `refactor`, `100-pts`
- **Description**:
  Ensure all public SDK methods strictly validate parameters before execution.
  Tasks:
  1. Add runtime checks for valid Stellar public key checksums (ED25519 public keys starting with G).
  2. Throw human-readable `ValidationError` for invalid inputs.
- **Acceptance Criteria**:
  - All invalid inputs fail fast with descriptive error messages before hitting network or state layers.

---

### Issue #7: Developer CLI Generator (`@stellar-rwa/vault-cli`)
- **Title**: `feat(cli): Scaffold developer project generator for custom RWA vaults`
- **Complexity**: **Medium** (150 Points)
- **Labels**: `Stellar Wave`, `medium`, `cli`, `150-pts`
- **Description**:
  Create a CLI tool (`packages/cli`) that allows developers to run `npx @stellar-rwa/vault-cli init` to scaffold a brand-new RWA vault repository pre-configured with selected compliance hooks, asset adapters, and test suites.
- **Acceptance Criteria**:
  - Interactive CLI prompting for asset code, APY model, and compliance rules.
