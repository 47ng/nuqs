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
description       ← PR title      (free prose, reword-friendly)
```

A change's **type** and **breaking** flag (immutable, from the squash
commit) are the single source of truth for the changelog **category**/sections
and the version **bump**. Because every derived value reads only those two
tokens, the bump and the notes are in sync. The pull request contributes
**description** and people (author, participants) only.

## Terms

### release

A group of **changes** published together under one version/tag (one GitHub
Release, one git tag, one npm publish).

### change

The atomic unit of a release: one squash-merge commit associated with a pull request.
A change carries:

| Field           | Source                                                      |
| --------------- | ----------------------------------------------------------- |
| `prNumber`      | the `(#N)` suffix of the squash commit                      |
| **type**        | the squash commit's conventional type                       |
| **breaking**    | the `!` in the subject, or a `BREAKING CHANGE:` body footer |
| **description** | the PR title (type prefix stripped)                         |
| author          | the PR                                                      |
| closing issues  | the PR (`closingIssuesReferences`)                          |

Not every phase hydrates every field. **Notes** builds the full change (+ release
**contributors**); **finalize** hydrates only `prNumber` + closing issues (its
comment targets). Both share the same range → PR-number core, so they always
resolve the identical set — only the _extra_ fields differ.

### type

The semantic / conventional-commit type (`feat`, `fix`, `doc`, `chore`, …) of
the commit created when the PR is **squash-merged into the default branch**.
Immutable once merged. With **breaking**, the single source of truth for all
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
**either** by a **`!`** in the squash commit subject (`feat!: …`) **or** by a
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

The human-facing prose of a change, shown in the changelog line. It **is** the
**PR title**, with at most a leading conventional type prefix stripped for
display. The title is _prose_, never _classified_: stripping the prefix is a
cosmetic render step, not a derivation of type. Editing a PR title reshapes the
changelog wording **without** amending the commit — intended and supported.
Nothing — not type, not category, not bump — is ever interpreted from the title.

### channel

The release channel — `stable` or `beta`. Selects the asymmetric commit range
(cumulative GA vs incremental beta) and the npm **dist-tag** (`latest` / `beta`).

## Why this exists

Historically **bump** read the squash commit type while **category** read the
_live PR title_ type. A PR squash-merged as `fix:` then renamed to `test:`/`chore:`
still bumped (commit unchanged) but was mis-categorised or dropped from the notes
— a real fix vanishing from the changelog. Collapsing both onto the one immutable
**type** makes that divergence unrepresentable.
