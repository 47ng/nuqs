import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

vi.mock('server-only', () => ({}))

import {
  combineStats,
  fetchNpmPackages,
  getAllTime,
  getDownloadsNDaysBeforeLatest,
  getPackageCreationDate,
  interpolateZeroDays,
  type Datum,
  type NpmPackageStatsData
} from './npm.ts'

const rangeEndpoint = 'https://api.npmjs.org/downloads/range/:range/:pkg'
const registryEndpoint = 'https://registry.npmjs.org/:pkg'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Fake only Date so the date-derived request URLs and loop bounds are
// deterministic, while leaving real timers for the fetch/MSW plumbing.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('interpolateZeroDays', () => {
  function datum(downloads: number, i: number): Datum {
    return { date: `2024-06-${String(i + 1).padStart(2, '0')}`, downloads }
  }

  it('estimates a zero day by averaging the backward and forward week trends', () => {
    // i=8: base=D-7=idx1=100, backward=(idx7-idx0)/idx0=0.2, forward=(idx9-idx2)/idx2=0.4
    const data = [100, 100, 100, 100, 100, 100, 100, 120, 0, 140].map(datum)
    const result = interpolateZeroDays(data)
    expect(result[8]).toMatchObject({ downloads: 130, estimated: true })
  })

  it('uses the backward trend alone when the forward week is unavailable', () => {
    // i=9 (last): forward null (no D+1), backward=(idx8-idx1)/idx1=0.3, base=idx2=100
    const data = [100, 100, 100, 100, 100, 100, 100, 100, 130, 0].map(datum)
    const result = interpolateZeroDays(data)
    expect(result[9]).toMatchObject({ downloads: 130, estimated: true })
  })

  it('uses the forward trend alone when the backward week is unavailable', () => {
    // i=7: backward null (i-8<0), forward=(idx8-idx1)/idx1=0.4, base=idx0=100
    const data = [100, 100, 100, 100, 100, 100, 100, 0, 140].map(datum)
    const result = interpolateZeroDays(data)
    expect(result[7]).toMatchObject({ downloads: 140, estimated: true })
  })

  it('falls back to the D-7 baseline when no trend is available', () => {
    // i=7: base=idx0=100, backward null (i-8<0), forward null (i+1 out of range)
    const data = [100, 50, 50, 50, 50, 50, 50, 0].map(datum)
    const result = interpolateZeroDays(data)
    expect(result[7]).toMatchObject({ downloads: 100, estimated: true })
  })

  it('leaves a zero day untouched when it is in the first week', () => {
    const data = [100, 100, 0, 100, 100].map(datum)
    const result = interpolateZeroDays(data)
    expect(result[2]).toEqual({ date: data[2].date, downloads: 0 })
  })

  it('leaves a zero day untouched when its D-7 baseline is also zero', () => {
    const data = [0, 100, 100, 100, 100, 100, 100, 0].map(datum)
    const result = interpolateZeroDays(data)
    expect(result[7]).toEqual({ date: data[7].date, downloads: 0 })
  })
})

describe('getDownloadsNDaysBeforeLatest', () => {
  it('looks up by calendar date rather than array position', () => {
    const data = [
      { date: '2024-06-06', downloads: 60 },
      { date: '2024-06-08', downloads: 80 },
      { date: '2024-06-13', downloads: 130 }
    ]

    expect(getDownloadsNDaysBeforeLatest(data, 7)).toEqual({
      date: '2024-06-06',
      downloads: 60
    })
  })
})

describe('getPackageCreationDate', () => {
  it('parses time.created from the registry', async () => {
    server.use(
      http.get(registryEndpoint, () =>
        HttpResponse.json({ time: { created: '2020-06-01T00:00:00Z' } })
      )
    )
    const date = await getPackageCreationDate('nuqs')
    // npm.ts does not extend dayjs/utc, so .format() renders in local time —
    // assert on the instant to stay timezone-independent across CI/contributors.
    expect(date.valueOf()).toBe(new Date('2020-06-01T00:00:00Z').valueOf())
  })

  it('clamps a pre-epoch creation date to the npm stats epoch', async () => {
    server.use(
      http.get(registryEndpoint, () =>
        HttpResponse.json({ time: { created: '2010-01-01T00:00:00Z' } })
      )
    )
    const date = await getPackageCreationDate('nuqs')
    expect(date.format('YYYY-MM-DD')).toBe('2015-01-10')
  })

  it('falls back to the npm stats epoch and logs on a malformed response', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    server.use(http.get(registryEndpoint, () => HttpResponse.json({})))
    const date = await getPackageCreationDate('nuqs')
    expect(date.format('YYYY-MM-DD')).toBe('2015-01-10')
    expect(errorSpy).toHaveBeenCalled()
  })
})

