#!/usr/bin/env node

/**
 * Ultra-Fast Test Account & KYC Generator for 3World Dev Environment
 * Usage:
 *   node <path-to-skill>/scripts/fast-create-account.mjs [--level 0|1|2]
 * 
 * Target Levels:
 *   --level 0 : Pure API account registration + phone binding (~1.5 seconds)
 *   --level 1 : Standard KYC Level 1 (~20 seconds)
 *   --level 2 : Advanced KYC Level 2 (~40-50 seconds, default)
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(__dirname, '..');
const fileFront = path.join(skillDir, 'resources/标准身份认证1.png');
const fileBack = path.join(skillDir, 'resources/标准身份认证2.png');
const fileAddress = path.join(skillDir, 'resources/高级身份认证地址证明.jpg');

const targetLevel = process.argv.includes('--level')
  ? parseInt(process.argv[process.argv.indexOf('--level') + 1], 10)
  : 2;

console.log(`[FastKYC] Starting ultra-fast account generator (Target Level: ${targetLevel})...`);

const scriptContent = `(async () => {
const totalStart = Date.now()
const baseUrl = 'https://dev-app.3worldglobal.com'
const targetLevel = ${targetLevel}

const fileFront = ${JSON.stringify(fileFront)}
const fileBack = ${JSON.stringify(fileBack)}
const fileAddress = ${JSON.stringify(fileAddress)}

const randomNum = Math.floor(100000 + Math.random() * 900000)
const email = '3world_' + randomNum + '@gmail.com'
const password = 'Aa123456'
const phone = '9' + Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7)

async function waitFor(fn, timeoutMs = 30000, intervalMs = 250) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fn()
      if (res) return res
    } catch (_) {}
    await wait(intervalMs / 1000)
  }
  throw new Error('Timeout after ' + timeoutMs + 'ms')
}

// Get active Sumsub iframe target
async function getActiveSumsubTarget() {
  const targets = await cdp('Target.getTargets')
  return targets.targetInfos.find(t => t.url.includes('sumsub.com') && t.type === 'iframe')
}

// Evaluate expression inside active Sumsub iframe session
async function evalInSumsub(expr) {
  const sumsub = await getActiveSumsubTarget()
  if (!sumsub) return null
  const { sessionId } = await cdp('Target.attachToTarget', { targetId: sumsub.targetId, flatten: true })
  const res = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId)
  return res?.result?.value
}

// Set file inputs inside Sumsub iframe
async function setSumsubFileInputs(files) {
  const sumsub = await getActiveSumsubTarget()
  if (!sumsub) return false
  const { sessionId } = await cdp('Target.attachToTarget', { targetId: sumsub.targetId, flatten: true })
  await cdp('DOM.enable', {}, sessionId)
  const doc = await cdp('DOM.getDocument', { depth: -1, pierce: true }, sessionId)
  const findInputs = (node, list = []) => {
    if (node.nodeName === 'INPUT' && node.attributes) {
      for (let i = 0; i < node.attributes.length; i += 2) {
        if (node.attributes[i] === 'type' && node.attributes[i+1] === 'file') list.push(node)
      }
    }
    if (node.children) node.children.forEach(c => findInputs(c, list))
    if (node.shadowRoots) node.shadowRoots.forEach(s => findInputs(s, list))
    if (node.contentDocument) findInputs(node.contentDocument, list)
    return list
  }
  const inputs = findInputs(doc.root)
  if (inputs.length >= files.length) {
    for (let i = 0; i < files.length; i++) {
      await cdp('DOM.setFileInputFiles', { files: [files[i]], backendNodeId: inputs[i].backendNodeId }, sessionId)
      await wait(0.6)
    }
    return true
  }
  return false
}

// Click "Continue here / Agree and continue" if present — 简体 | 繁体 | English
// Retries up to maxTries times
async function tryClickContinueHere(maxTries = 4, intervalSec = 0.5) {
  for (let i = 0; i < maxTries; i++) {
    const clicked = await evalInSumsub(String.raw\`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText && (
        b.innerText.includes('在此处继续') || b.innerText.includes('在此處繼續') ||
        b.innerText.includes('Continue here') ||
        b.innerText.includes('同意并继续') || b.innerText.includes('同意並繼續') ||
        b.innerText.includes('Agree and continue')
      ));
      if (btn) { btn.click(); return true; }
      return false;
    })()\`)
    if (clicked) return true
    await wait(intervalSec)
  }
  return false
}

// Set React-controlled input value inside Sumsub (bypasses synthetic event system)
async function setSumsubCountryInput(value) {
  return await evalInSumsub(String.raw\`(() => {
    const input = document.querySelector('input');
    if (!input) return false;
    try {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, \${JSON.stringify(value)});
    } catch(e) {
      input.value = \${JSON.stringify(value)};
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()\`)
}

// Click Germany option from dropdown
async function clickGermanyOption() {
  return await evalInSumsub(String.raw\`(() => {
    const all = Array.from(document.querySelectorAll('button, li, div[role="option"], span'));
    const deu = all.find(b => b.innerText && (b.innerText.trim() === '德国' || b.innerText.trim() === 'Germany') && !b.className.includes('topbar'));
    if (deu) { deu.click(); return true; }
    return false;
  })()\`)
}

// ----------------------------------------------------
// 1. FAST API AUTH & PHONE BINDING (~1.5s)
// ----------------------------------------------------
cliLog('>>> [1/4] Registering account & binding phone via pure API...')
const t0 = Date.now()
await serverFetch(baseUrl + '/wapi/user/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', platform: 'web' },
  body: JSON.stringify({ email, areaCode: '+852', phoneNumber: '', code: '123456', password })
})

const loginRes = JSON.parse(await serverFetch(baseUrl + '/wapi/user/login/doLogin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', platform: 'web' },
  body: JSON.stringify({ email, areaCode: '+852', phoneNumber: '', password, type: '0' })
}))
const token = loginRes.data?.tokenValue

await serverFetch(baseUrl + '/wapi/security/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', '3world-token': token, platform: 'web' },
  body: JSON.stringify({ code: '123456', type: 'EMAIL', messageType: 'BIND_PHONE' })
})

await serverFetch(baseUrl + '/wapi/user/bindPhone', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', '3world-token': token, platform: 'web' },
  body: JSON.stringify({ phoneNumber: phone, areaCode: '+852', code: '123456' })
})

const userRes = JSON.parse(await serverFetch(baseUrl + '/wapi/user/getInfo', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json', '3world-token': token, platform: 'web' }
}))
const fullUser = userRes.data
const userId = fullUser?.userId || fullUser?.id || fullUser?.uid || 'N/A'
cliLog('✓ [Phase 1 Done] Account created in ' + ((Date.now() - t0)/1000).toFixed(2) + 's (' + email + ')')

if (targetLevel === 0) {
  cliLog('=================================================')
  cliLog('>>> SUCCESS! TOTAL DURATION: ' + ((Date.now() - totalStart)/1000).toFixed(2) + 's <<<')
  cliLog('Email: ' + email)
  cliLog('Phone: +852 ' + phone)
  cliLog('Password: ' + password)
  cliLog('UID: ' + userId)
  cliLog('=================================================')
  return
}

// ----------------------------------------------------
// 2. OPEN PAGE WITH AUTH PRE-LOADED (~2s)
// ----------------------------------------------------
const task = await useOrCreateTaskSpace('turbo-kyc-worker')

try {
  cliLog('>>> [2/4] Launching browser pre-authenticated to /identity...')
  const t1 = Date.now()
  await gotoAndWait(baseUrl + '/identity')

  await js(String.raw\`(() => {
    localStorage.setItem('3world-user-storage', JSON.stringify({
      state: { token: "\${token}", user: \${JSON.stringify(fullUser)} },
      version: 0
    }));
    localStorage.setItem('i18nextLng', 'zh');
    document.cookie = "3world-token=\${token}; path=/; domain=.3worldglobal.com";
    document.cookie = "3world-token=\${token}; path=/";
  })()\`)
  await gotoAndWait(baseUrl + '/identity')
  await wait(3)
  cliLog('✓ [Phase 2 Done] Identity page loaded in ' + ((Date.now() - t1)/1000).toFixed(2) + 's')

  // ----------------------------------------------------
  // 3. STANDARD KYC LEVEL 1 AUTOMATION
  // ----------------------------------------------------
  cliLog('>>> [3/4] Automating Standard KYC Level 1...')
  const t2 = Date.now()

  // 3.0 Click "立即认证" button (exact match — avoid nav tab "身份认证"/"身份認證")
  // Supports: 简体 | 繁体 | English
  await waitFor(async () => {
    return await js(String.raw\`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => {
        const t = (b.innerText || '').trim();
        return t === '立即认证' || t === '立即認證' || t === 'Verify Now' ||
               (t.includes('立即') && (t.includes('认证') || t.includes('認證')));
      });
      if (btn) { btn.click(); return true; }
      return false;
    })()\`)
  }, 30000, 400)

  // Wait for Sumsub SDK to fetch access token and render iframe (takes ~5-8s)
  await wait(6)

  // 3.1 Wait for Sumsub iframe to render "Start verification" button
  // Supports: 简体 | 繁体 | English
  await waitFor(async () => {
    return await evalInSumsub(String.raw\`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText && (
        b.innerText.includes('开始验证') || b.innerText.includes('開始驗證') ||
        b.innerText.includes('Start verification') ||
        b.innerText.includes('在此处继续') || b.innerText.includes('在此處繼續') ||
        b.innerText.includes('Continue here') ||
        b.innerText.includes('同意') || b.innerText.includes('Agree')
      ));
      if (btn) { btn.click(); return true; }
      return false;
    })()\`)
  }, 30000, 600)

  // 3.1b After Start/Agree, Sumsub may show a secondary "Continue here" — poll for it
  await wait(1.2)
  await tryClickContinueHere(4, 0.6)

  // 3.2 Tax Country — click dropdown, type Germany, select option, confirm
  await waitFor(async () => {
    return await evalInSumsub(String.raw\`(() => {
      const btn = document.querySelector('button.select-wrapper') ||
        Array.from(document.querySelectorAll('button')).find(b => b.innerText && (
          b.innerText.includes('纳税居住国') || b.innerText.includes('納稅居住國') ||
          b.innerText.includes('Country') || b.innerText.includes('居住国') || b.innerText.includes('居住國')
        ));
      if (btn) { btn.click(); return true; }
      return false;
    })()\`)
  }, 20000, 250)

  await wait(0.4)
  await setSumsubCountryInput('德国')
  await wait(0.6)
  // Try 简体 first, fallback to 繁体, then English
  let germanyClicked = await clickGermanyOption()
  if (!germanyClicked) {
    await setSumsubCountryInput('德國')
    await wait(0.5)
    germanyClicked = await clickGermanyOption()
  }
  if (!germanyClicked) {
    await setSumsubCountryInput('Germany')
    await wait(0.5)
    await clickGermanyOption()
  }

  await wait(0.5)
  await evalInSumsub(String.raw\`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && (
      b.innerText.trim() === '继续' || b.innerText.trim() === '繼續' || b.innerText.includes('Continue')
    ));
    if (btn) btn.click();
  })()\`)

  // 3.3 Issuing Country & ID Card type selection
  await waitFor(async () => {
    const res = await evalInSumsub(String.raw\`(() => {
      const contBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.innerText.includes('在此处继续') || b.innerText.includes('在此處繼續') || b.innerText.includes('Continue here')
      );
      if (contBtn) { contBtn.click(); }

      const countryBtn = document.querySelector('button.select-wrapper');
      if (countryBtn &&
          !countryBtn.innerText.includes('德国') &&
          !countryBtn.innerText.includes('德國') &&
          !countryBtn.innerText.includes('Germany')) {
        countryBtn.click();
        return 'need-country';
      }

      const labels = Array.from(document.querySelectorAll('label, div, li'));
      const idLabel = labels.find(l => l.innerText && (
        l.innerText.trim() === '身份证' || l.innerText.trim() === '身份證' || l.innerText.trim() === 'ID card'
      ));
      if (idLabel) {
        idLabel.click();
        return true;
      }
      return false;
    })()\`)

    if (res === 'need-country') {
      await wait(0.4);
      await setSumsubCountryInput('德国');
      await wait(0.6);
      let clicked = await clickGermanyOption();
      if (!clicked) {
        await setSumsubCountryInput('德國');
        await wait(0.5);
        clicked = await clickGermanyOption();
      }
      if (!clicked) {
        await setSumsubCountryInput('Germany');
        await wait(0.5);
        await clickGermanyOption();
      }
      await wait(0.4);
      await evalInSumsub(String.raw\`(() => {
        const labels = Array.from(document.querySelectorAll('label, div, li'));
        const idLabel = labels.find(l => l.innerText && (
          l.innerText.trim() === '身份证' || l.innerText.trim() === '身份證' || l.innerText.trim() === 'ID card'
        ));
        if (idLabel) idLabel.click();
      })()\`);
      return true;
    }

    return res;
  }, 20000, 250)

  await wait(0.5)
  await evalInSumsub(String.raw\`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && (
      b.innerText.trim() === '继续' || b.innerText.trim() === '繼續' || b.innerText.includes('Continue')
    ));
    if (btn) btn.click();
  })()\`)

  // 3.4 Upload Front & Back ID — wait until both file inputs appear
  await waitFor(async () => {
    return await setSumsubFileInputs([fileFront, fileBack]);
  }, 20000, 400)

  // Give Sumsub time to process images before submit button becomes enabled
  await wait(3)

  // 3.5 Submit Level 1 — wait for button to be enabled then click
  await waitFor(async () => {
    return await evalInSumsub(String.raw\`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText && (
        b.innerText.trim() === '继续' || b.innerText.trim() === '繼續' ||
        b.innerText.includes('Continue') || b.innerText.includes('提交')
      ));
      if (btn && !btn.disabled) {
        btn.click();
        return true;
      }
      return false;
    })()\`);
  }, 20000, 400);

  await wait(2)

  // 3.6 Sync KYC Status with backend
  await serverFetch(baseUrl + '/wapi/user/kyc/v1/updateKycStatusToPending', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', '3world-token': token, platform: 'web' },
    body: JSON.stringify({ kycLevel: 1 })
  })

  // Poll for Level 1 approval (extended to 35s)
  await waitFor(async () => {
    const res = JSON.parse(await serverFetch(baseUrl + '/wapi/user/kyc/v1/getUserKycStatus', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', '3world-token': token, platform: 'web' }
    }))
    if (res.data?.kycLevel === "2" || (res.data?.kycLevel === "1" && res.data?.status === "5")) return true
    return false
  }, 35000, 500)

  cliLog('✓ [Phase 3 Done] Standard KYC Level 1 Approved in ' + ((Date.now() - t2)/1000).toFixed(2) + 's')

  if (targetLevel === 1) {
    cliLog('=================================================')
    cliLog('>>> SUCCESS! TOTAL DURATION: ' + ((Date.now() - totalStart)/1000).toFixed(2) + 's <<<')
    cliLog('Email: ' + email)
    cliLog('Phone: +852 ' + phone)
    cliLog('Password: ' + password)
    cliLog('UID: ' + userId)
    cliLog('=================================================')
    return
  }

  // ----------------------------------------------------
  // 4. ADVANCED KYC LEVEL 2 AUTOMATION
  // ----------------------------------------------------
  cliLog('>>> [4/4] Automating Advanced KYC Level 2...')
  const t3 = Date.now()
  await gotoAndWait(baseUrl + '/identity')
  await wait(2.5)

  // 4.1 Click "获得增强认证" / "Enhanced" button — 简体 | 繁体 | English
  await waitFor(async () => {
    return await js(String.raw\`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText && (
        b.innerText.includes('获得增强认证') || b.innerText.includes('獲得增強認證') ||
        b.innerText.includes('增强认证') || b.innerText.includes('增強認證') ||
        b.innerText.includes('Enhanced') ||
        b.innerText.includes('Upgrade') ||
        b.innerText.includes('升级认证') || b.innerText.includes('升級認證')
      ));
      if (btn) { btn.click(); return true; }
      return false;
    })()\`)
  }, 25000, 300)

  // 4.2 Wait for Sumsub iframe to load, click Start/Agree — 简体 | 繁体 | English
  await waitFor(async () => {
    return await evalInSumsub(String.raw\`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText && (
        b.innerText.includes('开始验证') || b.innerText.includes('開始驗證') ||
        b.innerText.includes('Start verification') ||
        b.innerText.includes('在此处继续') || b.innerText.includes('在此處繼續') ||
        b.innerText.includes('Continue here') ||
        b.innerText.includes('同意') || b.innerText.includes('Agree')
      ));
      if (btn) { btn.click(); return true; }
      return false;
    })()\`)
  }, 25000, 300)

  // 4.2b Poll for secondary "Continue here" after Start/Agree
  await wait(1.2)
  await tryClickContinueHere(4, 0.6)

  // 4.3 Upload address proof — wait until file input appears
  await waitFor(async () => {
    return await setSumsubFileInputs([fileAddress]);
  }, 20000, 400)

  // Give Sumsub time to process the image
  await wait(3)

  // 4.4 Wait for submit button to be enabled and click — 简体 | 繁体 | English
  await waitFor(async () => {
    return await evalInSumsub(String.raw\`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText && (
        b.innerText.trim() === '继续' || b.innerText.trim() === '繼續' ||
        b.innerText.includes('Continue') || b.innerText.includes('提交')
      ));
      if (btn && !btn.disabled) {
        btn.click();
        return true;
      }
      return false;
    })()\`);
  }, 20000, 400);

  await wait(2)

  // 4.5 Sync Level 2 status with backend
  await serverFetch(baseUrl + '/wapi/user/kyc/v1/updateKycStatusToPending', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', '3world-token': token, platform: 'web' },
    body: JSON.stringify({ kycLevel: 2 })
  })

  // Poll for Level 2 approval (extended to 35s)
  await waitFor(async () => {
    const res = JSON.parse(await serverFetch(baseUrl + '/wapi/user/kyc/v1/getUserKycStatus', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', '3world-token': token, platform: 'web' }
    }))
    if (res.data?.kycLevel === "2" && res.data?.status === "5") return true
    return false
  }, 35000, 500)

  cliLog('✓ [Phase 4 Done] Advanced KYC Level 2 Approved in ' + ((Date.now() - t3)/1000).toFixed(2) + 's')

  const totalSec = ((Date.now() - totalStart) / 1000).toFixed(2)
  cliLog('=================================================')
  cliLog('>>> SUCCESS! TOTAL DURATION: ' + totalSec + 's <<<')
  cliLog('Email: ' + email)
  cliLog('Phone: +852 ' + phone)
  cliLog('Password: ' + password)
  cliLog('UID: ' + userId)
  cliLog('=================================================')
} finally {
  try {
    await completeTaskSpace(task.id, { keep: false })
  } catch (_) {}
}
})()
`;

try {
  execSync(`ego-browser nodejs <<'EOF'\n${scriptContent}\nEOF`, { stdio: 'inherit' });
} catch (e) {
  process.exit(1);
}
