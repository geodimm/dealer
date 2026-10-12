// Photo hosts that send `Access-Control-Allow-Origin: *`. Loading their photos
// with CORS gives the service worker responses it can cache (it skips opaque
// ones). Other hosts, like Billa's, would fail a CORS request.
const CORS_HOSTS = new Set(['kaufland.media.schwarz', 'media.kaufland.com', 'imgproxy-retcat.assets.schwarz']);

export function imageCors(src: string): 'anonymous' | undefined {
  try {
    return CORS_HOSTS.has(new URL(src).host) ? 'anonymous' : undefined;
  } catch {
    return undefined;
  }
}
