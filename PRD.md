# Product Requirements Document (PRD)
## Stellar RWA Vault SDK (`stellar-rwa-vault-sdk`)

---

### 1. Executive Summary & Vision
The **Stellar RWA Vault SDK** is a modular developer toolkit designed to standardize and accelerate the development of Real-World Asset (RWA) yield-bearing vaults on the Stellar network and Soroban smart contract platform.

Rather than building a single consumer-facing product, `stellar-rwa-vault-sdk` provides protocol developers, fintech institutions, and asset managers with modular building blocks to:
- Mint interest-bearing vault shares (ERC-4626 standard equivalent for Stellar/Soroban).
- Accrue and compound real-world asset yields (e.g. tokenized U.S. Treasury Bills, corporate bonds, trade finance).
- Enforce strict regulatory compliance, accredited investor checks, and KYC/AML whitelisting via customizable hooks.
- Interface seamlessly with Stellar Classic assets (SEP-41) and Soroban token contracts.

---

### 2. Alignment with Drips Wave 8
This project is structured specifically to participate in **Drips Wave 8** (Stellar Ecosystem Track).
SDK toolkits require **broad, modular coverage across many integrations**, making this architecture ideal for distributing issue work across multiple open-source contributors using the Drips Wave points budget model.

#### Points Allocation Scheme:
- **Trivial Issues (100 Pts)**: Small bug fixes, parameter input validation, documentation fixes, unit test coverage expansion.
- **Medium Issues (150 Pts)**: Tokenized asset adapters (Ondo/WisdomTree/Treasury adapters), testnet faucet/deployment scripts, CLI project scaffolding tool.
- **High Issues (200 Pts)**: Multi-asset collateral accounting engine, on-chain Soroban compliance identity hooks, multi-strategy yield rebalancer.

---

### 3. Core Features & Capabilities

#### 3.1 Vault Share & Deposit Math (ERC-4626 Equivalent)
- Standardized `deposit()`, `withdraw()`, `totalAssets()`, `totalSupply()`, `convertToShares()`, `convertToAssets()`.
- Precision asset-to-share math preventing first-depositor inflation attacks and rounding loss.

#### 3.2 Fixed-Point Yield Accounting Engine
- High-precision fixed-point math (18 decimal places internally, converting to 7 decimal Stroop precision on Stellar).
- Supports linear interest accrual, compounded APY distributions, NAV updates, and performance fee calculations.

#### 3.3 Modular Compliance & Identity Hooks (`IComplianceHook`)
- Pre-deposit and pre-withdraw hook execution.
- Verified sender and recipient address whitelisting, jurisdiction restrictions, and transfer limits.

#### 3.4 Multi-Asset & Standard Asset Adapters
- `StellarAssetAdapter` for SEP-41 / SAC (Stellar Asset Contracts).
- Adapter interface `IAssetAdapter` enabling plug-and-play integrations with external tokenized RWA issuers (e.g. Ondo USDY, WisdomTree T-Bills).

---

### 4. Phased Roadmap

#### Phase 1: Core SDK & Foundation (CURRENT PHASE - COMPLETED IN THIS BUILD)
- Core TypeScript SDK structure & build system.
- Standard Vault class (`RWAStandardVault`) with deposit/withdraw and share math.
- Precision Yield Engine (`YieldMath`) supporting linear APY and NAV distribution.
- Base Compliance Hook (`SimpleWhitelistHook`).
- `StellarAssetAdapter` for standard Stellar assets (USDC, EURC).
- Comprehensive test suite & executable demo.

#### Phase 2: Advanced Yield & Asset Adapters (Drips Wave 8 Issues)
- Issue #1 (Medium, 150 Pts): Ondo/WisdomTree T-Bill Asset Adapter (`TreasuryBillAdapter`).
- Issue #2 (High, 200 Pts): Multi-Asset Vault Accounting Engine with weighted NAV calculation.
- Issue #3 (Trivial, 100 Pts): Precision rounding math fix in cumulative yield distribution.
- Issue #4 (Medium, 150 Pts): Local & Testnet Faucet / Deployment Script.

#### Phase 3: Identity Hooks & Developer Tooling (Drips Wave 8 Issues)
- Issue #5 (High, 200 Pts): Soroban Identity Registry & Accreditation Hook (`SorobanIdentityHook`).
- Issue #6 (Trivial, 100 Pts): Parameter input validation & address sanitization decorators.
- Issue #7 (Medium, 150 Pts): `npx @stellar-rwa/vault-cli` project generator.

---

### 5. Target Audience & Developer UX
- **Target Users**: DeFi protocol engineers, RWA tokenization platforms, institution asset managers building on Stellar.
- **Developer Experience**: Simple, intuitive API allowing developers to deploy a fully compliant RWA yield vault in under 20 lines of TypeScript.

---

### 6. Non-Functional Requirements
- **Precision**: Zero loss of funds due to precision truncation; standard unit tests covering fractional cent transactions.
- **Type Safety**: 100% strict TypeScript types and Zod schema validation.
- **Test Coverage**: >80% line and branch coverage across math, compliance, and vault core modules.
