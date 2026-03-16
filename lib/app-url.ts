const DEFAULT_APP_URL = "http://localhost:3001"

export function getAppBaseUrl(request?: Request | URL | null) {
  if (request instanceof Request) {
    return new URL(request.url).origin
  }

  if (request instanceof URL) {
    return request.origin
  }

  const configuredUrl =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)

  return configuredUrl ?? DEFAULT_APP_URL
}

export function buildAppUrl(pathname: string, request?: Request | URL | null) {
  return new URL(pathname, getAppBaseUrl(request)).toString()
}
