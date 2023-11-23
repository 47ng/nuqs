export default function Page() {
  return (
    <p id="windowHistorySupport">
      {String(process.env.__NEXT_WINDOW_HISTORY_SUPPORT)}
    </p>
  )
}