describe('getAllTime', () => {
  it('sums downloads across each 18-month window up to today', async () => {
    server.use(
      http.get(registryEndpoint, () =>
        HttpResponse.json({ time: { created: '2020-01-01T00:00:00Z' } })
      ),
      http.get(rangeEndpoint, () =>
        HttpResponse.json({ downloads: [{ downloads: 12, day: 'x' }] })
      )
    )
    // 2020-01 → 2021-07 → 2023-01 → 2024-07 spans three windows before today.
    await expect(getAllTime('nuqs')).resolves.toBe(36)
  })

  it('keeps the accumulated partial sum when a later window request fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let rangeCalls = 0
    server.use(
      http.get(registryEndpoint, () =>
        HttpResponse.json({ time: { created: '2020-01-01T00:00:00Z' } })
      ),
      http.get(rangeEndpoint, () => {
        rangeCalls++
        // First two 18-month windows succeed (12 each); the third is broken.
        return rangeCalls <= 2
          ? HttpResponse.json({ downloads: [{ downloads: 12, day: 'x' }] })
          : HttpResponse.json({ broken: true })
      })
    )
    // Break must preserve the 24 already accumulated, not reset to 0.
    await expect(getAllTime('nuqs')).resolves.toBe(24)
    expect(errorSpy).toHaveBeenCalled()
  })
})

describe('fetchNpmPackages', () => {
  it('derives both time windows from one combined recent-download snapshot', async () => {
    const dates = Array.from({ length: 31 }, (_, i) =>
      new Date(Date.UTC(2024, 4, 15 + i)).toISOString().slice(0, 10)
    )
    let combinedRangeRequests = 0
    server.use(
      http.get(registryEndpoint, () =>
        HttpResponse.json({ time: { created: '2024-06-01T00:00:00Z' } })
      ),
      http.get(rangeEndpoint, ({ params }) => {
        if (params.pkg === 'nuqs,next-usequerystate') {
          combinedRangeRequests++
          return HttpResponse.json({
            nuqs: {
              downloads: dates.map((day, i) => ({ downloads: i + 1, day }))
            },
            'next-usequerystate': {
              downloads: dates.map((day, i) => ({ downloads: 100 + i, day }))
            }
          })
        }
        return HttpResponse.json({ downloads: [{ downloads: 12, day: 'x' }] })
      })
    )

    const [nuqs, nextUseQueryState] = await fetchNpmPackages()

    expect(combinedRangeRequests).toBe(1)
    expect(nuqs.last30Days).toEqual(
      dates.slice(-30).map((date, i) => ({ date, downloads: i + 2 }))
    )
    expect(nextUseQueryState.last30Days).toEqual(
      dates.slice(-30).map((date, i) => ({ date, downloads: 101 + i }))
    )
    expect(nuqs.last90Days.at(-1)?.downloads).toBe(145)
    expect(nextUseQueryState.last90Days.at(-1)?.downloads).toBe(640)
  })

  it('drops a trailing date from both packages when either is not published yet', async () => {
    const dates = Array.from(
      { length: 9 },
      (_, i) => `2024-05-${String(i + 23).padStart(2, '0')}`
    )
    server.use(
      http.get(registryEndpoint, () =>
        HttpResponse.json({ time: { created: '2024-06-01T00:00:00Z' } })
      ),
      http.get(rangeEndpoint, ({ params }) => {
        if (params.pkg === 'nuqs,next-usequerystate') {
          return HttpResponse.json({
            nuqs: {
              downloads: dates.map(day => ({ downloads: 10, day }))
            },
            'next-usequerystate': {
              downloads: dates.map((day, i) => ({
                downloads: i === dates.length - 1 ? 0 : 5,
                day
              }))
            }
          })
        }
        return HttpResponse.json({ downloads: [{ downloads: 12, day: 'x' }] })
      })
    )

    const [nuqs, nextUseQueryState] = await fetchNpmPackages()

    expect(nuqs.last30Days.at(-1)?.date).toBe('2024-05-30')
    expect(nextUseQueryState.last30Days.at(-1)?.date).toBe('2024-05-30')
  })

  it('uses only dates present for both packages without extending the 30-day window', async () => {
    const dates = Array.from({ length: 31 }, (_, i) =>
      new Date(Date.UTC(2024, 4, 15 + i)).toISOString().slice(0, 10)
    )
    const missingDate = '2024-06-01'
    server.use(
      http.get(registryEndpoint, () =>
        HttpResponse.json({ time: { created: '2024-06-01T00:00:00Z' } })
      ),
      http.get(rangeEndpoint, ({ params }) => {
        if (params.pkg === 'nuqs,next-usequerystate') {
          return HttpResponse.json({
            nuqs: {
              downloads: dates.map(day => ({ downloads: 10, day }))
            },
            'next-usequerystate': {
              downloads: dates
                .filter(day => day !== missingDate)
                .map(day => ({ downloads: 5, day }))
            }
          })
        }
        return HttpResponse.json({ downloads: [{ downloads: 12, day: 'x' }] })
      })
    )

    const [nuqs, nextUseQueryState] = await fetchNpmPackages()

    const expectedDates = dates.slice(-30).filter(date => date !== missingDate)
    expect(nuqs.last30Days.map(d => d.date)).toEqual(expectedDates)
    expect(nextUseQueryState.last30Days.map(d => d.date)).toEqual(expectedDates)
  })

  it('preserves calendar offsets when a package omits an internal date', async () => {
    const dates = Array.from({ length: 15 }, (_, i) =>
      new Date(Date.UTC(2024, 4, 31 + i)).toISOString().slice(0, 10)
    )
    const missingDate = '2024-06-06'
    server.use(
      http.get(registryEndpoint, () =>
        HttpResponse.json({ time: { created: '2024-06-01T00:00:00Z' } })
      ),
      http.get(rangeEndpoint, ({ params }) => {
        if (params.pkg === 'nuqs,next-usequerystate') {
          return HttpResponse.json({
            nuqs: {
              downloads: dates.map((day, i) => ({
                downloads: i === 5 ? 10 : i === 13 ? 0 : 100,
                day
              }))
            },
            'next-usequerystate': {
              downloads: dates
                .filter(day => day !== missingDate)
                .map(day => ({ downloads: 5, day }))
            }
          })
        }
        return HttpResponse.json({ downloads: [{ downloads: 12, day: 'x' }] })
      })
    )

    const [nuqs] = await fetchNpmPackages()

    expect(nuqs.last30Days.find(d => d.date === '2024-06-13')).toEqual({
      date: '2024-06-13',
      downloads: 550,
      estimated: true
    })
  })

  it('returns empty recent series and logs when the combined response is malformed', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    server.use(
      http.get(registryEndpoint, () =>
        HttpResponse.json({ time: { created: '2024-06-01T00:00:00Z' } })
      ),
      http.get(rangeEndpoint, ({ params }) =>
        params.pkg === 'nuqs,next-usequerystate'
          ? HttpResponse.json({ broken: true })
          : HttpResponse.json({ downloads: [{ downloads: 12, day: 'x' }] })
      )
    )

    const [nuqs, nextUseQueryState] = await fetchNpmPackages()

    expect(nuqs.last30Days).toEqual([])
    expect(nuqs.last90Days).toEqual([])
    expect(nextUseQueryState.last30Days).toEqual([])
    expect(nextUseQueryState.last90Days).toEqual([])
    expect(errorSpy).toHaveBeenCalledOnce()
  })
})

