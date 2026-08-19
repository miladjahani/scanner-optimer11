export const CLOUDFLARE_CIDRS = [
  { cidr: '173.245.48.0/20', base: [173, 245, 48, 0], mask: 20 },
  { cidr: '103.21.244.0/22', base: [103, 21, 244, 0], mask: 22 },
  { cidr: '103.22.200.0/22', base: [103, 22, 200, 0], mask: 22 },
  { cidr: '103.31.4.0/22', base: [103, 31, 4, 0], mask: 22 },
  { cidr: '141.101.64.0/18', base: [141, 101, 64, 0], mask: 18 },
  { cidr: '108.162.192.0/18', base: [108, 162, 192, 0], mask: 18 },
  { cidr: '190.93.240.0/20', base: [190, 93, 240, 0], mask: 20 },
  { cidr: '188.114.96.0/22', base: [188, 114, 96, 0], mask: 22 },
  { cidr: '197.234.240.0/22', base: [197, 234, 240, 0], mask: 22 },
  { cidr: '198.41.128.0/17', base: [198, 41, 128, 0], mask: 17 },
  { cidr: '162.158.0.0/15', base: [162, 158, 0, 0], mask: 15 },
  { cidr: '104.16.0.0/13', base: [104, 16, 0, 0], mask: 13 },
  { cidr: '104.24.0.0/14', base: [104, 24, 0, 0], mask: 14 },
  { cidr: '172.64.0.0/13', base: [172, 64, 0, 0], mask: 13 },
  { cidr: '131.0.72.0/22', base: [131, 0, 72, 0], mask: 22 }
];

export function generateRandomCloudflareIps(count = 1000) {
  const ips = [];
  const totalCidrs = CLOUDFLARE_CIDRS.length;

  for (let i = 0; i < count; i++) {
    const item = CLOUDFLARE_CIDRS[i % totalCidrs];
    const octets = [...item.base];

    if (item.mask === 13) {
      octets[1] += Math.floor(Math.random() * 8);
      octets[2] = Math.floor(Math.random() * 255);
      octets[3] = Math.floor(Math.random() * 254) + 1;
    } else if (item.mask === 14) {
      octets[1] += Math.floor(Math.random() * 4);
      octets[2] = Math.floor(Math.random() * 255);
      octets[3] = Math.floor(Math.random() * 254) + 1;
    } else if (item.mask === 15) {
      octets[1] += Math.floor(Math.random() * 2);
      octets[2] = Math.floor(Math.random() * 255);
      octets[3] = Math.floor(Math.random() * 254) + 1;
    } else {
      octets[2] += Math.floor(Math.random() * 4);
      octets[3] = Math.floor(Math.random() * 254) + 1;
    }

    ips.push(octets.join('.'));
  }

  return ips;
}
