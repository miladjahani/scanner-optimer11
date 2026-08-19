<template>
  <div class="fragment-lab card">
    <div class="lab-header">
      <h4>🧪 آزمایشگاه پکت‌های فرگمنت (TLS Fragment Lab - DPI Bypass)</h4>
      <p class="desc">شکستن بسته هندشیک TLS به پکت‌های کوچک برای خنثی‌سازی فیلترینگ هوشمند SNI</p>
    </div>

    <div class="grid-3">
      <div class="form-group">
        <label>بازه طول پکت (Packet Length):</label>
        <input 
          :value="modelValue.length" 
          @input="$emit('update:modelValue', { ...modelValue, length: $event.target.value })"
          placeholder="10-50 (پیش‌فرض)" 
          class="input-box font-mono" 
        />
      </div>

      <div class="form-group">
        <label>تاخیر بین پکت‌ها (Interval ms):</label>
        <input 
          :value="modelValue.interval" 
          @input="$emit('update:modelValue', { ...modelValue, interval: $event.target.value })"
          placeholder="10-20" 
          class="input-box font-mono" 
        />
      </div>

      <div class="form-group">
        <label>نوع پکت‌های هدف (Packets):</label>
        <select 
          :value="modelValue.packets" 
          @change="$emit('update:modelValue', { ...modelValue, packets: $event.target.value })"
          class="input-box font-mono"
        >
          <option value="tlshello">tlshello (توصیه شده)</option>
          <option value="1-3">1-3</option>
          <option value="all">all</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Object,
    default: () => ({ length: '10-50', interval: '10-20', packets: 'tlshello' })
  }
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.fragment-lab {
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  padding: 14px;
}
.lab-header { margin-bottom: 10px; }
.lab-header h4 { color: var(--accent-cyan); font-size: 0.92rem; }
.desc { font-size: 0.78rem; color: var(--text-secondary); }
</style>
