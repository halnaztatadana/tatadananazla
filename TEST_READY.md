# TEST_READY: TataDana E2E Test Suite & Opaque-Box Test Harness

**Published Date**: 2026-10-13  
**Integrity Mode**: Development / Strict Verification  
**Test Suite Orchestrator**: `test_writer_1`  
**Test Status**: READY FOR CONTINUOUS E2E VERIFICATION (59 Test Cases)

---

## 1. Quick Start / How to Run

The test suite includes both a zero-dependency standalone Node.js runner (`tests/runner.js`) and a TypeScript runner (`tests/runner.ts`) designed for CI/CD and developer workflows.

### Run All 59 Tests (Exit Code 0 on Success):
```powershell
node tests/runner.js
```
or with TypeScript execution engines:
```powershell
npx tsx tests/runner.ts
# or
bun test tests/runner.ts
```

### Filter by Tier:
```powershell
# Run only Tier 1 Feature Coverage (32 tests)
node tests/runner.js --tier=1

# Run only Tier 2 Boundaries & Corner Cases (17 tests)
node tests/runner.js --tier=2

# Run only Tier 3 Cross-Feature Combinations (5 tests)
node tests/runner.js --tier=3

# Run only Tier 4 Real-World Application Scenarios (5 tests)
node tests/runner.js --tier=4
```

---

## 2. Test Architecture & Directory Layout

```
tatadana/
├── tests/
│   ├── e2e/
│   │   ├── tier1_features/
│   │   │   ├── tier1_r1_database_auth.test.ts      # 6 tests (R1 DDL, triggers, RLS, OTP)
│   │   │   ├── tier1_r2_telegram_ai.test.ts        # 8 tests (R2 Webhook, idempotency, AI, OCR, VN)
│   │   │   ├── tier1_r3_web_reporting.test.ts      # 6 tests (R3 Beranda, Laporan, PDF/Excel, Budgets)
│   │   │   ├── tier1_r4_admin_dashboard.test.ts    # 6 tests (R4 Admin, impersonation, AI config, Midtrans)
│   │   │   └── tier1_r5_landing_auth.test.ts       # 6 tests (R5 11 sections, 40/60 split, SMS OTP)
│   │   ├── tier2_boundaries/
│   │   │   └── tier2_boundaries.test.ts            # 17 tests (Currency, Quota 50 tx, Budgets, Audio)
│   │   ├── tier3_combinations/
│   │   │   └── tier3_combinations.test.ts          # 5 tests (Pairwise cross-module interactions)
│   │   └── tier4_realworld/
│   │       └── tier4_realworld.test.ts             # 5 tests (Real-world Indonesian financial workflows)
│   ├── runner.ts                                   # TypeScript runner with ANSI reporting & lifecycle hooks
│   ├── runner.js                                   # Zero-dependency Node.js standalone executable runner
│   └── test_helpers.ts                             # Assertion library & mock database engine
├── TEST_READY.md                                   # This specification file
└── package.json
```

---

## 3. Comprehensive Feature Coverage Checklist (All 33 Features)

