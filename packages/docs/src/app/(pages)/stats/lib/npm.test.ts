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
  fetchNpmPackage,
  getAllTime,
  getLastNDays,
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
afterEach(() => vi.useRealTimers())

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

describe('getLastNDays', () => {
  it('maps the range response to dated download counts', async () => {
    server.use(
      http.get(rangeEndpoint, () =>
        HttpResponse.json({
          downloads: [
            { downloads: 10, day: '2024-06-01' },
            { downloads: 20, day: '2024-06-02' }
          ]
        })
      )
    )
    await expect(getLastNDays('nuqs', 30)).resolves.toEqual([
      { date: '2024-06-01', downloads: 10 },
      { date: '2024-06-02', downloads: 20 }
    ])
  })

  it('drops a trailing zero-download day (stats not in yet)', async () => {
    server.use(
      http.get(rangeEndpoint, () =>
        HttpResponse.json({
          downloads: [
            { downloads: 20, day: '2024-06-01' },
            { downloads: 0, day: '2024-06-02' }
          ]
        })
      )
    )
    const data = await getLastNDays('nuqs', 30)
    expect(data).toEqual([{ date: '2024-06-01', downloads: 20 }])
  })

  it('returns an empty array on a malformed response', async () => {
    server.use(
      http.get(rangeEndpoint, () => HttpResponse.json({ nope: true }))
    )
    await expect(getLastNDays('nuqs', 30)).resolves.toEqual([])
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
    expect(date.format('YYYY-MM-DD')).toBe('2020-06-01')
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

  it('falls back to the npm stats epoch on a malformed response', async () => {
    server.use(http.get(registryEndpoint, () => HttpResponse.json({})))
    const date = await getPackageCreationDate('nuqs')
    expect(date.format('YYYY-MM-DD')).toBe('2015-01-10')
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

  it('stops and returns the partial sum if a window request fails', async () => {
    server.use(
      http.get(registryEndpoint, () =>
        HttpResponse.json({ time: { created: '2023-01-01T00:00:00Z' } })
      ),
      http.get(rangeEndpoint, () => HttpResponse.json({ broken: true }))
    )
    await expect(getAllTime('nuqs')).resolves.toBe(0)
  })
})

describe('fetchNpmPackage', () => {
  it('combines all-time, last-30-day and weekly-grouped last-90-day stats', async () => {
    const days = Array.from({ length: 14 }, (_, i) => ({
      downloads: 100,
      day: `2024-06-${String(i + 1).padStart(2, '0')}`
    }))
    server.use(
      http.get(registryEndpoint, () =>
        HttpResponse.json({ time: { created: '2024-06-01T00:00:00Z' } })
      ),
      http.get(rangeEndpoint, () => HttpResponse.json({ downloads: days }))
    )
    const stats = await fetchNpmPackage('nuqs')
    // One 18-month window from a June-2024 creation date: 14 × 100.
    expect(stats.allTime).toBe(1400)
    expect(stats.last30Days).toHaveLength(14)
    // last90Days is grouped by ISO week, so fewer entries keyed as 'YYWww.
    expect(stats.last90Days.length).toBeLessThan(14)
    expect(stats.last90Days.every(d => /^'\d{2}W\d{2}$/.test(d.date))).toBe(true)
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
      estimated: true
    })
    expect(combined.last90Days[0]).toEqual({
      date: 'w1',
      nuqs: 70,
      'next-usequerystate': 35
    })
  })
})
