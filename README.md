# CPA Next.js

Next.js version of the CPA frontend, packaged for Cloudflare Workers with the OpenNext adapter.

## Local Development

```bash
npm install
npm run dev
```

The app reads the backend URL from `NEXT_PUBLIC_API_BASE_URL`. If the value does not end in `/api`, the frontend appends `/api` automatically.

## Cloudflare Workers Deployment

```bash
npm run preview
npm run deploy
```

Cloudflare uses:

- `wrangler.jsonc` for the Worker entry and asset binding.
- `open-next.config.ts` for the OpenNext Cloudflare adapter.
- `.env.production` for the public CPA backend URL during builds.

For Cloudflare dashboard builds, use `npm run deploy` as the deploy command and keep `NEXT_PUBLIC_API_BASE_URL` configured in build variables if you change the backend host.
