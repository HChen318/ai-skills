#!/usr/bin/env node

/**
 * Ultra-Fast Test Account & KYC Generator for 3World Dev Environment
 * Usage:
 *   node <path-to-skill>/scripts/fast-create-account.mjs [--level 0|1|2]
 * 
 * Target Levels:
 *   --level 0 : Pure API account registration + phone binding (~1.5 seconds)
 *   --level 1 : Standard KYC Level 1 (~18 seconds)
 *   --level 2 : Advanced KYC Level 2 (~35-45 seconds, default)
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
const email = 'turbo_' + randomNum + '@gmail.com'
const password = 'Password123!'
const phone = '9' + Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7)

async function waitFor(fn, timeoutMs = 25000, intervalMs = 250) {
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

// Helper to get active Sumsub iframe target
async function getActiveSumsubTarget() {
  const tabs = await listTabs()
  const currentTab = tabs.find(t => t.active) || tabs[0]
  const targets = await cdp('Target.getTargets')
  return targets.targetInfos.find(t => t.url.includes('sumsub.com') && t.type === 'iframe' && (t.parentId === currentTab?.targetId || !currentTab))
}

// Dynamically evaluate expression inside active Sumsub iframe session
async function evalInSumsub(expr) {
  const sumsub = await getActiveSumsubTarget()
  if (!sumsub) return null
  const { sessionId } = await cdp('Target.attachToTarget', { targetId: sumsub.targetId, flatten: true })
  const res = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId)
  return res?.result?.value
}

// Dynamically set file inputs inside active Sumsub iframe session
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
      await wait(0.4)
    }
    return true
  }
  return false
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

const bindRes = JSON.parse(await serverFetch(baseUrl + '/wapi/user/bindPhone', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', '3world-token': token, platform: 'web' },
  body: JSON.stringify({ phoneNumber: phone, areaCode: '+852', code: '123456' })
}))
const userInfo = bindRes.data
cliLog('✓ [Phase 1 Done] Account created & phone bound in ' + ((Date.now() - t0)/1000).toFixed(2) + 's (' + email + ', phone +852 ' + phone + ')')

if (targetLevel === 0) {
  cliLog('=================================================')
  cliLog('>>> SUCCESS! TOTAL DURATION: ' + ((Date.now() - totalStart)/1000).toFixed(2) + 's <<<')
  cliLog('Email: ' + email + ' | Password: ' + password)
  cliLog('Phone: +852 ' + phone)
  cliLog('KYC Level: 0 (Basic Registered & Phone Bound)')
  cliLog('=================================================')
  return
}

// ----------------------------------------------------
// 2. LAUNCH CLEAN TASK SPACE & AUTO-CLEANUP ON EXIT
// ----------------------------------------------------
// Clean up any stale worker spaces first
const existingSpaces = await listTaskSpaces()
for (const s of existingSpaces) {
  if (s.name && s.name.startsWith('3world-kyc-worker')) {
    try { await completeTaskSpace(s.id, { keep: false }); } catch (_) {}
  }
}

const task = await useOrCreateTaskSpace('3world-kyc-worker')

try {
  cliLog('>>> [2/4] Launching browser pre-authenticated to /identity...')
  const t1 = Date.now()
  await gotoAndWait(baseUrl + '/identity')

  await js(String.raw\`(() => {
    localStorage.setItem('3world-user-storage', JSON.stringify({
      state: { token: "\${token}", user: \${JSON.stringify(userInfo)} },
      version: 0
    }));
  })()\`)
  await gotoAndWait(baseUrl + '/identity')
  await wait(1.5)
  cliLog('✓ [Phase 2 Done] Pre-authenticated identity page loaded in ' + ((Date.now() - t1)/1000).toFixed(2) + 's')

  // ----------------------------------------------------
  // 3. STANDARD KYC LEVEL 1 AUTOMATION
  // ----------------------------------------------------
  cliLog('>>> [3/4] Automating Standard KYC Level 1...')
  const t2 = Date.now()

  // Wait for and click "立即认证"
  await waitFor(async () => {
    return await js(String.raw\`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('立即认证'));
      if (btn) { btn.click(); return true; }
      return false;
    })()\`);
  }, 20000, 300);

  // 3.1 Start / Agree
  await waitFor(async () => {
    return await evalInSumsub(String.raw\`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText && (
        b.innerText.includes('开始验证') ||
        b.innerText.includes('Start verification') ||
        b.innerText.includes('在此处继续') ||
        b.innerText.includes('Continue here') ||
        b.innerText.includes('同意') ||
        b.innerText.includes('Agree')
      ));
      if (btn) { btn.click(); return true; }
      return false;
    })()\`)
  }, 20000, 300)

  await wait(0.6)
  await evalInSumsub(String.raw\`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText && (
      b.innerText.includes('在此处继续') ||
      b.innerText.includes('Continue here') ||
      b.innerText.includes('同意并继续') ||
      b.innerText.includes('Agree and continue') ||
      b.innerText.includes('Continue') ||
      b.innerText.includes('继续')
    ));
    if (btn) btn.click();
  })()\`)

  // 3.2 Step 1/2: Select Tax Country = Germany
  await waitFor(async () => {
    return await evalInSumsub(String.raw\`(() => {
      const btn = document.querySelector('button.select-wrapper') || Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.includes('纳税居住国') || b.innerText.includes('Country') || b.innerText.includes('居住国')));
      if (btn) { btn.click(); return true; }
      return false;
    })()\`)
  }, 15000, 250)

  await waitFor(async () => {
    return await evalInSumsub(String.raw\`(() => {
      const input = document.querySelector('input');
      if (input) {
        input.value = '德国';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    })()\`)
  }, 10000, 200)

  await wait(0.4)
  await evalInSumsub(String.raw\`(() => {
    const btns = Array.from(document.querySelectorAll('button, li, div[role="option"]'));
    const deu = btns.find(b => b.innerText && (b.innerText.trim() === '德国' || b.innerText.includes('Germany')) && !b.className.includes('topbar'));
    if (deu) deu.click();
  })()\`)

  await wait(0.5)
  await evalInSumsub(String.raw\`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.trim() === '继续' || b.innerText.includes('Continue')));
    if (btn) btn.click();
  })()\`)

  // 3.3 Step 2/2: Select Issuing Country & ID Card
  await waitFor(async () => {
    const res = await evalInSumsub(String.raw\`(() => {
      const contBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('在此处继续') || b.innerText.includes('Continue here'));
      if (contBtn) { contBtn.click(); }

      const countryBtn = document.querySelector('button.select-wrapper');
      if (countryBtn && !countryBtn.innerText.includes('德国')) {
        countryBtn.click();
        return 'need-country';
      }

      const labels = Array.from(document.querySelectorAll('label, div, li'));
      const idLabel = labels.find(l => l.innerText && l.innerText.trim() === '身份证');
      if (idLabel) {
        idLabel.click();
        return true;
      }
      return false;
    })()\`)

    if (res === 'need-country') {
      await wait(0.4);
      await evalInSumsub(String.raw\`(() => {
        const input = document.querySelector('input');
        if (input) { input.value = '德国'; input.dispatchEvent(new Event('input', { bubbles: true })); }
      })()\`);
      await wait(0.4);
      await evalInSumsub(String.raw\`(() => {
        const btns = Array.from(document.querySelectorAll('button, li, div[role="option"]'));
        const deu = btns.find(b => b.innerText && (b.innerText.trim() === '德国' || b.innerText.includes('Germany')) && !b.className.includes('topbar'));
        if (deu) deu.click();
      })()\`);
      await wait(0.4);
      await evalInSumsub(String.raw\`(() => {
        const labels = Array.from(document.querySelectorAll('label, div, li'));
        const idLabel = labels.find(l => l.innerText && l.innerText.trim() === '身份证');
        if (idLabel) idLabel.click();
      })()\`);
      return true;
    }

    return res;
  }, 15000, 250)

  await wait(0.5)
  await evalInSumsub(String.raw\`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.trim() === '继续' || b.innerText.includes('Continue')));
    if (btn) btn.click();
  })()\`)

  // 3.4 Upload Front & Back ID
  await waitFor(async () => {
    return await setSumsubFileInputs([fileFront, fileBack]);
  }, 15000, 300)

  // 3.5 Wait for submit button to be enabled and click
  await waitFor(async () => {
    return await evalInSumsub(String.raw\`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText && (b.innerText.trim() === '继续' || b.innerText.includes('Continue') || b.innerText.includes('提交')));
      if (btn && !btn.disabled) {
        btn.click();
        return true;
      }
      return false;
    })()\`);
  }, 15000, 300);

  await wait(2)

  // 3.6 Sync KYC Status with backend
  await serverFetch(baseUrl + '/wapi/user/kyc/v1/updateKycStatusToPending', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', '3world-token': token, platform: 'web' },
    body: JSON.stringify({ kycLevel: 1 })
  })

  // Poll for Level 1 approval
  await waitFor(async () => {
    const res = JSON.parse(await serverFetch(baseUrl + '/wapi/user/kyc/v1/getUserKycStatus', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', '3world-token': token, platform: 'web' }
    }))
    if (res.data?.kycLevel === "2" || (res.data?.kycLevel === "1" && res.data?.status === "5")) return true
    return false
  }, 20000, 500)

  cliLog('✓ [Phase 3 Done] Standard KYC Level 1 Approved in ' + ((Date.now() - t2)/1000).toFixed(2) + 's')

  if (targetLevel === 1) {
    cliLog('=================================================')
    cliLog('>>> SUCCESS! TOTAL DURATION: ' + ((Date.now() - totalStart)/1000).toFixed(2) + 's <<<')
    cliLog('Email: ' + email + ' | Password: ' + password)
    cliLog('Phone: +852 ' + phone)
    cliLog('KYC Level: 1 (Standard Verified)')
    cliLog('=================================================')
    return
  }

  // ----------------------------------------------------
  // 4. ADVANCED KYC LEVEL 2 AUTOMATION
  // ----------------------------------------------------
  cliLog('>>> [4/4] Automating Advanced KYC Level 2...')
  const t3 = Date.now()
  await gotoAndWait(baseUrl + '/identity')
  await wait(1.5)

  // Wait for and click "获得增强认证"
  await waitFor(async () => {
    return await js(String.raw\`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.includes('获得增强认证') || b.innerText.includes('增强认证')));
      if (btn) { btn.click(); return true; }
      return false;
    })()\`);
  }, 20000, 300);

  // Click 开始验证 / 在此处继续
  await waitFor(async () => {
    return await evalInSumsub(String.raw\`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText && (
        b.innerText.includes('开始验证') ||
        b.innerText.includes('Start verification') ||
        b.innerText.includes('在此处继续') ||
        b.innerText.includes('Continue here') ||
        b.innerText.includes('同意') ||
        b.innerText.includes('Agree')
      ));
      if (btn) { btn.click(); return true; }
      return false;
    })()\`)
  }, 20000, 300)

  // Upload address proof
  await waitFor(async () => {
    return await setSumsubFileInputs([fileAddress]);
  }, 15000, 300)

  // Wait for submit button to be enabled and click
  await waitFor(async () => {
    return await evalInSumsub(String.raw\`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText && (b.innerText.trim() === '继续' || b.innerText.includes('Continue') || b.innerText.includes('提交')));
      if (btn && !btn.disabled) {
        btn.click();
        return true;
      }
      return false;
    })()\`);
  }, 15000, 300);

  await wait(2)

  // Sync Level 2 status with backend
  await serverFetch(baseUrl + '/wapi/user/kyc/v1/updateKycStatusToPending', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', '3world-token': token, platform: 'web' },
    body: JSON.stringify({ kycLevel: 2 })
  })

  // Poll for Level 2 approval
  await waitFor(async () => {
    const res = JSON.parse(await serverFetch(baseUrl + '/wapi/user/kyc/v1/getUserKycStatus', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', '3world-token': token, platform: 'web' }
    }))
    if (res.data?.kycLevel === "2" && res.data?.status === "5") return true
    return false
  }, 20000, 500)

  cliLog('✓ [Phase 4 Done] Advanced KYC Level 2 Approved in ' + ((Date.now() - t3)/1000).toFixed(2) + 's')

  // Final details
  const detailsRes = JSON.parse(await serverFetch(baseUrl + '/wapi/user/kyc/v1/getUserKycDetails', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', '3world-token': token, platform: 'web' }
  }))

  const totalSec = ((Date.now() - totalStart) / 1000).toFixed(2)
  cliLog('=================================================')
  cliLog('>>> SUCCESS! TOTAL DURATION: ' + totalSec + 's <<<')
  cliLog('Email: ' + email + ' | Password: ' + password)
  cliLog('Phone: +852 ' + phone)
  cliLog('KYC Level: ' + detailsRes.data?.kycLevel + ' (Status: ' + detailsRes.data?.status + ' - Advanced Verified)')
  cliLog('Crypto Limit: ' + detailsRes.data?.cryptoDepositLimit + ' / ' + detailsRes.data?.cryptoWithdrawalLimit + ' USDT')
  cliLog('=================================================')
} finally {
  // Guaranteed cleanup of task space on completion or failure
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
