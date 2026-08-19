import { ref, computed } from 'vue';
import { parseMultipleNodes, buildOptimizedNode, decodeBase64, encodeBase64 } from '../utils/protocols';

export function useOptimizer() {
  const cleanIp = ref('');
  const cleanPort = ref('');
  const customSni = ref('');
  const prefix = ref('[CF-Clean]');
  const inputNodes = ref('');
  const optimizedNodes = ref([]);

  const fragmentEnabled = ref(false);
  const fragmentLength = ref('10-50');
  const fragmentInterval = ref('10-20');
  const fragmentPackets = ref('tlshello');

  const optimizeAll = () => {
    let content = inputNodes.value.trim();
    if (!content) return;

    if (!content.includes('://')) {
      content = decodeBase64(content);
    }

    const nodes = parseMultipleNodes(content);
    const results = nodes.map(node => {
      return buildOptimizedNode(node, {
        cleanIp: cleanIp.value.trim(),
        cleanPort: cleanPort.value,
        customSni: customSni.value.trim(),
        prefix: prefix.value.trim(),
        fragment: fragmentEnabled.value ? {
          enabled: true,
          length: fragmentLength.value,
          interval: fragmentInterval.value,
          packets: fragmentPackets.value
        } : undefined
      });
    });

    optimizedNodes.value = results;
  };

  const optimizedRaw = computed(() => optimizedNodes.value.join('\n'));
  const optimizedBase64 = computed(() => encodeBase64(optimizedRaw.value));

  return {
    cleanIp,
    cleanPort,
    customSni,
    prefix,
    inputNodes,
    optimizedNodes,
    fragmentEnabled,
    fragmentLength,
    fragmentInterval,
    fragmentPackets,
    optimizedRaw,
    optimizedBase64,
    optimizeAll
  };
}
