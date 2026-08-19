<template>
  <div class="optimizer-suite">
    <div class="card-header">
      <h3>⚡ بهینه‌ساز جامع کانکشن کلودفلر (CF-Optimizer Master Hub)</h3>
      <p class="desc">مرکز اصلی برنامه: تزریق دسته‌ای آی‌پی و پورت تمیز، پکت‌های فرگمنت ضد DPI، تست پینگ زنده و صدور خروجی چندگانه</p>
    </div>

    <!-- Operator Clean IP Matrix -->
    <CleanIpMatrix 
      :presets="operatorPresets" 
      @select-ip="handleMatrixSelect" 
    />

    <!-- Main Configuration Panel -->
    <div class="card">
      <div class="grid-3">
        <div class="form-group">
          <label>آی‌پی یا دامنه تمیز هدف (Clean IP / Domain):</label>
          <input 
            v-model="cleanIp" 
            placeholder="مثلاً: 104.16.1.1 یا cf.domain.com" 
            class="input-box font-mono" 
          />
        </div>

        <div class="form-group">
          <label>پورت اتصال کلودفلر (Port):</label>
          <select v-model="cleanPort" class="input-box font-mono">
            <option value="">پیش‌فرض کانفیگ</option>
            <optgroup label="پورت‌های TLS / HTTPS">
              <option value="443">443 (استاندارد)</option>
              <option value="8443">8443</option>
              <option value="2053">2053</option>
              <option value="2083">2083</option>
              <option value="2087">2087</option>
              <option value="2096">2096</option>
            </optgroup>
            <optgroup label="پورت‌های Non-TLS / HTTP">
              <option value="80">80 (استاندارد)</option>
              <option value="8080">8080</option>
              <option value="8880">8880</option>
              <option value="2052">2052</option>
              <option value="2082">2082</option>
              <option value="2086">2086</option>
              <option value="2095">2095</option>
            </optgroup>
          </select>
        </div>

        <div class="form-group">
          <label>SNI / Host سفارشی (اختیاری):</label>
          <input 
            v-model="customSni" 
            placeholder="مثلاً: speed.cloudflare.com" 
            class="input-box font-mono" 
          />
        </div>
      </div>

      <!-- Fragment Lab Integration -->
      <div class="fragment-wrapper">
        <label class="toggle-wrap">
          <input type="checkbox" v-model="fragmentEnabled" />
          <span>🧪 فعال‌سازی آزمایشگاه فرگمنت (TLS Fragment Engine for DPI Bypass)</span>
        </label>
        <FragmentLab 
          v-if="fragmentEnabled" 
          v-model="fragmentConfig" 
        />
      </div>

      <!-- Prefix & Tag -->
      <div class="form-group">
        <label>پیشوند نام کانفیگ‌ها (Node Tag Prefix):</label>
        <input v-model="prefix" placeholder="[CF-Clean]" class="input-box" />
      </div>

      <!-- Input Configs Area -->
      <div class="form-group">
        <label>کانفیگ‌های ورودی (VLESS / VMess / Trojan / SS / Hysteria2 / TUIC / Clash / Singbox):</label>
        <textarea 
          v-model="inputNodes" 
          rows="5" 
          class="textarea-box font-mono" 
          placeholder="کانفیگ‌ها یا لینک سابسکریپشن را اینجا وارد کنید یا از تب سابسکریپشن بفرستید..."
        ></textarea>
      </div>

      <div class="btn-action-row">
        <button @click="executeOptimization" :disabled="!inputNodes.trim()" class="btn success">
          ⚡ اعمال بهینه‌سازی و بازتولید کانفیگ‌ها
        </button>
        <button @click="testAllOptimizedPings" :disabled="!optimizedNodes.length || testingPings" class="btn primary">
          <span v-if="testingPings" class="spinner"></span>
          {{ testingPings ? 'در حال تست پینگ...' : '📡 تست پینگ زنده تمام نودها' }}
        </button>
        <button @click="clearAll" class="btn secondary">پاکسازی</button>
      </div>
    </div>

    <!-- Output Section -->
    <div v-if="optimizedNodes.length" class="output-card card">
      <div class="output-top">
        <h4>🎉 نتایج بهینه‌شده ({{ optimizedNodes.length }} نود آماده):</h4>
        <div class="output-btns">
          <button @click="copyRaw" class="btn small primary">کپی متن خام</button>
          <button @click="copyBase64" class="btn small secondary">کپی Base64</button>
          <button @click="exportClashYaml" class="btn small secondary">Clash Meta (YAML)</button>
          <button @click="exportSingboxJson" class="btn small secondary">Sing-box (JSON)</button>
          <button @click="generateWorkerSubLink" class="btn small success">🔗 تولید لینک ساب Worker</button>
        </div>
      </div>

      <textarea 
        :value="currentOutputDisplay" 
        rows="6" 
        readonly 
        class="textarea-box font-mono output-area"
      ></textarea>

      <!-- Preview Cards List with Live Ping & QR -->
      <div class="nodes-list-preview">
        <div 
          v-for="(uri, idx) in optimizedNodes.slice(0, 15)" 
          :key="idx" 
          class="node-card-item card"
        >
          <div class="node-info font-mono">
            <span class="idx">#{{ idx + 1 }}</span>
            <span class="uri-text" :title="uri">{{ uri }}</span>
          </div>
          <div class="node-meta-row">
            <span v-if="pingResults[uri] !== undefined" :class="['ping-badge', getPingClass(pingResults[uri])]">
              {{ pingResults[uri] !== null ? pingResults[uri] + ' ms' : 'Timeout' }}
            </span>
            <button @click="testSinglePing(uri)" class="btn small secondary">تست پینگ</button>
            <button @click="handleOpenQr(uri)" class="btn small secondary">QR Code</button>
            <button @click="handleCopySingle(uri)" class="btn small primary">کپی</button>
          </div>
        </div>
        <p v-if="optimizedNodes.length > 15" class="more-hint text-muted">
          و {{ optimizedNodes.length - 15 }} نود دیگر در کادر متنی بالا موجود است...
        </p>
      </div>
    </div>

    <!-- QR Code Modal -->
    <QrCodeModal 
      :is-open="qrOpen" 
      :title="qrTitle" 
      :content="qrContent" 
      @close="qrOpen = false" 
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useOptimizer } from '../../composables/useOptimizer';
import { parseMultipleNodes, parseNode } from '../../utils/protocols';
import { toClashMeta } from '../../utils/converters/clash';
import { toSingbox } from '../../utils/converters/singbox';
import { pingNodeHost } from '../../utils/scanner/scannerEngine';
import CleanIpMatrix from './CleanIpMatrix.vue';
import FragmentLab from './FragmentLab.vue';
import QrCodeModal from '../common/QrCodeModal.vue';

