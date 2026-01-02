# Deploy Redirects & HTTPS Canonical (dynamics-tim.dev)

Die Seite ist eine statische Astro-Site und wird aktuell per GitHub Pages deployed. GitHub Pages erlaubt keine eigenen Redirect-Regeln (HTTP → HTTPS, www → non-www). Wenn du diese Redirects erzwingen willst, setze eine Frontdoor (z. B. Cloudflare) oder hoste auf Netlify/Vercel.

## GitHub Pages (aktueller Stand)
- HTTPS in GitHub Pages aktivieren (Settings → Pages → Enforce HTTPS).
- Für harte HTTP → HTTPS und www → non-www Redirects: Cloudflare Proxy oder Host-Wechsel nutzen (siehe unten).

## Cloudflare (empfohlen für GitHub Pages)
1) DNS: `dynamics-tim.dev` und `www.dynamics-tim.dev` als CNAME/AAAA setzen und Proxy aktivieren.
2) Rules → Redirect Rules (Beispiele):
   - **HTTP → HTTPS**
     - If: `http.request.scheme eq "http"`
     - Then: `Static redirect` → `https://dynamics-tim.dev/${uri.path}?${uri.query}` (301)
   - **www → non-www**
     - If: `http.host eq "www.dynamics-tim.dev"`
     - Then: `Static redirect` → `https://dynamics-tim.dev/${uri.path}?${uri.query}` (301)
3) HSTS (optional): Rules → Transform Rules → Response Header
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
   - `preload` nur wenn gewollt und verifiziert.

## Netlify
`public/_redirects`:
```
http://dynamics-tim.dev/* https://dynamics-tim.dev/:splat 301!
https://www.dynamics-tim.dev/* https://dynamics-tim.dev/:splat 301!
```

## Vercel
`vercel.json`:
```json
{
  "redirects": [
    { "source": "/(.*)", "has": [{ "type": "host", "value": "www.dynamics-tim.dev" }], "destination": "https://dynamics-tim.dev/$1", "permanent": true },
    { "source": "/(.*)", "has": [{ "type": "host", "value": "dynamics-tim.dev" }], "destination": "https://dynamics-tim.dev/$1", "permanent": true }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
      ]
    }
  ]
}
```

## Nginx
```
server {
  listen 80;
  server_name dynamics-tim.dev www.dynamics-tim.dev;
  return 301 https://dynamics-tim.dev$request_uri;
}

server {
  listen 443 ssl;
  server_name www.dynamics-tim.dev;
  return 301 https://dynamics-tim.dev$request_uri;
}
```

## Apache (.htaccess)
```
RewriteEngine On
RewriteCond %{HTTPS} !=on [OR]
RewriteCond %{HTTP_HOST} ^www\.dynamics-tim\.dev$ [NC]
RewriteRule ^(.*)$ https://dynamics-tim.dev/$1 [R=301,L]
```