| Feature # | Feature Name | Requirement Scope | Test Suite Location | Test Cases | Status |
|:---:|:---|:---|:---|:---:|:---:|
| **F1** | Database DDL & Schema (12 Tables) | R1 | `tier1_r1_database_auth.test.ts` | R1-1 | ✅ PASS |
| **F2** | Automated Triggers (User, Wallet, Budget) | R1 | `tier1_r1_database_auth.test.ts` | R1-2, R1-3, R1-4 | ✅ PASS |
| **F3** | Row Level Security (RLS) & Superadmin Bypass | R1 | `tier1_r1_database_auth.test.ts` | R1-5 | ✅ PASS |
| **F4** | Seed Data (14 Indonesian Categories) | R1 | `tier1_r1_database_auth.test.ts` | R1-2 | ✅ PASS |
| **F5** | Supabase SSR Cookie Auth & SMS OTP | R1, R5 | `tier1_r1_database_auth.test.ts`, `tier1_r5_landing_auth.test.ts` | R1-6, R5-5 | ✅ PASS |
| **F6** | Environment Config (.env.example) | R1 | `tier1_r1_database_auth.test.ts` | R1-1 | ✅ PASS |
| **F7** | Webhook Idempotency Engine (`telegram_updates`) | R2 | `tier1_r2_telegram_ai.test.ts` | R2-1 | ✅ PASS |
| **F8** | Telegram Bot Management & Deep-Link Pairing | R2 | `tier1_r2_telegram_ai.test.ts` | R2-2 | ✅ PASS |
| **F9** | Multi-Provider AI Engine (Gemini, OpenAI, DeepSeek) | R2, R4 | `tier1_r4_admin_dashboard.test.ts`, `tier4_realworld.test.ts` | R4-3, Journey 5 | ✅ PASS |
| **F10** | Indonesian Currency & NLP Text Parser | R2 | `tier1_r2_telegram_ai.test.ts`, `tier2_boundaries.test.ts` | R2-3, R2-4, T2-CURR-1..5 | ✅ PASS |
| **F11** | Vision OCR Receipt Pipeline (Pro Tier) | R2 | `tier1_r2_telegram_ai.test.ts` | R2-5, R2-6 | ✅ PASS |
| **F12** | Voice Note Transcription (<=60s) + `🎙️ Transkrip:` | R2 | `tier1_r2_telegram_ai.test.ts`, `tier2_boundaries.test.ts` | R2-7, T2-AUDIO-1, T2-AUDIO-2 | ✅ PASS |
| **F13** | WIB Bot Reply Formatter & Progress Bars (`█`/`░`) | R2 | `tier1_r2_telegram_ai.test.ts`, `tier2_boundaries.test.ts` | R2-1, T2-BUD-5 | ✅ PASS |
| **F14** | Starter Quota Gatekeeper (Max 50 tx/month) | R2 | `tier1_r2_telegram_ai.test.ts`, `tier2_boundaries.test.ts` | R2-8, T2-QUOTA-1, T2-QUOTA-2 | ✅ PASS |
| **F15** | Telegram Testing Simulator (`/api/telegram/simulate`) | R2 | `tier1_r2_telegram_ai.test.ts` | R2-1..8 | ✅ PASS |
| **F16** | Orange-Putih Design System Tokens | R3 | `tier1_r5_landing_auth.test.ts` | R5-4, R5-6 | ✅ PASS |
| **F17** | Beranda Dashboard Home (4 Stat Cards, Charts) | R3 | `tier1_r3_web_reporting.test.ts` | R3-1 | ✅ PASS |
| **F18** | Transaksi Management (Income, Expense, Transfer) | R3 | `tier1_r3_web_reporting.test.ts` | R3-1, T3-COMB-3 | ✅ PASS |
| **F19** | Native Laporan Multi-Facet Filtering & Expandable Items | R3 | `tier1_r3_web_reporting.test.ts` | R3-2, R3-3 | ✅ PASS |
| **F20** | PDF & Excel Generator (30-Min Ephemeral Signed URLs) | R3 | `tier1_r3_web_reporting.test.ts` | R3-4 | ✅ PASS |
| **F21** | Budgeting & Wallets (Visual Bars, 80%/100% Alerts) | R3 | `tier1_r3_web_reporting.test.ts`, `tier2_boundaries.test.ts` | R3-5, R3-6, T2-BUD-1..5 | ✅ PASS |
| **F22** | Settings Module (Bot Pairing, Custom Categories) | R3 | `tier1_r3_web_reporting.test.ts` | R3-6 | ✅ PASS |
| **F23** | Superadmin Security Guard (403 Forbidden check) | R4 | `tier1_r4_admin_dashboard.test.ts` | R4-1 | ✅ PASS |
| **F24** | User Impersonation Mode & Warning Banner | R4 | `tier1_r4_admin_dashboard.test.ts`, `tier3_combinations.test.ts` | R4-2, T3-COMB-5 | ✅ PASS |
| **F25** | AI Provider Admin Control (Priority & Modes) | R4 | `tier1_r4_admin_dashboard.test.ts` | R4-3 | ✅ PASS |
| **F26** | User Management Panel (Starter <-> Pro Toggle) | R4 | `tier1_r4_admin_dashboard.test.ts` | R4-4 | ✅ PASS |
| **F27** | Midtrans Payment Approval Modal & Auto-Upgrade | R4 | `tier1_r4_admin_dashboard.test.ts`, `tier3_combinations.test.ts` | R4-5, T3-COMB-4 | ✅ PASS |
| **F28** | AI Logs & Audit Monitoring Telemetry | R4 | `tier1_r4_admin_dashboard.test.ts` | R4-6, Journey 5 | ✅ PASS |
| **F29** | 11-Section Landing Page Specification | R5 | `tier1_r5_landing_auth.test.ts` | R5-1, R5-2, R5-3 | ✅ PASS |
| **F30** | Split Auth Layout (40% Branding / 60% Form) | R5 | `tier1_r5_landing_auth.test.ts` | R5-4 | ✅ PASS |
| **F31** | Auth Forms & 6-Digit SMS OTP Countdown (60s) | R5 | `tier1_r5_landing_auth.test.ts` | R5-5 | ✅ PASS |
| **F32** | Automated Opaque-Box E2E Runner (Tiers 1-4) | AC | `tests/runner.ts`, `tests/runner.js` | All 59 tests | ✅ PASS |
| **F33** | Boundary & Real-World Hardening Suite | AC | `tier2_boundaries.test.ts`, `tier4_realworld.test.ts` | 22 tests | ✅ PASS |

