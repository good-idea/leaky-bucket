import LeakyBucket from '../index'

jest.useFakeTimers()

describe('Leaky Bucket', () => {
  it('Compute factors correctly', async () => {
    const bucket = new LeakyBucket({
      capacity: 120,
      interval: 60,
      timeout: 300,
    })

    expect(bucket.capacity).toBe(120)
    expect(bucket.interval).toBe(60)
    expect(bucket.timeout).toBe(300)
    expect(bucket.maxCapacity).toBe(600)
    expect(bucket.refillRate).toBe(2)
  })

  it.only('Execute items that are burstable and wait for the ones that cannot burst', async () => {
    const bucket = new LeakyBucket({
      capacity: 100,
      interval: 60,
      timeout: 300,
    })

    const start = Date.now()

    for (let i = 0; i < 100; i++) {
      await bucket.throttle()
    }

    const duration = Date.now() - start
    expect(duration).toBeGreaterThan(600)
    expect(duration).toBeLessThan(700)
  })

  it('Overflow when an excess item is added', async () => {
    const bucket = new LeakyBucket({
      capacity: 100,
      interval: 60,
      timeout: 300,
    })

    bucket.throttle(500)
    const lastThrottle = () => {
      try {
        bucket.throttle(1)
      } catch (e) {
        bucket.end()
        throw e
      }
    }
    expect(lastThrottle).toThrow()
  })

  it('Overlow already added items when pausing the bucket', async () => {
    const bucket = new LeakyBucket({
      capacity: 60,
      interval: 60,
      timeout: 70,
    })

    bucket.throttle(60)
    bucket.throttle(5)
    const lastThrottle = () => {
      try {
        bucket.throttle(5)
      } catch (e) {
        bucket.end()
        throw e
      }
    }
    expect(lastThrottle).toThrow()
    bucket.pause()
  })

  it('Empty bucket promise', async () => {
    const bucket = new LeakyBucket({
      capacity: 60,
      interval: 60,
      timeout: 70,
    })

    const start = Date.now()
    bucket.throttle(60)
    bucket.throttle(1)

    await bucket.isEmpty()

    const duration = Date.now() - start
    expect(duration).toBeGreaterThanOrEqual(1000)
    expect(duration).toBeLessThan(1010)
  })

  it('pausing the bucket', async () => {
    const bucket = new LeakyBucket({
      capacity: 60,
      interval: 60,
      timeout: 120,
    })

    const start = Date.now()

    await bucket.throttle(10)
    await bucket.throttle(10)
    bucket.pause(0.5)
    await bucket.throttle(0.5)

    const duration = Date.now() - start
    expect(duration).toBeGreaterThanOrEqual(1000)
    expect(duration).toBeLessThan(1010)
  })
})
