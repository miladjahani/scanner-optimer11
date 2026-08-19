import { getWorkerUrl } from '../workerApi';

export async function pingSingleIp(ip, timeoutMs = 2500) {
  const worker = getWorkerUrl();

  // 1. If Worker is available, use real edge TCP probe
  if (worker) {
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`${worker}/api/probe?ip=${ip}&port=443`, { signal: controller.signal });
      clearTimeout(tid);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.latency !== null) {
          return { ip, latency: data.latency, status: 'ok' };
        }
      }
    } catch {}
  }

  // 2. Browser HTTP Port 80 Probe (avoids raw IP SSL cert mismatch)
  const start = performance.now();
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeoutMs);

    await fetch(`http://${ip}/cdn-cgi/trace?_t=${Date.now()}`, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(tid);
    const latency = Math.round(performance.now() - start);
    return { ip, latency, status: 'ok' };
  } catch {
    // 3. Fallback on down endpoint
    try {
      const start2 = performance.now();
      const controller2 = new AbortController();
      const tid2 = setTimeout(() => controller2.abort(), timeoutMs);
      await fetch(`https://${ip}/__down`, {
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller2.signal
      });
      clearTimeout(tid2);
      const latency2 = Math.round(performance.now() - start2);
      return { ip, latency: latency2, status: 'ok' };
    } catch {
      return { ip, latency: null, status: 'error' };
    }
  }
}

export async function pingNodeHost(node, timeoutMs = 3000) {
  const host = node.address || node.host || node.sni;
  if (!host || host === 'unknown') return { latency: null, status: 'error' };

  const worker = getWorkerUrl();
  if (worker) {
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`${worker}/api/probe?ip=${encodeURIComponent(host)}&port=${node.port || 443}`, { signal: controller.signal });
      clearTimeout(tid);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.latency !== null) {
          return { latency: data.latency, status: 'ok' };
        }
      }
    } catch {}
  }

  const start = performance.now();
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeoutMs);
    await fetch(`https://${host}/cdn-cgi/trace?_t=${Date.now()}`, {
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(tid);
    return { latency: Math.round(performance.now() - start), status: 'ok' };
  } catch {
    return { latency: null, status: 'error' };
  }
}

export async function testIpMultiRound(ip, rounds = 3, timeoutMs = 2000) {
  const latencies = [];
  let success = 0;

  for (let i = 0; i < rounds; i++) {
    const res = await pingSingleIp(ip, timeoutMs);
    if (res.status === 'ok' && res.latency !== null) {
      latencies.push(res.latency);
      success++;
    }
  }

  const loss = Math.round(((rounds - success) / rounds) * 100);
  const avg = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null;
  const min = latencies.length ? Math.min(...latencies) : null;
  const max = latencies.length ? Math.max(...latencies) : null;
  const jitter = (min !== null && max !== null) ? max - min : 0;

  return {
    ip,
    latency: avg,
    minLatency: min,
    maxLatency: max,
    jitter,
    loss,
    status: success > 0 ? 'ok' : 'error'
  };
}