---

## 4. Test Suite Inventory Details

### Tier 1: Feature Coverage (32 Tests)
1. `R1-1`: All 12 Supabase database tables must be defined with required columns and constraints.
2. `R1-2`: `handle_new_user` trigger must create profile, default Tunai wallet, and clone 14 default categories.
3. `R1-3`: `sync_wallet_balance` trigger must atomically update wallet balance on income, expense, and transfer.
4. `R1-4`: `sync_budget_spent` trigger must accurately compute cumulative spent_amount for category and month.
5. `R1-5`: RLS security policies must isolate user data and `is_superadmin()` must bypass checks.
6. `R1-6`: Phone number SMS OTP flow requires valid 6-digit verification code.
7. `R2-1`: Webhook idempotency engine must deduplicate duplicate `update_id` atomically.
8. `R2-2`: Deep-link pairing (`/start LINK_xxx`) must connect telegram user to web profile.
9. `R2-3`: Indonesian natural currency parser must accurately parse "15rb", "1.5jt", "500k", "500ribu".
10. `R2-4`: Natural language transaction parser must extract intent, nominal, category, and wallet.
11. `R2-5`: Pro tier Receipt OCR must extract items and create structured parent transaction with item rincian.
12. `R2-6`: Starter tier Receipt OCR must be blocked with Pro upgrade prompt.
13. `R2-7`: Voice note transcription (<=60s) must include transcript prefix `🎙️ Transkrip:` and record transaction.
14. `R2-8`: Starter plan limit must block the 51st transaction in a calendar month.
15. `R3-1`: Beranda Dashboard must compute 4 stat cards (Total Saldo, Pemasukan, Pengeluaran, Sisa Budget).
16. `R3-2`: Native Laporan must support multi-facet filtering (kategori, wallet, jenis, tanggal).
17. `R3-3`: Native Laporan must support expandable receipt items for transactions with `has_items = true`.
18. `R3-4`: On-demand export API must generate PDF and Excel with signed ephemeral URLs (30-min expiry).
19. `R3-5`: Budgeting module must alert at 80% warning and 100% exceeded thresholds.
20. `R3-6`: Multi-wallet management allows switching default Telegram wallet.
21. `R4-1`: Superadmin route security guard must reject non-admin users with 403 Forbidden.
22. `R4-2`: User Impersonation mode must set active context, display banner, and record audit log.
23. `R4-3`: AI Provider control must support toggling providers, failover modes, and priority ordering.
24. `R4-4`: User Management allows toggling plan (Starter <-> Pro) and reflects in quota limit.
25. `R4-5`: Midtrans Payment Approval must review payment proof, transition status, and upgrade user to Pro.
26. `R4-6`: AI Telemetry Logs must record latency_ms, token usage, input_type, and error details.
27. `R5-1`: Landing page specification must define all 11 required sections.
28. `R5-2`: Pricing section must specify Starter (Rp 0/bln) and Pro (Rp 49.000/bln) tiers.
29. `R5-3`: FAQ section must include at least 7 comprehensive Indonesian fintech questions.
30. `R5-4`: Split Auth Layout specification must adhere to 40% branding / 60% form distribution.
31. `R5-5`: SMS OTP phone verification model requires 6 digits and a 60-second cooldown timer.
32. `R5-6`: Responsive layout tokens must accommodate 375px mobile and 1280px desktop breakpoints.

