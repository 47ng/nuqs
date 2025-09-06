# Max Safe URL Length Exceeded

This error occurs if your URL length exceeds 2,000 characters.

There are varying browser limitations for max URL lengths, [read more](https://nuqs.dev/docs/limits#max-url-lengths).

URLs that are too long might break in some browsers, or not be able to be
processed by some servers.

## Possible Solutions

Keeping your URLs short is a good practice: not all state has to live in the URL.

- Server state/data is best managed in a local cache like TanStack Query or SWR.
- Transient state (that doesn't need persisting or sharing) can be managed in local state.
- Device-persistent state can be managed in local storage.

When deciding to put state in the URL, ask yourself:

- Do I need it to persist across page refresh?
- Do I need to share it with others?
- Do I need to link to it from other places?
- Do I need to be able to bookmark it?
- Do I need to be able to use the Back/Forward buttons to navigate to it?
- Is it always going to be a small amount of data?

If the answer to any of these questions is no, then you might want to consider
an alternative state storage solution.
