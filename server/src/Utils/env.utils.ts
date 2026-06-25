/** Primary frontend URL for redirects (prefers https in production). */
export function getFrontendUrl(): string {
  const urls = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  return urls.find(u => u.startsWith('https://')) ?? urls[0] ?? 'http://localhost:5174'
}