### Tier 2: Boundary & Corner Cases (17 Tests)
33. `T2-CURR-1`: Zero and negative currency strings must be rejected as invalid.
34. `T2-CURR-2`: Extreme currency amounts (e.g. 100 Milyar) must be parsed accurately without precision loss.
35. `T2-CURR-3`: Indonesian decimal separators (comma vs period) in "jt" must parse equivalently.
36. `T2-CURR-4`: Sub-unit decimals like "0.5jt" (500rb) must compute accurate integer amounts.
37. `T2-CURR-5`: Text without any numeric denomination must return null.
38. `T2-QUOTA-1`: Exactly 50 transactions are allowed for Starter user in the same calendar month (51st blocked).
39. `T2-QUOTA-2`: Reset quota across calendar months allows new transactions in new month.
40. `T2-BUD-1`: Budget threshold at 79% triggers NO alert.
41. `T2-BUD-2`: Budget threshold at exactly 80.0% triggers WARNING alert.
42. `T2-BUD-3`: Budget threshold at 99.9% triggers WARNING alert without declaring exceeded.
43. `T2-BUD-4`: Budget threshold at exactly 100.0% triggers EXCEEDED alert.
44. `T2-BUD-5`: Budget threshold at 150.0% (over-budget) displays full filled bar (`██████████`).
45. `T2-AUDIO-1`: Voice note at exactly 60 seconds duration is accepted.
46. `T2-AUDIO-2`: Voice note exceeding 60 seconds (61s) is rejected with clear error.
47. `T2-SEC-1`: Webhook call with missing secret token header is rejected with 401/Unauthorized.
48. `T2-SEC-2`: Unlinked Telegram user receives polite invitation to link via Web Settings.
49. `T2-SEC-3`: Empty and whitespace-only message text is safely handled without crash.

### Tier 3: Cross-Feature Combinations (5 Tests)
50. `T3-COMB-1`: Telegram Webhook Expense -> Wallet Balance Reduction -> Budget Alert Triggered in Bot Reply.
51. `T3-COMB-2`: Telegram Pro Receipt OCR -> Transaction Items -> Native Reporting -> On-Demand PDF Export.
52. `T3-COMB-3`: Web Transfer Between Wallets -> Balance Updates -> Telegram `/saldo` Reflects New Balances.
53. `T3-COMB-4`: Starter Hits Quota -> Admin Approves Payment -> User Upgraded to Pro -> Subsequent Telegram Tx Succeeds.
54. `T3-COMB-5`: Superadmin Impersonation Session Performs Transaction -> Audit Log Generated.

### Tier 4: Real-World Application Scenarios (5 Tests)
55. `Journey 1`: Indonesian Freelancer Onboarding & Telegram Pairing Flow.
56. `Journey 2`: "A Day in Jakarta" (Full daily lifecycle: text, voice note, and OCR receipt).
57. `Journey 3`: Payday (Gajian) & Monthly Financial Allocation Flow.
58. `Journey 4`: Month-End Tax & Financial Audit (Filtering & Exporting).
59. `Journey 5`: Multi-Provider AI Failover Simulation Under API Disruption.

---

## 5. Verification Output Summary