const props = defineProps({
  initialCleanIp: String,
  initialNodes: String
});

const {
  cleanIp,
  cleanPort,
  customSni,
  prefix,
  inputNodes,
  optimizedNodes,
  fragmentEnabled,
  optimizedRaw,
  optimizedBase64,
  optimizeAll
} = useOptimizer();

const fragmentConfig = ref({ length: '10-50', interval: '10-20', packets: 'tlshello' });
const operatorPresets = ref({});
const activeFormat = ref('raw');
const customFormattedText = ref('');
const pingResults = ref({});
const testingPings = ref(false);

const qrOpen = ref(false);
const qrTitle = ref('');
const qrContent = ref('');

onMounted(async () => {
  try {
    const res = await fetch('./data/operator-presets.json');
    operatorPresets.value = await res.json();
  } catch {}
});

watch(() => props.initialCleanIp, (val) => {
  if (val) cleanIp.value = val;
});

watch(() => props.initialNodes, (val) => {
  if (val) inputNodes.value = val;
});

const handleMatrixSelect = (ip, key) => {
  cleanIp.value = ip;
  prefix.value = `[${operatorPresets.value[key]?.name.split(' ')[0] || 'CF'}]`;
};

const executeOptimization = () => {
  activeFormat.value = 'raw';
  customFormattedText.value = '';
  optimizeAll();
};

