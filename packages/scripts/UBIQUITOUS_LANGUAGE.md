# Ubiquitous Language — Release pipeline

Canonical terms for the release-automation scripts (version computation, release
notes, finalize). Use these words exactly, in code and prose. When a term has a
single source of truth, that source is authoritative — do not read the concept
from anywhere else.

## Core invariant

```
type              → category      (type section: Features / Bug fixes / …)
breaking          → Breaking-changes section (additive) + ⚠️ decoration in the type section
type + breaking   → bump          (breaking ? major : bumpForType(type))
description       ← PR title       (free prose, reword-friendly)
```

A change's **type** and **breaking** flag — both immutable, both from the squash
commit — are the single source of truth for the changelog **category**/sections
and the version **bump**. Because every derived value reads only those two
tokens, the bump and the notes can never disagree. The pull request contributes
**description** and people (author, participants) only — it never classifies.

## Terms

### release
A group of **changes** published together under one version/tag (one GitHub
Release, one git tag, one npm publish).

> False friend: the `changesets` project reserves `Release` for *a single
> package's bump* and calls the batch a `ReleasePlan`. We use the GitHub/npm
> sense (the batch). We do not depend on changesets; the clash is theirs.

### change
The atomic unit of a release: one squash-merge commit joined to its pull
request. A change carries:

| Field           | Source                                       |
| --------------- | -------------------------------------------- |
| `prNumber`      | the `(#N)` suffix of the squash commit       |
| **type**        | the squash commit's conventional type        |
| **breaking**    | the `!` in the squash commit header          |
| **description** | the PR title (type prefix stripped)          |
| author          | the PR                                       |
| closing issues  | the PR (`closingIssuesReferences`)           |

Not every phase hydrates every field. **Notes** builds the full change (+ release
**contributors**); **finalize** hydrates only `prNumber` + closing issues (its
comment targets). Both share the same range → PR-number core, so they always
resolve the identical set — only the *extra* fields differ.

### type
The semantic / conventional-commit type (`feat`, `fix`, `doc`, `chore`, …) of
the commit created when the PR is **squash-merged into the default branch**.
Immutable once merged. With **breaking**, the single source of truth for all
derived data: **category** = `categoryForType(type)`, **bump** =
`bumpForType(type)` (unless breaking). The PR title's prefix is *not* the type
(it can drift after a rename and is ignored for classification).

### breaking
Whether a change breaks compatibility, sourced from the **`!`** in the squash
commit header (`feat!: …`). Immutable. Orthogonal to **type**: it does not
change which type section a change renders in, but it (a) also lists the change
in the top **Breaking changes** section, (b) decorates the change's line in its
type section with ⚠️, and (c) forces the **bump** to `major`.

> The `BREAKING CHANGE:` body **footer** is *not* this flag. The footer is
> archaeology — prose explaining *why*, for `git blame`/`bisect` — and triggers
> nothing. Only the header `!` is load-bearing (and it is lintable via the PR
> title, which `pr-lint` validates pre-merge). The footer need not stay in sync.

### category
The changelog **type section** a change is rendered under — `Features`,
`Bug fixes`, `Documentation`, `Other changes`. **Derived from the change's type
alone** (`categoryForType`), never from the PR title and never from **breaking**
(a breaking `feat` is still a Feature). The top **Breaking changes** section is
*not* a category — it is a cross-cutting list driven by **breaking**, rendered
above the categories, holding every breaking change *in addition to* its type
section.

### bump
The semver increment a release applies — `major` / `minor` / `patch`. **Derived
from the change's type and breaking flag**: `breaking ? 'major' :
bumpForType(type)`. The highest bump across all changes in the release wins.
Same immutable source as **category**/sections, so they can never disagree.

### description
The human-facing prose of a change, shown in the changelog line. It **is** the
**PR title**, with at most a leading conventional type prefix stripped for
display. The title is *prose*, never *classified*: stripping the prefix is a
cosmetic render step, not a derivation of type. Editing a PR title reshapes the
changelog wording **without** amending the commit — intended and supported.
Nothing — not type, not category, not bump — is ever interpreted from the title.

### channel
The release channel — `stable` or `beta`. Selects the asymmetric commit range
(cumulative GA vs incremental beta) and the npm **dist-tag** (`latest` / `beta`).

## Why this exists

Historically **bump** read the squash commit type while **category** read the
*live PR title* type. A PR squash-merged as `fix:` then renamed to `test:`/`chore:`
still bumped (commit unchanged) but was mis-categorised or dropped from the notes
— a real fix vanishing from the changelog. Collapsing both onto the one immutable
**type** makes that divergence unrepresentable.
