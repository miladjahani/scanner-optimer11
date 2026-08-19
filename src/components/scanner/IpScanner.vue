<template>
  <div class="scanner-suite">
    <div class="card-header">
      <h3>🧪 اسکنر قدرتمند چند هزارتایی آی‌پی کلودفلر (Clean IP Scanner Pro)</h3>
      <p class="desc">بارگذاری مخزن ۳,۸۰۰+ آی‌پی، تست پینگ موازی، محاسبه تاخیر، جیتر، پکت‌لاس و تست سرعت دانلود</p>
    </div>

    <!-- Pool and Preset Selector -->
    <div class="card pool-card">
      <div class="selector-header">
        <span>مخزن و رنج‌های آی‌پی:</span>
        <span class="pool-count font-mono text-cyan">{{ currentPoolCount.toLocaleString() }} آی‌پی آماده</span>
      </div>
      <div class="chip-row">
        <button @click="loadLargePool" class="chip-btn highlight">
          🌐 بارگذاری مخزن ۳,۸۰۰+ آی‌پی
        </button>
        <button @click="generateRandomSample(100)" class="chip-btn">
          🎲 تولید ۱۰۰ آی‌پی تصادفی
        </button>
        <button @click="generateRandomSample(500)" class="chip-btn">
          🎲 تولید ۵۰۰ آی‌پی تصادفی
        </button>
        <button @click="generateRandomSample(1500)" class="chip-btn">
          🎲 تولید ۱,۵۰۰ آی‌پی تصادفی
        </button>
        <button @click="loadOperatorPreset('mci')" class="chip-btn">همراه اول (MCI)</button>
        <button @click="loadOperatorPreset('mtn')" class="chip-btn">ایرانسل (MTN)</button>
        <button @click="loadOperatorPreset('rightel')" class="chip-btn">رایتل (Rightel)</button>
        <button @click="loadOperatorPreset('tci')" class="chip-btn">مخابرات و شاتل</button>
      </div>
    </div>

    <!-- Scanner Config -->
    <div class="scanner-controls-grid">
      <div class="form-group card">
        <label>لیست آی‌پی‌های هدف برای اسکن:</label>
        <textarea 
          v-model="rawIpsInput" 
          rows="5" 
          class="textarea-box font-mono" 
          placeholder="104.16.1.1&#10;172.64.1.1&#10;162.158.1.1"
        ></textarea>
      </div>

      <div class="config-side card">
        <div class="grid-2">
          <div class="form-group">
            <label>تعداد تِردهای موازی:</label>
            <select v-model="concurrency" class="input-box">
              <option :value="4">4 تِرد (پایدار)</option>
              <option :value="8">8 تِرد (پیش‌فرض)</option>
              <option :value="16">16 تِرد (سریع)</option>
              <option :value="32">32 تِرد (فوق‌سریع)</option>
            </select>
          </div>
          <div class="form-group">
            <label>تایم‌اوت پینگ (میلی‌ثانیه):</label>
            <select v-model="timeoutMs" class="input-box">
              <option :value="1500">1.5 ثانیه</option>
              <option :value="2500">2.5 ثانیه</option>
              <option :value="4000">4.0 ثانیه</option>
            </select>
          </div>
        </div>

        <div class="action-btn-row">
          <button @click="startScan" :disabled="isScanning" class="btn primary">
            <span v-if="isScanning" class="spinner"></span>
            {{ isScanning ? `در حال اسکن (${scanProgress.current}/${scanProgress.total})...` : '🚀 شروع اسکن موازی' }}
          </button>
          <button v-if="isScanning" @click="stopScan" class="btn danger">توقف</button>
          <button v-if="results.length" @click="exportResultsCsv" class="btn secondary">دانلود خروجی CSV</button>
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div v-if="isScanning" class="progress-bar-wrap">
      <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
    </div>

    <!-- Results Table -->
    <div v-if="results.length" class="results-box card">
      <div class="results-header">
        <div class="stats">
          <span>کل: <b>{{ results.length }}</b></span>
          <span>سالم: <b class="text-green">{{ healthyCount }}</b></span>
          <span>ناموفق: <b class="text-red">{{ failedCount }}</b></span>
        </div>
        <div class="filter-speed-options">
          <label>
            <input type="checkbox" v-model="onlyHealthy" /> فقط آی‌پی‌های پاسخ‌داده
          </label>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>آدرس IP</th>
              <th>میانگین تاخیر</th>
              <th>جیتر (Jitter)</th>
              <th>وضعیت</th>
              <th>تست سرعت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in displayResults" :key="item.ip">
              <td>{{ idx + 1 }}</td>
              <td class="font-mono text-cyan font-bold">{{ item.ip }}</td>
              <td class="font-mono">
                <span v-if="item.latency !== null" :class="getLatencyClass(item.latency)">
                  {{ item.latency }} ms
                </span>
                <span v-else-if="item.status === 'testing'" class="text-yellow">تست...</span>
                <span v-else class="text-red">Timeout</span>
              </td>
              <td class="font-mono text-muted">
                {{ item.jitter !== undefined ? item.jitter + ' ms' : '-' }}
              </td>
              <td>
                <span :class="['badge', item.status]">
                  {{ item.status === 'ok' ? 'سالم' : item.status === 'testing' ? 'تست' : 'ناموفق' }}
                </span>
              </td>
              <td>
                <span v-if="item.speedMbps" class="text-green font-bold">{{ item.speedMbps }} MB/s</span>
                <button v-else-if="item.status === 'ok'" @click="runSpeedTest(item)" :disabled="item.speedTesting" class="btn small secondary">
                  {{ item.speedTesting ? '...' : 'تست سرعت' }}
                </button>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <button @click="$emit('select-clean-ip', item.ip)" class="btn small primary">
                  انتقال به بهینه‌ساز
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { generateRandomCloudflareIps } from '../../utils/scanner/ipPool';
import { testIpMultiRound } from '../../utils/scanner/scannerEngine';
import { testDownloadSpeed } from '../../utils/scanner/speedtest';

