function error(code: number, message: string) {
  return `[nuqs] ${message}
  See https://nuqs.dev/NUQS-${code}`
}

export const error303: string = /* @__PURE__ */ error(
  303,
  'Multiple adapter contexts detected. This might happen in monorepos.'
)
export const error404: string = /* @__PURE__ */ error(
  404,
  'nuqs requires an adapter to work with your framework.'
)
export const error409: string = /* @__PURE__ */ error(
  409,
  'Multiple copies of the library are loaded. This may lead to unexpected behavior. Currently using `%s`, but `%s` (via %s) was about to load on top.'
)
export const error414: string = /* @__PURE__ */ error(
  414,
  'Max safe URL length exceeded. Some browsers may not be able to accept this URL. Consider limiting the amount of state stored in the URL.'
)
export const error429: string = /* @__PURE__ */ error(
  429,
  'URL update rate-limited by the browser. Consider increasing `throttleMs` for key(s) `%s`. %O'
)
export const error500: string = /* @__PURE__ */ error(
  500,
  "Empty search params cache. Search params can't be accessed in Layouts."
)
export const error501: string = /* @__PURE__ */ error(
  501,
  'Search params cache already populated. Have you called `parse` twice?'
)
export const error502: string = /* @__PURE__ */ error(
  502,
  '`processUrlSearchParams` threw while processing key(s) `%s`. %O'
)
