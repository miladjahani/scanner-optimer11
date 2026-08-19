import { ref, computed } from 'vue';
import { testIpMultiRound } from '../utils/scanner/scannerEngine';
import { testDownloadSpeed } from '../utils/scanner/speedtest';
import { generateRandomCloudflareIps } from '../utils/scanner/ipPool';

export function useScanner() {
  const rawIpsInput = ref('');
  const concurrency = ref(8);
  const timeoutMs = ref(2500);
  const isScanning = ref(false);
  const shouldStop = ref(false);
  const results = ref([]);
  const scanProgress = ref({ current: 0, total: 0 });
  const onlyHealthy = ref(true);

  const healthyCount = computed(() => results.value.filter(r => r.status === 'ok').length);
  const failedCount = computed(() => results.value.filter(r => r.status === 'error').length);

  const displayResults = computed(() => {
    let list = [...results.value];
    if (onlyHealthy.value) {
      list = list.filter(r => r.status === 'ok');
    }
    return list.sort((a, b) => {
      if (a.latency === null && b.latency === null) return 0;
      if (a.latency === null) return 1;
      if (b.latency === null) return -1;
      return a.latency - b.latency;
    });
  });

  const startScan = async () => {
    const ips = rawIpsInput.value.split('\n').map(i => i.trim()).filter(Boolean);
    if (!ips.length) return;

    isScanning.value = true;
    shouldStop.value = false;
    results.value = ips.map(ip => ({ ip, latency: null, jitter: 0, status: 'testing' }));
    scanProgress.value = { current: 0, total: ips.length };

    const threadCount = concurrency.value;
    let idx = 0;

    async function worker() {
      while (idx < ips.length) {
        if (shouldStop.value) break;
        const targetIdx = idx++;
        const ip = ips[targetIdx];
        const res = await testIpMultiRound(ip, 2, timeoutMs.value);
        results.value[targetIdx] = res;
        scanProgress.value.current++;
      }
    }

    const pool = Array.from({ length: Math.min(threadCount, ips.length) }, () => worker());
    await Promise.all(pool);
    isScanning.value = false;
  };

  const stopScan = () => {
    shouldStop.value = true;
    isScanning.value = false;
  };

  const runSpeed = async (item) => {
    item.speedTesting = true;
    const res = await testDownloadSpeed(item.ip, 5000000, 8000);
    item.speedMbps = res.speedMbps;
    item.speedTesting = false;
  };

  return {
    rawIpsInput,
    concurrency,
    timeoutMs,
    isScanning,
    results,
    scanProgress,
    onlyHealthy,
    healthyCount,
    failedCount,
    displayResults,
    startScan,
    stopScan,
    runSpeed
  };
}
