<template>
  <div class="settings-suite">
    <div class="card-header">
      <h3>🛠️ تنظیمات سرورلس Cloudflare Worker (حل قطعی مشکل CORS)</h3>
      <p class="desc">پیکربندی پروکسی جهت دور زدن کامل محدودیت CORS، دسترسی به DNS-over-HTTPS و توزیع خودکار سابسکریپشن</p>
    </div>

    <!-- Worker URL Config -->
    <div class="card">
      <div class="form-group">
        <label>آدرس Cloudflare Worker مستقر شده شما:</label>
        <input 
          v-model="workerUrlInput" 
          placeholder="https://your-worker-name.workers.dev" 
          class="input-box font-mono" 
        />
        <span class="hint">کدهای کامل اسکریپت ورکر در کادر زیر قرار دارد. کافیست آن را در داشبورد کلودفلر پیست و دیپلوی کنید.</span>
      </div>

      <div class="action-row">
        <button @click="save" class="btn primary">ذخیره آدرس Worker</button>
        <button @click="testConnection" :disabled="testing" class="btn secondary">
          <span v-if="testing" class="spinner"></span>
          {{ testing ? 'در حال تست ارتباط...' : 'تست پینگ و اتصال به Worker' }}
        </button>
      </div>

      <div v-if="testStatus" :class="['status-box', testStatus.success ? 'ok' : 'err']">
        {{ testStatus.message }}
      </div>
    </div>

    <!-- Ready to Deploy Script Display -->
    <div class="card worker-code-card">
      <div class="code-header">
        <h4>📄 اسکریپت آماده استقرار Cloudflare Worker (جهت کپی مستقیم):</h4>
        <button @click="copyWorkerCode" class="btn small success">📋 کپی کل کد اسکریپت Worker</button>
      </div>
      <textarea :value="workerScriptCode" rows="10" readonly class="textarea-box font-mono code-box"></textarea>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { workerUrl, saveWorkerUrl } from '../../stores/workerConfig';

const workerUrlInput = ref('');
const testing = ref(false);
const testStatus = ref(null);

onMounted(() => {
  workerUrlInput.value = workerUrl.value;
});

const save = () => {
  saveWorkerUrl(workerUrlInput.value);
  alert('آدرس ورکر ذخیره شد.');
};

const testConnection = async () => {
  if (!workerUrlInput.value.trim()) {
    testStatus.value = { success: false, message: 'لطفاً ابتدا آدرس ورکر را وارد نمایید.' };
    return;
  }
  testing.value = true;
  testStatus.value = null;

  try {
    const res = await fetch(`${workerUrlInput.value.trim().replace(/\/$/, '')}/api/ping`);
    const data = await res.json();
    if (data.success) {
      testStatus.value = { success: true, message: '✅ ارتباط با Cloudflare Worker برقرار است! تمام ابعاد CORS حل شده است.' };
    } else {
      testStatus.value = { success: false, message: 'پاسخ نامعتبر از ورکر دریافت شد.' };
    }
  } catch (err) {
    testStatus.value = { success: false, message: `❌ خطا در اتصال به ورکر: ${err.message}` };
  } finally {
    testing.value = false;
  }
};

const workerScriptCode = ref(`/**
 * Cloudflare Worker Enterprise Backend & Universal CORS Proxy
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent, X-Requested-With, Cache-Control, Accept',
  'Access-Control-Expose-Headers': 'Subscription-Userinfo, Content-Disposition, Content-Length',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      if (pathname === '/' || pathname === '/api') {
        return new Response(JSON.stringify({ status: 'online', service: 'MiSub & CF Universal Proxy' }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      // Fetch Subscription without CORS
      if (pathname === '/api/proxy-fetch' || pathname === '/api/fetch-sub') {
        let targetUrl = url.searchParams.get('url');
        let customUa = url.searchParams.get('ua') || request.headers.get('User-Agent') || 'v2rayNG/1.8.12';

        if (!targetUrl && request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          targetUrl = body.url;
          if (body.userAgent) customUa = body.userAgent;
        }

        if (!targetUrl) {
          return new Response(JSON.stringify({ success: false, error: 'url required' }), {
            status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }

        const subRes = await fetch(targetUrl, { headers: { 'User-Agent': customUa } });
        const rawData = await subRes.text();
        const userinfo = subRes.headers.get('Subscription-Userinfo') || '';

        if (request.method === 'GET') {
          return new Response(rawData, {
            status: subRes.status,
            headers: {
              ...CORS_HEADERS,
              'Content-Type': 'text/plain; charset=utf-8',
              'Subscription-Userinfo': userinfo
            }
          });
        }

        return new Response(JSON.stringify({ success: true, userinfo, data: rawData }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      // Latency Ping Probe
      if (pathname === '/api/ping') {
        return new Response(JSON.stringify({ success: true, timestamp: Date.now() }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: CORS_HEADERS });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS_HEADERS });
    }
  }
};`);

const copyWorkerCode = async () => {
  await navigator.clipboard.writeText(workerScriptCode.value);
  alert('اسکریپت Cloudflare Worker در کلیپ‌بورد کپی شد!');
};
</script>

<style scoped>
.settings-suite {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.hint {
  font-size: 0.76rem;
  color: #64748b;
  margin-top: 4px;
  display: block;
}
.action-row {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
.status-box {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
}
.status-box.ok { background: #064e3b; color: #34d399; border: 1px solid #059669; }
.status-box.err { background: #7f1d1d; color: #fca5a5; border: 1px solid #dc2626; }

.worker-code-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.code-header h4 { font-size: 0.9rem; color: #e2e8f0; }
.code-box {
  font-size: 0.78rem;
  line-height: 1.4;
  color: #a5f3fc;
}
</style>
