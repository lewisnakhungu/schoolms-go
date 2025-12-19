import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { BrowserRouter } from 'react-router-dom'

// Test component that exposes auth context
function TestAuthConsumer() {
    const auth = useAuth()
    return (
        <div>
            <span data-testid="isAuthenticated">{auth.isAuthenticated ? 'true' : 'false'}</span>
            <span data-testid="role">{auth.role || 'none'}</span>
            <span data-testid="token">{auth.token || 'none'}</span>
            <span data-testid="user">{auth.user ? JSON.stringify(auth.user) : 'null'}</span>
            <button onClick={() => auth.login('test-token', 'STUDENT', { id: 1, email: 'test@test.com' })}>
                Login
            </button>
            <button onClick={auth.logout}>Logout</button>
        </div>
    )
}

const renderWithProvider = () => {
    return render(
        <BrowserRouter>
            <AuthProvider>
                <TestAuthConsumer />
            </AuthProvider>
        </BrowserRouter>
    )
}

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear()
        vi.clearAllMocks()
    })

    afterEach(() => {
        localStorage.clear()
    })

    describe('Initial State (no stored token)', () => {
        it('starts with isAuthenticated as false when no token', () => {
            renderWithProvider()
            expect(screen.getByTestId('isAuthenticated').textContent).toBe('false')
        })

        it('starts with no role when no stored role', () => {
            renderWithProvider()
            expect(screen.getByTestId('role').textContent).toBe('none')
        })

        it('starts with no token when not stored', () => {
            renderWithProvider()
            expect(screen.getByTestId('token').textContent).toBe('none')
        })

        it('starts with no user', () => {
            renderWithProvider()
            expect(screen.getByTestId('user').textContent).toBe('null')
        })
    })

    describe('Login Functionality', () => {
        it('sets isAuthenticated to true after login', async () => {
            renderWithProvider()

            await act(async () => {
                screen.getByText('Login').click()
            })

            expect(screen.getByTestId('isAuthenticated').textContent).toBe('true')
        })

        it('sets role after login', async () => {
            renderWithProvider()

            await act(async () => {
                screen.getByText('Login').click()
            })

            expect(screen.getByTestId('role').textContent).toBe('STUDENT')
        })

        it('sets token after login', async () => {
            renderWithProvider()

            await act(async () => {
                screen.getByText('Login').click()
            })

            expect(screen.getByTestId('token').textContent).toBe('test-token')
        })

        it('sets user after login', async () => {
            renderWithProvider()

            await act(async () => {
                screen.getByText('Login').click()
            })

            expect(screen.getByTestId('user').textContent).toContain('test@test.com')
        })

        it('stores token in localStorage', async () => {
            renderWithProvider()

            await act(async () => {
                screen.getByText('Login').click()
            })

            expect(localStorage.getItem('token')).toBe('test-token')
        })

        it('stores role in localStorage', async () => {
            renderWithProvider()

            await act(async () => {
                screen.getByText('Login').click()
            })

            expect(localStorage.getItem('role')).toBe('STUDENT')
        })
    })

    describe('Logout Functionality', () => {
        it('clears authentication on logout', async () => {
            renderWithProvider()

            // Login first
            await act(async () => {
                screen.getByText('Login').click()
            })
            expect(screen.getByTestId('isAuthenticated').textContent).toBe('true')

            // Logout
            await act(async () => {
                screen.getByText('Logout').click()
            })
            expect(screen.getByTestId('isAuthenticated').textContent).toBe('false')
        })

        it('clears role on logout', async () => {
            renderWithProvider()

            await act(async () => {
                screen.getByText('Login').click()
            })
            expect(screen.getByTestId('role').textContent).toBe('STUDENT')

            await act(async () => {
                screen.getByText('Logout').click()
            })
            expect(screen.getByTestId('role').textContent).toBe('none')
        })

        it('clears token from localStorage on logout', async () => {
            renderWithProvider()

            await act(async () => {
                screen.getByText('Login').click()
            })
            expect(localStorage.getItem('token')).toBe('test-token')

            await act(async () => {
                screen.getByText('Logout').click()
            })
            expect(localStorage.getItem('token')).toBeNull()
        })

        it('clears role from localStorage on logout', async () => {
            renderWithProvider()

            await act(async () => {
                screen.getByText('Login').click()
            })
            expect(localStorage.getItem('role')).toBe('STUDENT')

            await act(async () => {
                screen.getByText('Logout').click()
            })
            expect(localStorage.getItem('role')).toBeNull()
        })
    })

    describe('Persistence (pre-existing localStorage)', () => {
        it('restores token from localStorage on mount', () => {
            localStorage.setItem('token', 'existing-token')
            localStorage.setItem('role', 'SCHOOLADMIN')

            renderWithProvider()

            expect(screen.getByTestId('token').textContent).toBe('existing-token')
        })

        it('restores role from localStorage on mount', () => {
            localStorage.setItem('token', 'existing-token')
            localStorage.setItem('role', 'SCHOOLADMIN')

            renderWithProvider()

            expect(screen.getByTestId('role').textContent).toBe('SCHOOLADMIN')
        })

        it('sets isAuthenticated true when token exists in localStorage', () => {
            localStorage.setItem('token', 'existing-token')

            renderWithProvider()

            expect(screen.getByTestId('isAuthenticated').textContent).toBe('true')
        })
    })

    describe('Role-Based Access (all 6 roles)', () => {
        const roles = ['STUDENT', 'TEACHER', 'SCHOOLADMIN', 'SUPERADMIN', 'PARENT', 'FINANCE']

        roles.forEach((role) => {
            it(`supports ${role} role`, () => {
                localStorage.setItem('token', 'token')
                localStorage.setItem('role', role)

                renderWithProvider()

                expect(screen.getByTestId('role').textContent).toBe(role)
            })
        })
    })

    describe('useAuth hook', () => {
        it('throws error when used outside provider', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

            const TestComponent = () => {
                useAuth()
                return null
            }

            expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider')

            consoleSpy.mockRestore()
        })
    })
})
