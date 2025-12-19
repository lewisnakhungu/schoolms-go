import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test/utils'
import Login from '../pages/Login'

vi.mock('../services/api', () => ({
    default: {
        post: vi.fn(),
    },
}))

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => vi.fn(),
    }
})

import api from '../services/api'

describe('Login Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ============ UI Rendering Tests ============
    describe('UI Elements', () => {
        it('renders welcome message', () => {
            render(<Login />)
            expect(screen.getByText('Welcome back')).toBeInTheDocument()
        })

        it('renders sign in instruction', () => {
            render(<Login />)
            expect(screen.getByText('Please enter your details to sign in.')).toBeInTheDocument()
        })

        it('renders email label', () => {
            render(<Login />)
            expect(screen.getByText('Email')).toBeInTheDocument()
        })

        it('renders password label', () => {
            render(<Login />)
            expect(screen.getByText('Password')).toBeInTheDocument()
        })

        it('renders email input with placeholder', () => {
            render(<Login />)
            expect(screen.getByPlaceholderText('admin@school.com')).toBeInTheDocument()
        })

        it('renders password input with placeholder', () => {
            render(<Login />)
            expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
        })

        it('renders sign in button', () => {
            render(<Login />)
            expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
        })

        it('renders forgot password link', () => {
            render(<Login />)
            expect(screen.getByText('Forgot password?')).toBeInTheDocument()
        })

        it('renders sign up link', () => {
            render(<Login />)
            expect(screen.getByText('Sign up')).toBeInTheDocument()
        })

        it('renders signup prompt text', () => {
            render(<Login />)
            expect(screen.getByText(/Don't have an account\?/)).toBeInTheDocument()
        })

        it('renders SchoolMS branding', () => {
            render(<Login />)
            expect(screen.getByText('SchoolMS')).toBeInTheDocument()
        })

        it('renders secure system text', () => {
            render(<Login />)
            expect(screen.getByText('Secure System')).toBeInTheDocument()
        })
    })

    // ============ Form Validation Tests ============
    describe('Form Validation', () => {
        it('email input is required', () => {
            render(<Login />)
            const emailInput = screen.getByPlaceholderText('admin@school.com') as HTMLInputElement
            expect(emailInput.required).toBe(true)
        })

        it('password input is required', () => {
            render(<Login />)
            const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement
            expect(passwordInput.required).toBe(true)
        })

        it('email input has correct type', () => {
            render(<Login />)
            const emailInput = screen.getByPlaceholderText('admin@school.com') as HTMLInputElement
            expect(emailInput.type).toBe('email')
        })

        it('password input has correct type', () => {
            render(<Login />)
            const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement
            expect(passwordInput.type).toBe('password')
        })
    })

    // ============ User Interaction Tests ============
    describe('User Interaction', () => {
        it('allows entering email', () => {
            render(<Login />)
            const emailInput = screen.getByPlaceholderText('admin@school.com') as HTMLInputElement
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
            expect(emailInput.value).toBe('test@example.com')
        })

        it('allows entering password', () => {
            render(<Login />)
            const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement
            fireEvent.change(passwordInput, { target: { value: 'password123' } })
            expect(passwordInput.value).toBe('password123')
        })

        it('clears previous input when typing new value', () => {
            render(<Login />)
            const emailInput = screen.getByPlaceholderText('admin@school.com') as HTMLInputElement
            fireEvent.change(emailInput, { target: { value: 'first@test.com' } })
            fireEvent.change(emailInput, { target: { value: 'second@test.com' } })
            expect(emailInput.value).toBe('second@test.com')
        })
    })

    // ============ API Integration Tests ============
    describe('API Integration', () => {
        it('submits form with credentials', async () => {
            vi.mocked(api.post).mockResolvedValueOnce({
                data: {
                    access_token: 'test-token',
                    user: { id: 1, email: 'test@example.com', role: 'SCHOOLADMIN' }
                }
            })

            render(<Login />)

            fireEvent.change(screen.getByPlaceholderText('admin@school.com'), {
                target: { value: 'test@example.com' }
            })
            fireEvent.change(screen.getByPlaceholderText('••••••••'), {
                target: { value: 'password123' }
            })

            fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

            await waitFor(() => {
                expect(api.post).toHaveBeenCalledWith('/auth/login', {
                    email: 'test@example.com',
                    password: 'password123'
                })
            })
        })

        it('calls API only once per submission', async () => {
            vi.mocked(api.post).mockResolvedValueOnce({
                data: {
                    access_token: 'test-token',
                    user: { id: 1, email: 'test@example.com', role: 'STUDENT' }
                }
            })

            render(<Login />)

            fireEvent.change(screen.getByPlaceholderText('admin@school.com'), {
                target: { value: 'test@example.com' }
            })
            fireEvent.change(screen.getByPlaceholderText('••••••••'), {
                target: { value: 'password123' }
            })

            fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

            await waitFor(() => {
                expect(api.post).toHaveBeenCalledTimes(1)
            })
        })
    })

    // ============ Error Handling Tests ============
    describe('Error Handling', () => {
        it('shows error message on failed login', async () => {
            vi.mocked(api.post).mockRejectedValueOnce({
                response: { data: { error: 'Invalid credentials' } }
            })

            render(<Login />)

            fireEvent.change(screen.getByPlaceholderText('admin@school.com'), {
                target: { value: 'wrong@example.com' }
            })
            fireEvent.change(screen.getByPlaceholderText('••••••••'), {
                target: { value: 'wrongpassword' }
            })

            fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

            await waitFor(() => {
                expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
            })
        })

        it('shows generic error on network failure', async () => {
            vi.mocked(api.post).mockRejectedValueOnce(new Error('Network Error'))

            render(<Login />)

            fireEvent.change(screen.getByPlaceholderText('admin@school.com'), {
                target: { value: 'test@example.com' }
            })
            fireEvent.change(screen.getByPlaceholderText('••••••••'), {
                target: { value: 'password123' }
            })

            fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

            await waitFor(() => {
                expect(screen.getByText(/login failed/i)).toBeInTheDocument()
            })
        })

        it('clears error on new submission attempt', async () => {
            vi.mocked(api.post)
                .mockRejectedValueOnce({ response: { data: { error: 'First error' } } })
                .mockResolvedValueOnce({
                    data: { access_token: 'token', user: { role: 'STUDENT' } }
                })

            render(<Login />)

            // First submission - fails
            fireEvent.change(screen.getByPlaceholderText('admin@school.com'), {
                target: { value: 'test@example.com' }
            })
            fireEvent.change(screen.getByPlaceholderText('••••••••'), {
                target: { value: 'wrongpassword' }
            })
            fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

            await waitFor(() => {
                expect(screen.getByText('First error')).toBeInTheDocument()
            })

            // Second submission - should clear error
            fireEvent.change(screen.getByPlaceholderText('••••••••'), {
                target: { value: 'correctpassword' }
            })
            fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

            await waitFor(() => {
                expect(screen.queryByText('First error')).not.toBeInTheDocument()
            })
        })
    })

    // ============ Edge Cases ============
    describe('Edge Cases', () => {
        it('handles empty response gracefully', async () => {
            vi.mocked(api.post).mockResolvedValueOnce({ data: null })

            render(<Login />)

            fireEvent.change(screen.getByPlaceholderText('admin@school.com'), {
                target: { value: 'test@example.com' }
            })
            fireEvent.change(screen.getByPlaceholderText('••••••••'), {
                target: { value: 'password123' }
            })

            // Should not crash
            expect(() => {
                fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
            }).not.toThrow()
        })
    })

    // ============ Accessibility Tests ============
    describe('Accessibility', () => {
        it('form has proper structure', () => {
            render(<Login />)
            const form = document.querySelector('form')
            expect(form).toBeInTheDocument()
        })

        it('submit button is of type submit', () => {
            render(<Login />)
            const button = screen.getByRole('button', { name: /sign in/i }) as HTMLButtonElement
            expect(button.type).toBe('submit')
        })

        it('inputs are focusable', () => {
            render(<Login />)
            const emailInput = screen.getByPlaceholderText('admin@school.com')
            emailInput.focus()
            expect(document.activeElement).toBe(emailInput)
        })
    })
})
