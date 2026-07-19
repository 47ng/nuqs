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