const currentOutputDisplay = computed(() => {
  if (activeFormat.value === 'custom') return customFormattedText.value;
  return optimizedRaw.value;
});

const testSinglePing = async (uri) => {
  const node = parseNode(uri);
  if (!node) return;
  pingResults.value[uri] = null;
  const res = await pingNodeHost(node);
  pingResults.value[uri] = res.latency;
};

const testAllOptimizedPings = async () => {
  testingPings.value = true;
  for (const uri of optimizedNodes.value.slice(0, 20)) {
    await testSinglePing(uri);
  }
  testingPings.value = false;
};

const copyRaw = async () => {
  activeFormat.value = 'raw';
  await navigator.clipboard.writeText(optimizedRaw.value);
  alert('کانفیگ‌های بهینه‌شده کپی شدند!');
};

const copyBase64 = async () => {
  activeFormat.value = 'custom';
  customFormattedText.value = optimizedBase64.value;
  await navigator.clipboard.writeText(optimizedBase64.value);
  alert('سابسکریپشن Base64 کپی شد!');
};

const exportClashYaml = async () => {
  activeFormat.value = 'custom';
  const nodes = parseMultipleNodes(optimizedRaw.value);
  const yaml = toClashMeta(nodes);
  customFormattedText.value = yaml;
  await navigator.clipboard.writeText(yaml);
  alert('کانفیگ Clash Meta (YAML) کپی شد!');
};

const exportSingboxJson = async () => {
  activeFormat.value = 'custom';
  const nodes = parseMultipleNodes(optimizedRaw.value);
  const json = toSingbox(nodes);
  customFormattedText.value = json;
  await navigator.clipboard.writeText(json);
  alert('کانفیگ Sing-box (JSON) کپی شد!');
};

const handleCopySingle = async (uri) => {
  await navigator.clipboard.writeText(uri);
  alert('کانفیگ کپی شد!');
};

const handleOpenQr = (uri) => {
  qrTitle.value = 'بارکد QR اتصال بهینه‌شده';
  qrContent.value = uri;
  qrOpen.value = true;
};

const generateWorkerSubLink = () => {
  const worker = localStorage.getItem('cf_hub_worker_url') || '';
  if (!worker) {
    alert('لطفاً ابتدا در تب تنظیمات، آدرس Cloudflare Worker را وارد نمایید.');
    return;
  }
  const subLink = `${worker}/sub?ip=${encodeURIComponent(cleanIp.value)}&port=${cleanPort.value}&sni=${encodeURIComponent(customSni.value)}`;
  navigator.clipboard.writeText(subLink);
  alert('لینک سابسکریپشن مستقیم کپی شد:\n' + subLink);
};

const getPingClass = (lat) => {
  if (lat === null) return 'text-red font-bold';
  if (lat < 140) return 'text-green font-bold';
  if (lat < 250) return 'text-yellow';
  return 'text-red';
};

const clearAll = () => {
  inputNodes.value = '';
  optimizedNodes.value = [];
  customFormattedText.value = '';
  pingResults.value = {};
};
</script>

<style scoped>
.optimizer-suite {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.fragment-wrapper {
  margin-bottom: 12px;
}
.toggle-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--accent-cyan);
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 8px;
}
.btn-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}
.output-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-color: var(--accent-green);
}
.output-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.output-top h4 { color: var(--accent-green); }
.output-btns { display: flex; flex-wrap: wrap; gap: 6px; }
.output-area { border-color: var(--accent-green); }

.nodes-list-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.node-card-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
}
.node-info {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  font-size: 0.78rem;
}
.idx { color: var(--accent-cyan); font-weight: bold; }
.uri-text {
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.node-meta-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  border-top: 1px solid var(--border-color);
  padding-top: 6px;
}
.ping-badge {
  font-size: 0.76rem;
  font-family: monospace;
  direction: ltr;
}
.more-hint {
  font-size: 0.78rem;
  text-align: center;
}
</style>
