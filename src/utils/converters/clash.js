export function toClashMeta(nodes, groupName = 'PROXIES') {
  const proxies = nodes.map(n => {
    if (n.protocol === 'vless') {
      return {
        name: n.name,
        type: 'vless',
        server: n.address,
        port: parseInt(n.port, 10),
        uuid: n.auth,
        udp: true,
        tls: n.security === 'tls' || n.security === 'reality',
        servername: n.sni || n.host,
        'reality-opts': n.security === 'reality' ? { 'public-key': n.pbk, 'short-id': n.sid } : undefined,
        'client-fingerprint': n.fp || 'chrome',
        network: n.type || 'ws',
        'ws-opts': n.type === 'ws' ? { path: n.path, headers: { Host: n.host } } : undefined,
        'grpc-opts': n.type === 'grpc' ? { 'grpc-service-name': n.path } : undefined
      };
    }
    if (n.protocol === 'trojan') {
      return {
        name: n.name,
        type: 'trojan',
        server: n.address,
        port: parseInt(n.port, 10),
        password: n.auth,
        udp: true,
        sni: n.sni || n.host,
        network: n.type || 'ws',
        'ws-opts': n.type === 'ws' ? { path: n.path, headers: { Host: n.host } } : undefined
      };
    }
    if (n.protocol === 'vmess') {
      return {
        name: n.name,
        type: 'vmess',
        server: n.address,
        port: parseInt(n.port, 10),
        uuid: n.auth,
        alterId: n.aid || 0,
        cipher: 'auto',
        udp: true,
        tls: n.security === 'tls',
        servername: n.sni || n.host,
        network: n.type || 'ws',
        'ws-opts': n.type === 'ws' ? { path: n.path, headers: { Host: n.host } } : undefined
      };
    }
    if (n.protocol === 'hysteria2') {
      return {
        name: n.name,
        type: 'hysteria2',
        server: n.address,
        port: parseInt(n.port, 10),
        password: n.auth,
        sni: n.sni || n.address,
        'skip-cert-verify': true
      };
    }
    return null;
  }).filter(Boolean);

  const proxyNames = proxies.map(p => p.name);

  return `port: 7890
socks-port: 7891
allow-lan: true
mode: rule
log-level: info
ipv6: false
external-controller: 127.0.0.1:9090
proxies:
${JSON.stringify(proxies, null, 2)}
proxy-groups:
  - name: ${groupName}
    type: select
    proxies:
      - AUTO
      - DIRECT
${proxyNames.map(p => `      - "${p}"`).join('\n')}
  - name: AUTO
    type: url-test
    url: http://www.gstatic.com/generate_204
    interval: 300
    proxies:
${proxyNames.map(p => `      - "${p}"`).join('\n')}
rules:
  - MATCH,${groupName}
`;
}