const emit = defineEmits(['select-clean-ip']);

const rawIpsInput = ref('');
const concurrency = ref(8);
const timeoutMs = ref(2500);
const isScanning = ref(false);
const shouldStop = ref(false);
const results = ref([]);
const scanProgress = ref({ current: 0, total: 0 });
const onlyHealthy = ref(true);

const largePoolIps = ref([]);
const operatorPresets = ref({});

onMounted(async () => {
  try {
    const res = await fetch('./data/cloudflare-ips.json');
    const data = await res.json();
    largePoolIps.value = data.ips || [];
  } catch {
    largePoolIps.value = generateRandomCloudflareIps(500);
  }

  try {
    const opRes = await fetch('./data/operator-presets.json');
    operatorPresets.value = await opRes.json();
  } catch {}

  loadLargePool();
});

const currentPoolCount = computed(() => {
  return rawIpsInput.value.split('\n').filter(i => i.trim().length > 0).length;
});

const progressPercent = computed(() => {
  if (!scanProgress.value.total) return 0;
  return Math.round((scanProgress.value.current / scanProgress.value.total) * 100);
});

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

const loadLargePool = () => {
  rawIpsInput.value = largePoolIps.value.slice(0, 1000).join('\n');
};

const generateRandomSample = (count) => {
  rawIpsInput.value = generateRandomCloudflareIps(count).join('\n');
};

const loadOperatorPreset = (key) => {
  if (operatorPresets.value[key]) {
    rawIpsInput.value = operatorPresets.value[key].ips.join('\n');
  }
};

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

const runSpeedTest = async (item) => {
  item.speedTesting = true;
  const res = await testDownloadSpeed(item.ip, 5000000, 8000);
  item.speedMbps = res.speedMbps;
  item.speedTesting = false;
};

const exportResultsCsv = () => {
  const rows = [['IP', 'Latency (ms)', 'Jitter (ms)', 'Status', 'Speed (MB/s)']];
  displayResults.value.forEach(r => {
    rows.push([r.ip, r.latency || '', r.jitter || '', r.status, r.speedMbps || '']);
  });
  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `cloudflare_clean_ips_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getLatencyClass = (lat) => {
  if (lat < 130) return 'text-green font-bold';
  if (lat < 220) return 'text-yellow';
  return 'text-red';
};
</script>

<style scoped>
.scanner-suite {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pool-card {
  padding: 14px;
}
.selector-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 10px;
  color: #cbd5e1;
}
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip-btn {
  background: #1e293b;
  color: #cbd5e1;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s;
}
.chip-btn:hover { background: #334155; color: #fff; }
.chip-btn.highlight { border-color: var(--accent-cyan); color: var(--accent-cyan); font-weight: bold; }

.scanner-controls-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 14px;
}
@media (max-width: 768px) {
  .scanner-controls-grid { grid-template-columns: 1fr; }
}

.config-side {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.action-btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.progress-bar-wrap {
  width: 100%;
  height: 6px;
  background: #1e293b;
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #0284c7, #38bdf8);
  transition: width 0.3s ease;
}

.results-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 0.85rem;
}
.stats { display: flex; gap: 14px; }
.filter-speed-options { font-size: 0.8rem; color: #cbd5e1; }
</style>
