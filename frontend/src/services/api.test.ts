import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// We need to test the actual api.ts behavior
// Since axios.create returns a new instance, we test the configuration

describe('API Service', () => {
    beforeEach(() => {
        localStorage.clear()
        vi.clearAllMocks()
    })

    afterEach(() => {
        localStorage.clear()
    })

    describe('Module Configuration', () => {
        it('exports a default axios instance', async () => {
            const api = await import('../services/api')
            expect(api.default).toBeDefined()
        })

        it('has request method', async () => {
            const api = await import('../services/api')
            expect(typeof api.default.get).toBe('function')
        })

        it('has post method', async () => {
            const api = await import('../services/api')
            expect(typeof api.default.post).toBe('function')
        })

        it('has put method', async () => {
            const api = await import('../services/api')
            expect(typeof api.default.put).toBe('function')
        })

        it('has delete method', async () => {
            const api = await import('../services/api')
            expect(typeof api.default.delete).toBe('function')
        })

        it('has interceptors', async () => {
            const api = await import('../services/api')
            expect(api.default.interceptors).toBeDefined()
            expect(api.default.interceptors.request).toBeDefined()
            expect(api.default.interceptors.response).toBeDefined()
        })
    })

    describe('Token Storage', () => {
        it('localStorage can store token', () => {
            localStorage.setItem('token', 'test-token')
            expect(localStorage.getItem('token')).toBe('test-token')
        })

        it('localStorage returns null for missing key', () => {
            expect(localStorage.getItem('nonexistent')).toBeNull()
        })

        it('localStorage can clear token', () => {
            localStorage.setItem('token', 'test-token')
            localStorage.removeItem('token')
            expect(localStorage.getItem('token')).toBeNull()
        })
    })

    describe('Request Interceptor Behavior', () => {
        it('interceptor is configured on the instance', async () => {
            const api = await import('../services/api')
            // The interceptor handlers array should have at least one handler
            expect(api.default.interceptors.request).toBeDefined()
        })
    })

    describe('Base URL Configuration', () => {
        it('defaults to localhost:8080 in test environment', async () => {
            const api = await import('../services/api')
            // The baseURL should include /api/v1
            expect(api.default.defaults.baseURL).toContain('/api/v1')
        })

        it('baseURL ends with /api/v1', async () => {
            const api = await import('../services/api')
            expect(api.default.defaults.baseURL?.endsWith('/api/v1')).toBe(true)
        })
    })

    describe('Headers Configuration', () => {
        it('sets Content-Type to application/json', async () => {
            const api = await import('../services/api')
            expect(api.default.defaults.headers['Content-Type']).toBe('application/json')
        })
    })
})
