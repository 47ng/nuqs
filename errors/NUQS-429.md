# URL update rate-limited by the browser

This error occurs when too many URL updates are attempted in a short period of
time. For example, connecting a query state to a text input that updates on
every keypress, or a slider (`<input type="range">`).

## Possible Solutions

The library has a built-in throttling mechanism, that can be configured per
instance. See the [throttling](https://github.com/47ng/nuqs#throttling)
docs for more information.

## Safari

Safari has a very low rate-limit on URL updates: 100 updates per 30 seconds (or per 10 seconds on Safari 17 and above).
