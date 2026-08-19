import { parseMultipleNodes, buildOptimizedNode } from '../protocols';

export function optimizeNodesBatch(rawText, options = {}) {
  const nodes = parseMultipleNodes(rawText);
  const optimizedNodes = nodes.map(node => {
    return buildOptimizedNode(node, options);
  });
  return {
    count: optimizedNodes.length,
    rawList: optimizedNodes,
    rawText: optimizedNodes.join('\n')
  };
}