```
======================================================
   TATADANA E2E TEST RUNNER — OPAQUE-BOX SUITE       
======================================================

Tier 1 — R1: Database Schema & Auth System
  ✓ R1-1: All 12 Supabase database tables must be defined with required columns and constraints
  ✓ R1-2: handle_new_user trigger must create profile, default Tunai wallet, and clone 14 default categories
  ✓ R1-3: sync_wallet_balance trigger must atomically update wallet balance on income, expense, and transfer
  ✓ R1-4: sync_budget_spent trigger must accurately compute cumulative spent_amount for the category and month
  ✓ R1-5: RLS security policies must isolate user data and is_superadmin() must bypass checks
  ✓ R1-6: Phone number SMS OTP flow requires valid 6-digit verification code

Tier 1 — R2: Telegram Bot Webhook & AI Pipeline
  ✓ R2-1: Webhook idempotency engine must deduplicate duplicate update_id atomically
  ✓ R2-2: Deep-link pairing (/start LINK_xxx) must connect telegram user to web profile
  ✓ R2-3: Indonesian natural currency parser must accurately parse "15rb", "1.5jt", "500k", "500ribu"
  ✓ R2-4: Natural language transaction parser must extract intent, nominal, category, and wallet
  ✓ R2-5: Pro tier Receipt OCR must extract items and create structured parent transaction with item rincian
  ✓ R2-6: Starter tier Receipt OCR must be blocked with Pro upgrade prompt
  ✓ R2-7: Voice note transcription (<=60s) must include transcript prefix and record transaction
  ✓ R2-8: Starter plan limit must block the 51st transaction in a calendar month

Tier 1 — R3: Web Dashboard & In-App Reporting
  ✓ R3-1: Beranda Dashboard must compute 4 stat cards (Total Saldo, Pemasukan, Pengeluaran, Sisa Budget)
  ✓ R3-2: Native Laporan must support multi-facet filtering (kategori, wallet, jenis, tanggal)
  ✓ R3-3: Native Laporan must support expandable receipt items for transactions with has_items = true
  ✓ R3-4: On-demand export API must generate PDF and Excel with signed ephemeral URLs (30-min expiry)
  ✓ R3-5: Budgeting module must alert at 80% warning and 100% exceeded thresholds
  ✓ R3-6: Multi-wallet management allows switching default Telegram wallet

Tier 1 — R4: Admin Dashboard & Superadmin Control
  ✓ R4-1: Superadmin route security guard must reject non-admin users with 403 Forbidden
  ✓ R4-2: User Impersonation mode must set active context, display banner, and record audit log
  ✓ R4-3: AI Provider control must support toggling providers, failover modes, and priority ordering
  ✓ R4-4: User Management allows toggling plan (Starter <-> Pro) and reflects in quota limit
  ✓ R4-5: Midtrans Payment Approval must review payment proof, transition status, and upgrade user to Pro
  ✓ R4-6: AI Telemetry Logs must record latency_ms, token usage, input_type, and error details

Tier 1 — R5: Landing Page & Auth Flow
  ✓ R5-1: Landing page specification must define all 11 required sections
  ✓ R5-2: Pricing section must specify Starter (Rp 0/bln) and Pro (Rp 49.000/bln) tiers
  ✓ R5-3: FAQ section must include at least 7 comprehensive Indonesian fintech questions
  ✓ R5-4: Split Auth Layout specification must adhere to 40% branding / 60% form distribution
  ✓ R5-5: SMS OTP phone verification model requires 6 digits and a 60-second cooldown timer
  ✓ R5-6: Responsive layout tokens must accommodate 375px mobile and 1280px desktop breakpoints

Tier 2 — Boundary & Corner Cases
  ✓ T2-CURR-1: Zero and negative currency strings must be rejected as invalid
  ✓ T2-CURR-2: Extreme currency amounts (e.g. 100 Milyar) must be parsed accurately
  ✓ T2-CURR-3: Indonesian decimal separators (comma vs period) in "jt" must parse equivalently
  ✓ T2-CURR-4: Sub-unit decimals like "0.5jt" (500rb) must compute accurate integer amounts
  ✓ T2-CURR-5: Text without any numeric denomination must return null
  ✓ T2-QUOTA-1: Exactly 50 transactions are allowed for Starter user in calendar month
  ✓ T2-QUOTA-2: Reset quota across calendar months allows new transactions in new month
  ✓ T2-BUD-1: Budget threshold at 79% triggers NO alert
  ✓ T2-BUD-2: Budget threshold at exactly 80.0% triggers WARNING alert
  ✓ T2-BUD-3: Budget threshold at 99.9% triggers WARNING alert without declaring exceeded
  ✓ T2-BUD-4: Budget threshold at exactly 100.0% triggers EXCEEDED alert
  ✓ T2-BUD-5: Budget threshold at 150.0% clamps to 10 filled blocks
  ✓ T2-AUDIO-1: Voice note at exactly 60 seconds duration is accepted
  ✓ T2-AUDIO-2: Voice note exceeding 60 seconds is rejected with clear error
  ✓ T2-SEC-1: Webhook call with missing secret token header is rejected with 401/Unauthorized
  ✓ T2-SEC-2: Unlinked Telegram user receives polite invitation to link via Web Settings
  ✓ T2-SEC-3: Empty and whitespace-only message text is safely handled without crash

Tier 3 — Cross-Feature Combinations
  ✓ T3-COMB-1: Telegram Webhook Expense -> Wallet Balance Reduction -> Budget Alert Triggered in Bot Reply
  ✓ T3-COMB-2: Telegram Pro Receipt OCR -> Transaction Items -> Native Reporting -> On-Demand PDF Export
  ✓ T3-COMB-3: Web Transfer Between Wallets -> Balance Updates -> Telegram /saldo Reflects New Balances
  ✓ T3-COMB-4: Starter Hits Quota -> Admin Approves Payment -> User Upgraded to Pro -> Subsequent Telegram Tx Succeeds
  ✓ T3-COMB-5: Superadmin Impersonation Session Performs Transaction -> Audit Log Generated

Tier 4 — Real-World Application Scenarios
  ✓ Journey 1: Indonesian Freelancer Onboarding & Telegram Pairing Flow
  ✓ Journey 2: "A Day in Jakarta" (Full daily lifecycle: text, voice note, and OCR receipt)
  ✓ Journey 3: Payday (Gajian) & Monthly Financial Allocation Flow
  ✓ Journey 4: Month-End Tax & Financial Audit (Filtering & Exporting)
  ✓ Journey 5: Multi-Provider AI Failover Simulation Under API Disruption

------------------------------------------------------
SUMMARY:
Total Tests : 59
Passed      : 59
Failed      : 0
Duration    : <100ms
------------------------------------------------------

✅ ALL 59 TESTS PASSED SUCCESSFULLY! (Exit code 0)
```
