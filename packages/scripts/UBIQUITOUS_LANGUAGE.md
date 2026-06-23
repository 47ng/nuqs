# Ubiquitous Language for the Release pipeline

Canonical terms for the release-automation scripts (version computation, release
notes, finalize). Use these words exactly, in code and prose. When a term has a
single source of truth, that source is authoritative: do not read the concept
from anywhere else.

## Core invariant

```
type              → category      (type section: Features / Bug fixes / …)
breaking          → Breaking-changes section + ⚠️ decoration in the type section
type + breaking   → bump          (breaking ? major : bumpForType(type))
description       ← source prose  (PR title, or commit subject)
```

A change's **type** and **breaking** flag (immutable, from the **commit**) are
the single source of truth for the changelog **category**/sections and the
version **bump**. Because every derived value reads only those two tokens, the
bump and the notes are in sync. A change's **description** and the people to
credit come from its **source** — the pull request for a squashed PR, the commit
itself for a direct commit — never from the classification.

## Terms

### release

A group of **changes** published together under one version/tag (one GitHub
Release, one git tag, one npm publish).

### change

The atomic unit of a **release**: one landed change, classified and described.
Every change traces to a single commit in the release's range and comes from one
of two **sources**:

- a **squashed PR** — a pull request squash-merged into the default branch (the
  common case); the pull request lends it human prose and the people to credit.
- a **direct commit** — a change pushed straight to the default branch with no
  pull request (rare: a hotfix, a revert).

Whatever the source, a change's **type** and **breaking** flag are read from the
commit, never a pull-request title — so its **category** and **bump** are fixed
at merge. The source decides only the rest: the change's identity, where its
**description** and credited author come from, and which **closing issues** get
resolved — the pipeline links these only for a squashed PR (a direct commit can
close issues via commit-message keywords, but those aren't tracked in the
release notes or commented on).

### source

Which kind of commit a **change** came from — a **squashed PR** or a **direct
commit**. Not "PR versus commit": a squashed PR _is_ a commit, so the real split
is _merged through a pull request_ versus _pushed directly_. The source governs
a change's identity, the origin of its prose and credited author, and which
**closing issues** the pipeline resolves (squashed PRs only); it never touches
**type**, **breaking**,
**category**, or **bump** — those are the commit's alone.

> Alias to avoid: framing this as "PR vs commit" — it implies a squashed PR
> isn't a commit, which is exactly backwards.

### type

The semantic / conventional-commit type (`feat`, `fix`, `doc`, `chore`, …) read
from a change's **commit** — the squash commit when a pull request is merged into
the default branch, or the commit itself for a direct push. Immutable once
landed. With **breaking**, the single source of truth for all
derived data: **category** = `categoryForType(type)`, **bump** =
`bumpForType(type)` (unless breaking). The PR title's prefix is _not_ the type
(it can drift after a rename and is ignored for classification).

### subject

The first line of a commit message (git's `%s`). Conventional Commits names the
_parts_ of it (`type`, `scope`, `description`) but not the line itself; we use
git's term, never Angular's "header." `parseSubject` turns a subject into its
`{ type, breaking, description }` parts — where `breaking` reflects only the
subject's `!`. Commit-level breaking (which also honours the body footer) is read
from the full message by `parseCommit`.

### breaking

Whether a change breaks compatibility. Per Conventional Commits, indicated
**either** by a **`!`** in the commit subject (`feat!: …`) **or** by a
**`BREAKING CHANGE:`** (or `BREAKING-CHANGE:`) footer in the commit body — so
detecting it requires the _full_ commit message (`%B`), not just the subject.
Immutable. Orthogonal to **type**: it does not change which type section a change
renders in, but it (a) also lists the change in the top **Breaking changes**
section, (b) decorates the change's line in its type section with ⚠️, and (c)
forces the **bump** to `major`.

> Why honour the footer (not only `!`): a contributor who marks a break with the
> footer alone would otherwise ship a breaking change as a non-major bump —
> silently violating SemVer, caught only at draft time when a git-history rewrite
> is the sole fix. Following the spec to the letter closes that trap.

### category

The changelog **type section** a change is rendered under — `Features`,
`Bug fixes`, `Documentation`, `Other changes`. **Derived from the change's type
alone** (`categoryForType`), never from the PR title and never from **breaking**
(a breaking `feat` is still a Feature). The top **Breaking changes** section is
_not_ a category — it is a cross-cutting list driven by **breaking**, rendered
above the categories, holding every breaking change _in addition to_ its type
section.

### bump

The semver increment a release applies — `major` / `minor` / `patch`. **Derived
from the change's type and breaking flag**: `breaking ? 'major' :
bumpForType(type)`. The highest bump across all changes in the release wins.
Same immutable source as **category**/sections, so they can never disagree.

### description

The human-facing prose of a change, shown in the changelog line. It comes from
the change's **source**: for a squashed PR it **is** the **PR title**; for a
direct commit it is the commit **subject**. At most a leading conventional type
prefix is stripped for display. The prose is never _classified_: stripping the
prefix is a cosmetic render step, not a derivation of type. A PR title can be
reworded to reshape the changelog wording **without** amending the commit —
intended and supported. Nothing — not type, not category, not bump — is ever
interpreted from it.

### channel

The release channel — `stable` or `beta`. Selects the asymmetric commit range
(cumulative GA vs incremental beta) and the npm **dist-tag** (`latest` / `beta`).

### target

A pull request, issue, or discussion a published **release** announces itself on:
the thread that receives the "shipped in vX.Y.Z" comment and the released
**label**. Issues, PRs, and discussions draw from one shared number sequence per
repository, so a number identifies exactly one target. A target is one of three
**kinds** — **PR**, **issue**, or **discussion** — differing in how the release
reaches them and how the comment is worded. A target is not a **change**: a change
is a changelog line; a target is a thread to notify — and a **direct commit** is a
change that yields no target.

### target reference

A keyword and a same-repo number in a pull request body that names a **target** —
`Closes #N`, `Fixes #N`, `Resolves #N`, `Addresses #N`, and their tenses. The
close/fix/resolve keywords are GitHub's own closing keywords (GitHub links the
issue itself as one of the PR's **closing issues**); `Addresses` is not — GitHub
never links it — but a release *announces* its targets rather than closing them,
so we treat it the same. A target reference to a **discussion** is the sole record
that the discussion belongs to the release.

### discussion

A GitHub Discussion that a release pull request resolves — a **target** named by a
**target reference** in the PR body. Distinct from an **issue** in origin only: a
pull request can close an issue but not a discussion, so a discussion is never
among a PR's linked closing issues and is known only from the body text. Once the
release ships it is announced like an issue — a comment and the released
**label** — never closed or locked.

## Why this exists

Historically **bump** read the commit type while **category** read the
_live PR title_ type. A PR squash-merged as `fix:` then renamed to `test:`/`chore:`
still bumped (commit unchanged) but was mis-categorised or dropped from the notes
— a real fix vanishing from the changelog. Collapsing both onto the one immutable
**type** makes that divergence unrepresentable.
