export async function testDownloadSpeed(ip, downloadBytes = 10000000, timeoutMs = 12000) {
  const start = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`https://${ip}/__down?bytes=${downloadBytes}`, {
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const duration = (performance.now() - start) / 1000;
    const mbps = ((downloadBytes * 8) / (1024 * 1024 * duration)).toFixed(2);
    const mBps = (downloadBytes / (1024 * 1024 * duration)).toFixed(2);
    return { ip, speedMbps: parseFloat(mbps), speedMBs: parseFloat(mBps), status: 'ok' };
  } catch {
    clearTimeout(timeoutId);
    return { ip, speedMbps: 0, speedMBs: 0, status: 'error' };
  }
}
