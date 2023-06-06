export const isEmpty = (value: any) => {
  if (value === null) {
    return true
  }
  if (Array.isArray(value) && !value.length) {
    return true
  }
  return false
}
