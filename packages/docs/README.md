# docs

This is a Next.js application generated with
[Fumadocs](https://github.com/fuma-nama/fumadocs).

Run development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open http://localhost:3000 with your browser to see the result.

## AI traffic tracking

`src/proxy.ts` sends page request data to Notra for AI crawler and referral
analytics. It sends the URL, IP address, location headers, referrer, and user
agent after the response. Tracking stays off when `NOTRA_GEO_TOKEN` is empty.

Set `NOTRA_GEO_TOKEN` in `.env.local` to enable local tracking. Keep the file
out of Git. In the Vercel project settings, add the token to the environments
you want to track, then redeploy. Set it for each project that serves a tracked
domain, and register each domain in Notra.

## Learn More

To learn more about Next.js and Next Docs, take a look at the following
resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Fumadocs](https://fumadocs.vercel.app) - learn about Fumadocs
