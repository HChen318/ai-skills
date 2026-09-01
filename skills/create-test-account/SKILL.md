---
name: create-test-account
description: Generate, register, and verify test accounts for 3World dev environment (https://dev-app.3worldglobal.com). Supports creating basic registered accounts, binding security phone numbers, and completing Standard KYC (Level 1) and Advanced KYC (Level 2) verification with ultra-fast hybrid execution (~1.5s for basic, ~35-45s for Level 2).
---

# Create & Verify Test Account Skill

Automates test account generation, phone binding, and KYC verification on the 3World dev environment (`https://dev-app.3worldglobal.com`).

---

## 🛑 Important Rules for AI Agents (Agent Execution Guidelines)

1. **Self-Contained Execution**: All registration, authentication, phone binding, Sumsub WebSDK automation, and document uploading logic are **100% self-contained** in `scripts/fast-create-account.mjs`.
2. **DO NOT Search or Analyze Codebase**: **DO NOT** use grep/find/view tools to search the workspace or inspect project source code (e.g. `apps/userAssets`, `src/service`, `fetch.ts`, etc.). No codebase analysis is required.
3. **Execute the Script Directly**: Locate `scripts/fast-create-account.mjs` in this skill directory and run it with the requested level:
   - **Level 2 (Advanced KYC - 50,000 USDT limit, default)**: `node <skill-dir>/scripts/fast-create-account.mjs --level 2`
   - **Level 1 (Standard KYC - 10,000 USDT limit)**: `node <skill-dir>/scripts/fast-create-account.mjs --level 1`
   - **Level 0 (Basic Account - Registered & Bound Phone)**: `node <skill-dir>/scripts/fast-create-account.mjs --level 0`
4. **Immediate Response**: Once the script outputs `>>> SUCCESS! TOTAL DURATION: ... <<<`, immediately format and return the generated credentials table to the user and stop.

---

## ⚡ Execution Commands

```bash
# Locate the skill directory (e.g. ~/.gemini/config/skills/create-test-account or ~/.agents/skills/create-test-account)
# and run the corresponding command:

# 1. Advanced KYC Level 2 Account (~35-45s, default):
node <path-to-skill>/scripts/fast-create-account.mjs --level 2

# 2. Standard KYC Level 1 Account (~18s):
node <path-to-skill>/scripts/fast-create-account.mjs --level 1

# 3. Basic Account (~1.5s):
node <path-to-skill>/scripts/fast-create-account.mjs --level 0
```

---

## 📊 Performance & Account Tier Reference

| Level | Description | Duration | Crypto Limit | Requirements |
| :--- | :--- | :--- | :--- | :--- |
| **Level 0** | Basic registered account + HK phone (`+852`) | **~1.5s** | Basic | Node.js (Pure API) |
| **Level 1** | Level 0 + Germany ID Card (Front & Back) Standard KYC | **~18s** | 10,000 USDT / day | Node.js + ego-browser |
| **Level 2** | Level 1 + Germany Address Proof Bill Advanced KYC | **~40s** | 50,000 USDT / day | Node.js + ego-browser |

---

## 🔑 Account Defaults

- **App Base URL**: `https://dev-app.3worldglobal.com`
- **Password**: `Password123!`
- **Fixed Dev OTP**: `123456` (both Email and SMS)
- **Document Assets**: Located in `resources/` (Germany ID Front/Back & Utility Bill)
