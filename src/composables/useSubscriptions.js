import { ref, computed, watch } from 'vue';
import { parseMultipleNodes, encodeBase64 } from '../utils/protocols';
import { convertNodesToClient } from '../utils/converters';
import { deduplicateNodes } from '../utils/operators/operatorChains';

export function useSubscriptions() {
  const subUrl = ref('');
  const rawInput = ref('');
  const loading = ref(false);
  const searchQuery = ref('');
  const selectedProto = ref('all');
  const parsedNodes = ref([]);

  watch(rawInput, (val) => {
    parsedNodes.value = parseMultipleNodes(val);
  });

  const protoCounts = computed(() => {
    const map = {};
    parsedNodes.value.forEach(n => {
      map[n.protocol] = (map[n.protocol] || 0) + 1;
    });
    return map;
  });

  const filteredNodes = computed(() => {
    let list = parsedNodes.value;
    if (selectedProto.value !== 'all') {
      list = list.filter(n => n.protocol === selectedProto.value);
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      list = list.filter(n => 
        n.name.toLowerCase().includes(q) ||
        n.address.toLowerCase().includes(q) ||
        (n.sni && n.sni.toLowerCase().includes(q)) ||
        String(n.port).includes(q)
      );
    }
    return list;
  });

  const fetchRemote = async (workerUrl) => {
    if (!subUrl.value.trim()) return;
    loading.value = true;
    try {
      let dataText = '';
      if (workerUrl) {
        const res = await fetch(`${workerUrl}/api/proxy-fetch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: subUrl.value.trim() })
        });
        const data = await res.json();
        dataText = data.data;
      } else {
        const res = await fetch(subUrl.value.trim());
        dataText = await res.text();
      }
      rawInput.value = dataText;
    } catch (err) {
      alert('خطا در دریافت سابسکریپشن: ' + err.message);
    } finally {
      loading.value = false;
    }
  };

  const removeDuplicates = () => {
    const deduped = deduplicateNodes(parsedNodes.value);
    parsedNodes.value = deduped;
    rawInput.value = deduped.map(n => n.raw).join('\n');
  };

  return {
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
  };
}
