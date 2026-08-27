# Apple Seed — Project Contract & Communication Terminology V1

**Effective:** 2026-08-27  
**Repository:** `Totrungtv/appleseed-website`  
**Purpose:** single communication contract for long-term Apple Seed development.

## 1. Source of truth

- Production website code: `main` branch.
- Public homepage: `index.html`.
- AI repair workspace: `ai-board.html`.
- Shared authentication client: `supabase-config.js` + `member-auth.js`.
- Database business rules: Supabase migrations/functions, not frontend JavaScript.
- Coin balance: `member_accounts.coins`.
- Coin history: `member_coin_ledger`.
- Never treat an old HTML backup as the active source.
- Never modify production behavior directly when a change can first be isolated in a feature/fix branch.
- Every database change must be a separate named migration with a rollback plan.

## 2. Canonical roles

Use these terms everywhere:

| Canonical term | Meaning |
|---|---|
| Guest | Visitor who is not authenticated |
| Member | Authenticated Apple Seed customer/member |
| Staff | Internal staff account |
| Admin | Highest website/admin authority |

Do not use “user” in customer-facing UI when “Member” is intended.

## 3. Canonical product terms

Use the exact names below in UI, code comments, database documentation and our development conversations:

- **AI Board** — the overall technical AI workspace.
- **AI Diagnosis** — PANIC/measurement-based board diagnosis.
- **Schematic Intelligence** — schematic/boardview analysis.
- **Repair Video Library** — curated repair-video library.
- **Member Policy** — member rules and Coin policy.
- **Member Wallet** — Coin balance, payment requests and transaction history.
- **Coin** — Apple Seed's AI usage unit. Never call it “credit” or “point”.
- **PANIC log** — raw panic/kernel evidence.
- **Boot current** — startup current measurement.
- **VBAT / nguồn** — battery/input power measurement.
- **Diode / Resistance** — diode/resistance measurement.
- **I2C / SDA / SCL** — bus/address/state evidence.
- **Boardview / ZXW** — boardview source.
- **Schematic** — schematic source.
- **Known-good board** — reference board used for comparison.

## 4. Access contract

- Guest: YouTube/public content only.
- Member: Member-only AI Board, diagnostics, schematic/boardview tools, repair library and community features.
- Staff: operational/admin functions explicitly granted to Staff.
- Admin: website/CMS/member/security controls.
- Frontend visibility is not the security boundary. Backend RLS, RPC authorization and Edge Function authorization are the security boundary.

## 5. Member lifecycle

Target product policy:

1. Registration is free.
2. New Member receives **150 Coin once**.
3. Trial period is **1 month from the Member signup/activation date**.
4. When Trial expires, AI Board access is locked unless the Member has the required paid/Coin mechanism.
5. Coin transactions must always be represented in the ledger.
6. Admin approval is required before payment-based Coin is credited.
7. Suspended accounts remain suspended regardless of Coin balance.

**Important audit note:** the production database currently contains legacy **3-day Trial** timestamps/functions. A dedicated migration is required to make the database match this 1-month policy. Do not silently patch this in frontend JavaScript.

## 6. AI billing contract

Canonical actions:

- `ai_analysis` — AI Diagnosis.
- `schematic_analysis` — Schematic Intelligence.

Canonical costs currently defined by the database:

- AI Diagnosis: 20 Coin.
- Schematic Intelligence: 10 Coin.

The deduction must happen server-side and atomically. Frontend must never be trusted to subtract Coin.

## 7. Evidence-first repair language

AI must distinguish:

- **Dữ kiện** — directly supplied/measured evidence.
- **Nhận định** — inference supported by evidence.
- **Dữ liệu còn thiếu** — information still required.
- **Phép đo tiếp theo** — next measurement.
- **Ưu tiên kiểm tra** — diagnostic priority.
- **Kết luận tạm thời** — provisional conclusion.

Never state a component/net/IC as confirmed when the evidence does not support it.

## 8. Communication rules between Trung and ChatGPT

When discussing Apple Seed:

- “Nạp” = deploy/commit the approved change to the intended production source.
- “Sửa” = modify code/configuration, with backup and rollback awareness.
- “Kiểm tra” = inspect first; do not change production merely because an issue was found.
- “Audit” = inspect code + database + Edge Functions + security + terminology + deployment state.
- “Chuẩn” = matches this contract and the active production architecture.
- “Bản gốc” = the explicitly designated stable source; never guess from filenames.
- “Backup” = immutable copy/commit made before a risky change.
- “Migration” = one named database change, never hidden inside an unrelated SQL file.
- “Deploy” = publish a tested code/function change to the active environment.
- “Rollback” = return to a known-good commit/configuration without rolling back business data unless explicitly requested.

## 9. Development safety contract

Before any structural change:

1. Identify the active source of truth.
2. Inspect current code/database state.
3. Create backup/commit.
4. Make one logically scoped change.
5. Validate syntax/references/authorization.
6. Test Guest + Member + Staff + Admin paths where applicable.
7. Check Supabase security/performance advisors.
8. Verify deployment.
9. Record the change and rollback point.

Never claim “zero risk” or “no possible bug”; report what was actually checked and what remains unverified.

## 10. Current audit findings — 2026-08-27

The audit found several items that must be treated as engineering backlog before declaring the platform fully synchronized:

- AI Board previously contained duplicate Member Gate markup; the duplicate has now been removed.
- Production database still uses legacy 3-day Trial values/functions while the current product policy is 1 month.
- `analyze-schematic` Edge Function is currently deployed with JWT verification disabled; it uses the service-role key and must be protected/ownership-checked.
- Supabase security advisors currently report multiple publicly executable SECURITY DEFINER functions; these require a deliberate authorization review and migration.
- Some RLS-enabled tables have no policies; each must be classified as intentionally inaccessible or given an explicit policy.
- Several foreign keys lack covering indexes; these are performance items, not immediate functional failures.
- The repository has many long-lived unprotected feature/fix branches; main-branch protection should be part of the long-term workflow.
- The current AI Board frontend calls `appleseed-ai` directly for both AI Diagnosis and Schematic Intelligence. The separate `analyze-schematic` function exists but is not the active browser path. This must be unified so there is one authoritative Schematic Intelligence flow.

This file is a contract, not a substitute for testing or database authorization.
