# Docs authoring

nuqs.dev deploys to production from `next`, so docs for a feature can go live
before the feature ships on npm. Gate any documentation for an unreleased
feature behind `<SinceVersion>` so it stays hidden in production until its
version reaches npm's `latest`, while still showing (with a cue) on preview and
local. See [#1454](https://github.com/47ng/nuqs/pull/1454) for the mechanism.

## Gating unreleased content

Wrap the new content in `<SinceVersion v="x.y.z">`, where `x.y.z` is the nuqs
version the feature ships in (ask the user which one to use):

```mdx
<SinceVersion v="2.10.0">

## My new feature

...

</SinceVersion>
```

Use `disclaimer="inline"` to gate a single inline fragment or list item without
breaking its host list:

```mdx
- <SinceVersion v="2.10.0" disclaimer="inline">[New adapter](#new-adapter)</SinceVersion>
```

Rules:

- Gate the content in **both** `<HumanContent>` (HTML) and `<LLMContent>`
  (`.md` for LLMs) wherever it appears in each.
- In `<LLMContent>`, the opening and closing tags must sit on their **own
  lines** — the Markdown stripper matches them line-by-line.
- Once the version reaches npm's `latest`, the gate is a no-op: unwrap it,
  keeping the inner content. Preview builds log a `[SinceVersion]` warning
  naming each stale gate.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
