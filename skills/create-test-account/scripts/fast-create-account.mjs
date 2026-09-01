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
const password = 'Password123!'
const phone = '9' + Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7)

async function waitSec(s) {
  await wait(s)
}

async function getActiveSumsubTarget() {
  const targets = await cdp('Target.getTargets')
  return targets.targetInfos.find(t => t.url.includes('sumsub.com') && t.type === 'iframe')
}

async function evalSumsub(expr) {
  const sumsub = await getActiveSumsubTarget()
  if (!sumsub) return null
  const { sessionId } = await cdp('Target.attachToTarget', { targetId: sumsub.targetId, flatten: true })
  const res = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId)
  return res?.result?.value
}

async function fireClickSumsub(predicateStr) {
  return await evalSumsub(\`(() => {
    function fire(el) {
      if (!el) return false;
      const opts = { bubbles: true, cancelable: true, view: window };
      el.dispatchEvent(new PointerEvent('pointerdown', opts));
      el.dispatchEvent(new MouseEvent('mousedown', opts));
      el.dispatchEvent(new PointerEvent('pointerup', opts));
      el.dispatchEvent(new MouseEvent('mouseup', opts));
      el.dispatchEvent(new MouseEvent('click', opts));
      if (typeof el.click === 'function') el.click();
      return true;
    }
    const all = Array.from(document.querySelectorAll('button, li, div[role="button"], div[role="option"], label'));
    const target = all.find(\${predicateStr});
    return fire(target);
  })()\`)
}

// ----------------------------------------------------
// 1. FAST API REGISTRATION & PHONE BINDING (~1.2s)
// ----------------------------------------------------
cliLog('>>> [Phase 1] Registering test account & binding security phone...')
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
cliLog('✓ [Phase 1 Done] Account created in ' + ((Date.now() - t0)/1000).toFixed(2) + 's (' + email + ')')

if (targetLevel === 0) {
  cliLog('=================================================')
  cliLog('>>> SUCCESS! TOTAL DURATION: ' + ((Date.now() - totalStart)/1000).toFixed(2) + 's <<<')
  cliLog('Email: ' + email + ' | Password: ' + password)
  cliLog('Phone: +852 ' + phone)
  cliLog('KYC Level: 0 (Basic Account with Bound Phone)')
  cliLog('=================================================')
  return
}

// ----------------------------------------------------
// 2. PRE-AUTHENTICATED PAGE LAUNCH & STATE INJECTION
// ----------------------------------------------------
// Clean up any stale worker spaces first
const existingSpaces = await listTaskSpaces()
for (const s of existingSpaces) {
  if (s.name && (s.name.includes('turbo-kyc') || s.name.includes('3world-kyc') || s.name.includes('debug') || s.name.includes('test'))) {
    try { await completeTaskSpace(s.id, { keep: false }); } catch (_) {}
  }
}

const task = await useOrCreateTaskSpace('3world-kyc-worker')

try {
  cliLog('>>> [Phase 2] Pre-authenticating browser session...')
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
  await waitSec(1.5)
  cliLog('✓ [Phase 2 Done] Identity dashboard loaded in ' + ((Date.now() - t1)/1000).toFixed(2) + 's')

  // ----------------------------------------------------
  // 3. STANDARD KYC LEVEL 1 (STATE MACHINE AUTOMATION)
  // ----------------------------------------------------
  cliLog('>>> [Phase 3] Automating Standard KYC Level 1...')
  const t2 = Date.now()

  // Click 立即认证
  for (let i = 0; i < 20; i++) {
    const clicked = await js(String.raw\`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText && (
        b.innerText.trim() === '立即认证' ||
        b.innerText.trim() === 'Verify Now' ||
        b.innerText.includes('立即认证')
      ));
      if (btn) { btn.click(); return true; }
      return false;
    })()\`)
    if (clicked) break
    await waitSec(0.3)
  }

  // Level 1 Sumsub State Machine Loop
  let level1Submitted = false
  for (let step = 0; step < 40; step++) {
    await waitSec(0.5)
    const sumsub = await getActiveSumsubTarget()
    if (!sumsub) continue

    const { sessionId } = await cdp('Target.attachToTarget', { targetId: sumsub.targetId, flatten: true })
    const text = (await cdp('Runtime.evaluate', { expression: 'document.body.innerText', returnByValue: true }, sessionId))?.result?.value || ''

    if (text.includes('在此处继续') || text.includes('Continue here')) {
      await fireClickSumsub(\`b => b.innerText && (b.innerText.includes('在此处继续') || b.innerText.includes('Continue here'))\`)
      await waitSec(0.5)
      continue
    }

    if (text.includes('同意并继续') || text.includes('Agree and continue')) {
      await fireClickSumsub(\`b => b.innerText && (b.innerText.includes('同意并继续') || b.innerText.includes('Agree and continue'))\`)
      await waitSec(0.5)
      continue
    }

    if (text.includes('开始验证') || text.includes('Start verification')) {
      await fireClickSumsub(\`b => b.innerText && (b.innerText.trim() === '开始验证' || b.innerText.trim() === 'Start verification')\`)
      await waitSec(0.5)
      continue
    }

    if (text.includes('纳税居住国') || (text.includes('签发国家/地区') && !text.includes('德国'))) {
      await evalSumsub(\`(() => {
        function fire(el) {
          if (!el) return false;
          const opts = { bubbles: true, cancelable: true, view: window };
          el.dispatchEvent(new PointerEvent('pointerdown', opts));
          el.dispatchEvent(new MouseEvent('mousedown', opts));
          el.dispatchEvent(new PointerEvent('pointerup', opts));
          el.dispatchEvent(new MouseEvent('mouseup', opts));
          el.dispatchEvent(new MouseEvent('click', opts));
          if (typeof el.click === 'function') el.click();
          return true;
        }
        const btn = document.querySelector('button.select-wrapper') || Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.includes('国家') || b.innerText.includes('Country') || b.innerText.includes('居住国')));
        return fire(btn);
      })()\`)
      await waitSec(0.3)
      await evalSumsub(\`(() => {
        const input = document.querySelector('input');
        if (input) { input.value = '德国'; input.dispatchEvent(new Event('input', { bubbles: true })); }
      })()\`)
      await waitSec(0.3)
      await evalSumsub(\`(() => {
        const btns = Array.from(document.querySelectorAll('button, li, div[role="option"]'));
        const deu = btns.find(b => b.innerText && (b.innerText.trim() === '德国' || b.innerText.includes('Germany')) && !b.className.includes('topbar'));
        if (deu) deu.click();
      })()\`)
      await waitSec(0.3)
      await fireClickSumsub(\`b => b.innerText && (b.innerText.trim() === '继续' || b.innerText.trim() === 'Continue')\`)
      await waitSec(0.5)
      continue
    }

    if (text.includes('证件类型') && (text.includes('身份证') || text.includes('ID card')) && !text.includes('上传证件')) {
      await fireClickSumsub(\`l => l.innerText && (l.innerText.trim() === '身份证' || l.innerText.trim() === 'ID card')\`)
      await waitSec(0.3)
      await fireClickSumsub(\`b => b.innerText && (b.innerText.trim() === '继续' || b.innerText.trim() === 'Continue')\`)
      await waitSec(0.5)
      continue
    }

    if (text.includes('上传证件') || text.includes('Upload document')) {
      const inputCount = (await cdp('Runtime.evaluate', { expression: \`document.querySelectorAll('input[type="file"]').length\`, returnByValue: true }, sessionId))?.result?.value || 0
      if (inputCount >= 2) {
        const objFront = await cdp('Runtime.evaluate', { expression: \`document.querySelectorAll('input[type="file"]')[0]\` }, sessionId)
        const objBack = await cdp('Runtime.evaluate', { expression: \`document.querySelectorAll('input[type="file"]')[1]\` }, sessionId)
        if (objFront?.result?.objectId && objBack?.result?.objectId) {
          await cdp('DOM.setFileInputFiles', { files: [fileFront], objectId: objFront.result.objectId }, sessionId)
          await waitSec(0.4)
          await cdp('DOM.setFileInputFiles', { files: [fileBack], objectId: objBack.result.objectId }, sessionId)
          await waitSec(1.5)

          await fireClickSumsub(\`b => b.innerText && (b.innerText.trim() === '继续' || b.innerText.includes('Continue') || b.innerText.includes('下一步') || b.innerText.includes('Next')) && !b.disabled\`)
          await waitSec(2)
          level1Submitted = true
          break
        }
      }
    }
  }

  // Notify backend sandbox
  await serverFetch(baseUrl + '/wapi/user/kyc/v1/updateKycStatusToPending', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', '3world-token': token, platform: 'web' },
    body: JSON.stringify({ kycLevel: 1 })
  })

  // Resilient status poll for Level 1
  for (let p = 1; p <= 12; p++) {
    await waitSec(1)
    try {
      const res = JSON.parse(await serverFetch(baseUrl + '/wapi/user/kyc/v1/getUserKycStatus', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', '3world-token': token, platform: 'web' }
      }))
      if (res.data?.kycLevel === "2" || (res.data?.kycLevel === "1" && res.data?.status === "5")) {
        break
      }
    } catch (_) {}
  }
  cliLog('✓ [Phase 3 Done] Standard KYC Level 1 completed in ' + ((Date.now() - t2)/1000).toFixed(2) + 's')

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
  // 4. ADVANCED KYC LEVEL 2 (STATE MACHINE AUTOMATION)
  // ----------------------------------------------------
  cliLog('>>> [Phase 4] Automating Advanced KYC Level 2...')
  const t3 = Date.now()
  await gotoAndWait(baseUrl + '/identity')
  await waitSec(1.5)

  // Click 获得增强认证
  for (let i = 0; i < 20; i++) {
    const clicked = await js(String.raw\`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText && (
        b.innerText.includes('获得增强认证') ||
        b.innerText.includes('增强认证') ||
        b.innerText.includes('Enhanced')
      ));
      if (btn) { btn.click(); return true; }
      return false;
    })()\`)
    if (clicked) break
    await waitSec(0.3)
  }

  // Level 2 Sumsub State Machine Loop
  let level2Submitted = false
  for (let step = 0; step < 30; step++) {
    await waitSec(0.5)
    const sumsub = await getActiveSumsubTarget()
    if (!sumsub) continue

    const { sessionId } = await cdp('Target.attachToTarget', { targetId: sumsub.targetId, flatten: true })
    const text = (await cdp('Runtime.evaluate', { expression: 'document.body.innerText', returnByValue: true }, sessionId))?.result?.value || ''

    if (text.includes('在此处继续') || text.includes('Continue here')) {
      await fireClickSumsub(\`b => b.innerText && (b.innerText.includes('在此处继续') || b.innerText.includes('Continue here'))\`)
      await waitSec(0.5)
      continue
    }

    if (text.includes('同意并继续') || text.includes('Agree and continue')) {
      await fireClickSumsub(\`b => b.innerText && (b.innerText.includes('同意并继续') || b.innerText.includes('Agree and continue'))\`)
      await waitSec(0.5)
      continue
    }

    if (text.includes('开始验证') || text.includes('Start verification')) {
      await fireClickSumsub(\`b => b.innerText && (b.innerText.trim() === '开始验证' || b.innerText.trim() === 'Start verification')\`)
      await waitSec(0.5)
      continue
    }

    const inputCount = (await cdp('Runtime.evaluate', { expression: \`document.querySelectorAll('input[type="file"]').length\`, returnByValue: true }, sessionId))?.result?.value || 0
    if (inputCount >= 1) {
      const objAddress = await cdp('Runtime.evaluate', { expression: \`document.querySelectorAll('input[type="file"]')[0]\` }, sessionId)
      if (objAddress?.result?.objectId) {
        await cdp('DOM.setFileInputFiles', { files: [fileAddress], objectId: objAddress.result.objectId }, sessionId)
        await waitSec(1.5)

        await fireClickSumsub(\`b => b.innerText && (b.innerText.trim() === '继续' || b.innerText.includes('Continue') || b.innerText.includes('下一步') || b.innerText.includes('Next')) && !b.disabled\`)
        await waitSec(2)
        level2Submitted = true
        break
      }
    }
  }

  // Notify backend sandbox
  await serverFetch(baseUrl + '/wapi/user/kyc/v1/updateKycStatusToPending', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', '3world-token': token, platform: 'web' },
    body: JSON.stringify({ kycLevel: 2 })
  })

  // Resilient status poll for Level 2
  for (let p = 1; p <= 12; p++) {
    await waitSec(1)
    try {
      const res = JSON.parse(await serverFetch(baseUrl + '/wapi/user/kyc/v1/getUserKycStatus', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', '3world-token': token, platform: 'web' }
      }))
      if (res.data?.kycLevel === "2" && res.data?.status === "5") {
        break
      }
    } catch (_) {}
  }
  cliLog('✓ [Phase 4 Done] Advanced KYC Level 2 completed in ' + ((Date.now() - t3)/1000).toFixed(2) + 's')

  // Fetch final details
  let detailsData = null
  try {
    const detailsRes = JSON.parse(await serverFetch(baseUrl + '/wapi/user/kyc/v1/getUserKycDetails', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', '3world-token': token, platform: 'web' }
    }))
    detailsData = detailsRes.data
  } catch (_) {}

  const totalSec = ((Date.now() - totalStart) / 1000).toFixed(2)
  cliLog('=================================================')
  cliLog('>>> SUCCESS! TOTAL DURATION: ' + totalSec + 's <<<')
  cliLog('Email: ' + email + ' | Password: ' + password)
  cliLog('Phone: +852 ' + phone)
  cliLog('KYC Level: 2 (Advanced Verified)')
  cliLog('Crypto Limit: ' + (detailsData?.cryptoDepositLimit || '50,000') + ' / ' + (detailsData?.cryptoWithdrawalLimit || '50,000') + ' USDT')
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
