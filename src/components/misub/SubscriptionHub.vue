<template>
  <div class="misub-hub-suite">
    <div class="card-header">
      <h3>📋 مرکز مدیریت سابسکریپشن MiSub (Universal Subscription Hub)</h3>
      <p class="desc">پشتیبانی از تمام فرمت‌های لینک ساب، رمزگشایی انواع پروتکل‌ها، فیلتر آنی، حذف تکراری و تست پینگ زنده</p>
    </div>

    <!-- Fetch / Paste Section -->
    <div class="card">
      <div class="form-group">
        <label>آدرس سابسکریپشن ریموت (Sub URL):</label>
        <div class="input-with-btn">
          <input 
            v-model="subUrl" 
            placeholder="https://example.com/sub/token..." 
            class="input-box font-mono" 
          />
          <button @click="handleFetch" :disabled="loading" class="btn primary">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'در حال دریافت...' : 'دریافت سابسکریپشن' }}
          </button>
        </div>
      </div>

      <div class="form-group">
        <label>یا وارد کردن مستقیم کانفیگ‌ها (Clash YAML / Sing-box JSON / Base64 / خط‌به‌خط):</label>
        <textarea 
          v-model="rawInput" 
          rows="4" 
          class="textarea-box font-mono" 
          placeholder="vless://...&#10;vmess://...&#10;trojan://...&#10;ss://..."
        ></textarea>
      </div>
    </div>

    <!-- Tools & Filters Toolbar -->
    <div v-if="parsedNodes.length" class="card toolbar-box">
      <div class="search-filter-row">
        <input 
          v-model="searchQuery" 
          placeholder="جستجو در نام، آدرس، پورت یا SNI..." 
          class="input-box" 
        />
        <div class="tools-btn-group">
          <button @click="testAllPings" :disabled="testingPings" class="btn small primary">
            <span v-if="testingPings" class="spinner"></span>
            {{ testingPings ? 'در حال تست...' : '📡 تست پینگ نودها' }}
          </button>
          <button @click="removeDuplicates" class="btn small secondary">حذف تکراری‌ها</button>
          <button @click="showDoctor = !showDoctor" class="btn small secondary">
            {{ showDoctor ? 'بستن دکتر نود' : '🩺 دکتر نود' }}
          </button>
          <button @click="showConverter = !showConverter" class="btn small secondary">
            {{ showConverter ? 'بستن مبدل' : '🔗 مبدل کلاینت' }}
          </button>
          <button @click="sendAllToOptimizer" class="btn small success">⚡ انتقال به بهینه‌ساز</button>
        </div>
      </div>

      <div class="protocol-chips">
        <button 
          :class="['chip', { active: selectedProto === 'all' }]"
          @click="selectedProto = 'all'"
        >
          همه ({{ parsedNodes.length }})
        </button>
        <button 
          v-for="(count, proto) in protoCounts" 
          :key="proto"
          :class="['chip', { active: selectedProto === proto }]"
          @click="selectedProto = proto"
        >
          <span :class="['badge', proto]">{{ proto.toUpperCase() }}</span>
          <span>({{ count }})</span>
        </button>
      </div>
    </div>

    <!-- Node Doctor Sub-Panel -->
    <NodeDoctorPanel v-if="showDoctor && parsedNodes.length" :nodes="filteredNodes" />

    <!-- SubConverter Sub-Panel -->
    <ClientConverterWorkspace v-if="showConverter && parsedNodes.length" :nodes="filteredNodes" />

    <!-- Nodes Grid Display -->
    <div v-if="filteredNodes.length" class="nodes-grid">
      <div v-for="node in filteredNodes" :key="node.id" class="node-item card">
        <div class="node-header">
          <span :class="['badge', node.protocol]">{{ node.protocol.toUpperCase() }}</span>
          <span class="node-title" :title="node.name">{{ node.name }}</span>
          <span v-if="nodePings[node.id] !== undefined" :class="['ping-pill', getPingClass(nodePings[node.id])]">
            {{ nodePings[node.id] !== null ? nodePings[node.id] + ' ms' : 'Timeout' }}
          </span>
        </div>

        <div class="node-meta font-mono">
          <div><span class="meta-label">آدرس:</span> {{ node.address }}:{{ node.port }}</div>
          <div v-if="node.sni"><span class="meta-label">SNI:</span> {{ node.sni }}</div>
          <div><span class="meta-label">شبکه:</span> {{ node.type }} | {{ node.security }}</div>
        </div>

        <div class="node-actions">
          <button @click="testSingleNodePing(node)" class="btn-text">تست پینگ</button>
          <button @click="copyText(node.raw)" class="btn-text">کپی لینک</button>
          <button @click="$emit('select-node-to-optimize', node.raw)" class="btn-text highlight">بهینه‌سازی</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useSubscriptions } from '../../composables/useSubscriptions';
import { pingNodeHost } from '../../utils/scanner/scannerEngine';
import NodeDoctorPanel from './NodeDoctorPanel.vue';
import ClientConverterWorkspace from './ClientConverterWorkspace.vue';

const emit = defineEmits(['send-to-optimizer', 'select-node-to-optimize']);

const {
  subUrl,
  rawInput,
  loading,
  searchQuery,
  selectedProto,
  parsedNodes,
  protoCounts,
  filteredNodes,
  fetchRemote,
  removeDuplicates
} = useSubscriptions();

const showDoctor = ref(false);
const showConverter = ref(false);
const nodePings = ref({});
const testingPings = ref(false);

const handleFetch = () => {
  const worker = localStorage.getItem('cf_hub_worker_url') || '';
  fetchRemote(worker);
};

const testSingleNodePing = async (node) => {
  nodePings.value[node.id] = null;
  const res = await pingNodeHost(node);
  nodePings.value[node.id] = res.latency;
};

const testAllPings = async () => {
  testingPings.value = true;
  for (const node of filteredNodes.value.slice(0, 25)) {
    await testSingleNodePing(node);
  }
  testingPings.value = false;
};

const getPingClass = (lat) => {
  if (lat === null) return 'text-red font-bold';
  if (lat < 140) return 'text-green font-bold';
  if (lat < 250) return 'text-yellow';
  return 'text-red';
};

const copyText = async (text) => {
  await navigator.clipboard.writeText(text);
  alert('کانفیگ کپی شد!');
};

const sendAllToOptimizer = () => {
  const raws = filteredNodes.value.map(n => n.raw).join('\n');
  emit('send-to-optimizer', raws);
};
</script>

<style scoped>
.misub-hub-suite {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.input-with-btn { display: flex; gap: 8px; }
.toolbar-box { display: flex; flex-direction: column; gap: 12px; }
.search-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}
.tools-btn-group { display: flex; flex-wrap: wrap; gap: 6px; }
.protocol-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #1e293b;
  color: #cbd5e1;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 0.78rem;
  cursor: pointer;
}
.chip.active { background: var(--accent-blue); color: #fff; border-color: var(--accent-cyan); }

.nodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.node-item {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
}
.node-header { display: flex; align-items: center; gap: 8px; }
.node-title {
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.ping-pill {
  font-size: 0.72rem;
  font-family: monospace;
  direction: ltr;
}
.node-meta {
  font-size: 0.78rem;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.meta-label { color: #64748b; }
.node-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--border-color);
  padding-top: 6px;
}
.btn-text {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 0.78rem;
  cursor: pointer;
}
.btn-text.highlight { color: var(--accent-cyan); font-weight: bold; }
</style>
