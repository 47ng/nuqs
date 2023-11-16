# Search params cache already populated

This error occurs when a [search params cache](https://github.com/47ng/next-usequerystate#accessing-searchparams-in-server-components)
is being fed searchParams more than once.

Internally, the cache object will be frozen for the duration of the page render
after having been populated. This is to prevent search params from being modified
while the page is being rendered.

## Solutions

Look into the stack trace where the error occurred and remove the second call to
`parse` that threw the error.