describe('combineStats', () => {
  function stats(
    allTime: number,
    last30: Datum[],
    last90: Datum[]
  ): NpmPackageStatsData {
    return { allTime, last30Days: last30, last90Days: last90 }
  }

  it('sums all-time and merges both packages per day', () => {
    const combined = combineStats(
      stats(
        100,
        [{ date: 'd1', downloads: 10, estimated: true }],
        [{ date: 'w1', downloads: 70 }]
      ),
      stats(50, [{ date: 'd1', downloads: 5 }], [{ date: 'w1', downloads: 35 }])
    )
    expect(combined.allTime).toBe(150)
    expect(combined.last30Days[0]).toEqual({
      date: 'd1',
      nuqs: 10,
      'next-usequerystate': 5,
      estimated: { nuqs: true }
    })
    expect(combined.last90Days[0]).toEqual({
      date: 'w1',
      nuqs: 70,
      'next-usequerystate': 35
    })
  })

  it('combines only dates shared by both packages', () => {
    const combined = combineStats(
      stats(
        100,
        [
          { date: 'd1', downloads: 10 },
          { date: 'd2', downloads: 20 }
        ],
        [{ date: 'w1', downloads: 70 }]
      ),
      stats(
        50,
        [
          { date: 'd2', downloads: 5, estimated: true },
          { date: 'd3', downloads: 6 }
        ],
        [{ date: 'w2', downloads: 35 }]
      )
    )

    expect(combined.last30Days).toEqual([
      {
        date: 'd2',
        nuqs: 20,
        'next-usequerystate': 5,
        estimated: { 'next-usequerystate': true }
      }
    ])
    expect(combined.last90Days).toEqual([])
  })
})
