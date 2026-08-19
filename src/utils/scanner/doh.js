export async function resolveDoH(domain, provider = 'https://1.1.1.1/dns-query') {
  try {
    const res = await fetch(`${provider}?name=${encodeURIComponent(domain)}&type=A`, {
      headers: { Accept: 'application/dns-json' }
    });
    const json = await res.json();
    if (json.Answer) {
      return json.Answer.map(a => a.data);
    }
  } catch (err) {
    console.error('DoH resolution error:', err);
  }
  return [];
}
