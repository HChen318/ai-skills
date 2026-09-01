---
name: create-test-account
description: Generate, register, and verify test accounts for 3World dev environment (https://dev-app.3worldglobal.com). Supports creating basic registered accounts, binding security phone numbers, and completing Standard KYC (Level 1) and Advanced KYC (Level 2) verification with ultra-fast hybrid execution (~1.5s for basic, ~35-45s for Level 2).
---

# Create & Verify Test Account Skill

Automates test account generation and identity verification on the 3World dev environment (`https://dev-app.3worldglobal.com`).

---

## ⚡ Performance Summary

| Mode | Target Level | Original UI Flow | Optimized Hybrid Flow | Speedup |
| :--- | :--- | :--- | :--- | :--- |
| **Basic Account + Bound Phone** | Level 0 | ~180s | **~1.5s** | **99.2% faster** |
| **Standard KYC (Level 1)** | Level 1 | ~240s | **~15-20s** | **92.5% faster** |
| **Advanced KYC (Level 2)** | Level 2 | ~353s (5m 53s) | **~35-45s** | **88.7% faster** |

---

## 🚀 Quick Execution

### One-line CLI Command

```bash
# Generate Advanced KYC Level 2 Account (~40s, default)
node .agents/skills/create-test-account/scripts/fast-create-account.mjs --level 2

# Generate Standard KYC Level 1 Account (~18s)
node .agents/skills/create-test-account/scripts/fast-create-account.mjs --level 1

# Generate Basic Registered Account with Bound Phone (~1.5s)
node .agents/skills/create-test-account/scripts/fast-create-account.mjs --level 0
```

---

## 1. Environment & Constants

- **App Base URL**: `https://dev-app.3worldglobal.com`
- **Fixed Verification Code**: `123456` (valid for both Email and SMS in Dev)
- **Standard Strong Password**: `Password123!`
- **Random Email Format**: `turbo_${Math.floor(100000 + Math.random() * 900000)}@gmail.com`
- **Random HK Phone Format**: `+852 9` + 7 random digits (e.g. `+852 91702819`)

### KYC Document Assets (in skill directory)

- **Front ID (正面)**: `resources/标准身份认证1.png` (DEU ID Card - FREYA KRAUSE)
- **Back ID (背面)**: `resources/标准身份认证2.png` (DEU ID Card Back - 51247 KÖLN)
- **Address Proof (地址证明)**: `resources/高级身份认证地址证明.jpg` (Wasser- und Abwasserverband Utility Bill)

---

## 2. Why the Original Flow Took 5m 53s vs How It Was Optimized

### 🐢 Bottlenecks in the Original Flow:
1. **Browser UI Redirection Overhead**:
   - Going through `/register` -> Email OTP -> Password set -> `/login` -> Password fill -> `/security` -> Email OTP -> SMS OTP -> Phone bind took over 180s due to rendering, network rounds, and page transitions.
2. **Fixed `wait(3)`-`wait(5)` Sleep Overheads**:
   - Dozens of arbitrary sleeps added over 100s of cumulative idle delay.
3. **Sumsub Sandbox Polling Delay**:
   - Waiting for Sumsub sandbox auto-approval with 3s intervals and full page reloads.

### ⚡ Hybrid Optimization Architecture:
1. **Pure REST API for Auth & Phone Binding (Phase 1, ~1.2s)**:
   - `POST /wapi/user/register` with code `123456`
   - `POST /wapi/user/login/doLogin` -> receives `tokenValue`
   - `POST /wapi/security/verify` (EMAIL, BIND_PHONE) with code `123456`
   - `POST /wapi/user/bindPhone` with code `123456`
2. **Pre-authenticated Direct Page Entry (Phase 2, ~1.5s)**:
   - Injects `localStorage['3world-user-storage']` with `{ state: { token, user }, version: 0 }`.
   - Opens `/identity` directly in an authenticated, ready state.
3. **CDP Direct OOPIF Target Control (Phase 3 & 4)**:
   - Dynamically resolves active Sumsub iframe target via `Target.getTargets` + `parentId`.
   - Injects document images directly into file inputs via `cdp('DOM.setFileInputFiles', ...)`.
4. **Instant KYC Status Synchronization**:
   - Calls `POST /wapi/user/kyc/v1/updateKycStatusToPending` (`{ kycLevel: 1|2 }`) immediately after submit, triggering instant sandbox verification without long polling delays.

---

## 3. Core API Reference

### 3.1 Register Account
- **Endpoint**: `POST /wapi/user/register`
- **Headers**: `Content-Type: application/json`, `platform: web`
- **Body**:
  ```json
  {
    "email": "turbo_123456@gmail.com",
    "areaCode": "+852",
    "phoneNumber": "",
    "code": "123456",
    "password": "Password123!"
  }
  ```

### 3.2 Login
- **Endpoint**: `POST /wapi/user/login/doLogin`
- **Headers**: `Content-Type: application/json`, `platform: web`
- **Body**:
  ```json
  {
    "email": "turbo_123456@gmail.com",
    "areaCode": "+852",
    "phoneNumber": "",
    "password": "Password123!",
    "type": "0"
  }
  ```
- **Response**: `data.tokenValue`

### 3.3 Security Email 2FA Verification
- **Endpoint**: `POST /wapi/security/verify`
- **Headers**: `Content-Type: application/json`, `3world-token: <tokenValue>`, `platform: web`
- **Body**:
  ```json
  {
    "code": "123456",
    "type": "EMAIL",
    "messageType": "BIND_PHONE"
  }
  ```

### 3.4 Bind Phone Number
- **Endpoint**: `POST /wapi/user/bindPhone`
- **Headers**: `Content-Type: application/json`, `3world-token: <tokenValue>`, `platform: web`
- **Body**:
  ```json
  {
    "phoneNumber": "91702819",
    "areaCode": "+852",
    "code": "123456"
  }
  ```
- **Response**: `data` (complete user info object for `localStorage`)

### 3.5 Sync KYC Status
- **Endpoint**: `POST /wapi/user/kyc/v1/updateKycStatusToPending`
- **Headers**: `Content-Type: application/json`, `3world-token: <tokenValue>`, `platform: web`
- **Body**: `{ "kycLevel": 1 }` (or `2`)

### 3.6 Query KYC Status & Details
- **Status Endpoint**: `GET /wapi/user/kyc/v1/getUserKycStatus`
- **Details Endpoint**: `GET /wapi/user/kyc/v1/getUserKycDetails`
- **Headers**: `3world-token: <tokenValue>`, `platform: web`

---

## 4. Sumsub OOPIF Automation Helper Patterns

```javascript
// Resolve active Sumsub iframe target belonging to current tab
async function getActiveSumsubTarget() {
  const tabs = await listTabs();
  const currentTab = tabs.find(t => t.active) || tabs[0];
  const targets = await cdp('Target.getTargets');
  return targets.targetInfos.find(t => t.url.includes('sumsub.com') && t.type === 'iframe' && (t.parentId === currentTab?.targetId || !currentTab));
}

// Evaluate JavaScript inside active Sumsub iframe
async function evalInSumsub(expr) {
  const sumsub = await getActiveSumsubTarget();
  if (!sumsub) return null;
  const { sessionId } = await cdp('Target.attachToTarget', { targetId: sumsub.targetId, flatten: true });
  const res = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId);
  return res?.result?.value;
}

// Inject files directly into file inputs
async function setSumsubFileInputs(files) {
  const sumsub = await getActiveSumsubTarget();
  if (!sumsub) return false;
  const { sessionId } = await cdp('Target.attachToTarget', { targetId: sumsub.targetId, flatten: true });
  await cdp('DOM.enable', {}, sessionId);
  const doc = await cdp('DOM.getDocument', { depth: -1, pierce: true }, sessionId);
  
  const findInputs = (node, list = []) => {
    if (node.nodeName === 'INPUT' && node.attributes) {
      for (let i = 0; i < node.attributes.length; i += 2) {
        if (node.attributes[i] === 'type' && node.attributes[i+1] === 'file') list.push(node);
      }
    }
    if (node.children) node.children.forEach(c => findInputs(c, list));
    if (node.shadowRoots) node.shadowRoots.forEach(s => findInputs(s, list));
    if (node.contentDocument) findInputs(node.contentDocument, list);
    return list;
  };

  const inputs = findInputs(doc.root);
  if (inputs.length >= files.length) {
    for (let i = 0; i < files.length; i++) {
      await cdp('DOM.setFileInputFiles', { files: [files[i]], backendNodeId: inputs[i].backendNodeId }, sessionId);
      await wait(0.4);
    }
    return true;
  }
  return false;
}
```
