# Multiple adapter contexts detected

## Probable cause

Parts of your application are using different versions of `nuqs` or React, so
they cannot use the same adapter.

## Possible solutions

Make sure all packages use the same version of `nuqs`. If your application has
multiple React roots, wrap each one with the appropriate `NuqsAdapter`.

Multiple copies of the same `nuqs` version are supported by the fix in
[#1469](https://github.com/47ng/nuqs/pull/1469). If needed, upgrade to a release
that includes it.
