import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test/utils'
import Signup from '../pages/Signup'

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

describe('Signup Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ============ UI Rendering Tests ============
    describe('UI Elements', () => {
        it('renders activate account title', () => {
            render(<Signup />)
            expect(screen.getByText('Activate Account')).toBeInTheDocument()
        })

        it('renders instruction text', () => {
            render(<Signup />)
            expect(screen.getByText('Enter your invite code to get started.')).toBeInTheDocument()
        })

        it('renders invite code label', () => {
            render(<Signup />)
            expect(screen.getByText('Invite Code')).toBeInTheDocument()
        })

        it('renders email label', () => {
            render(<Signup />)
            expect(screen.getByText('Email')).toBeInTheDocument()
        })

        it('renders create password label', () => {
            render(<Signup />)
            expect(screen.getByText('Create Password')).toBeInTheDocument()
        })

        it('renders invite code input with placeholder', () => {
            render(<Signup />)
            expect(screen.getByPlaceholderText('INV-XXXX-XXXX')).toBeInTheDocument()
        })

        it('renders email input with placeholder', () => {
            render(<Signup />)
            expect(screen.getByPlaceholderText('student@school.com')).toBeInTheDocument()
        })

        it('renders password input with placeholder', () => {
            render(<Signup />)
            expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
        })

        it('renders complete registration button', () => {
            render(<Signup />)
            expect(screen.getByRole('button', { name: /complete registration/i })).toBeInTheDocument()
        })

        it('renders back to login link', () => {
            render(<Signup />)
            expect(screen.getByText('Back to Login')).toBeInTheDocument()
        })

        it('renders SchoolMS branding', () => {
            render(<Signup />)
            expect(screen.getByText('SchoolMS')).toBeInTheDocument()
        })

        it('renders community heading', () => {
            render(<Signup />)
            expect(screen.getByText('Community')).toBeInTheDocument()
        })
    })

    // ============ Form Validation Tests ============
    describe('Form Validation', () => {
        it('invite code input is required', () => {
            render(<Signup />)
            const input = screen.getByPlaceholderText('INV-XXXX-XXXX') as HTMLInputElement
            expect(input.required).toBe(true)
        })

        it('email input is required', () => {
            render(<Signup />)
            const input = screen.getByPlaceholderText('student@school.com') as HTMLInputElement
            expect(input.required).toBe(true)
        })

        it('password input is required', () => {
            render(<Signup />)
            const input = screen.getByPlaceholderText('••••••••') as HTMLInputElement
            expect(input.required).toBe(true)
        })

        it('invite code input has text type', () => {
            render(<Signup />)
            const input = screen.getByPlaceholderText('INV-XXXX-XXXX') as HTMLInputElement
            expect(input.type).toBe('text')
        })

        it('email input has email type', () => {
            render(<Signup />)
            const input = screen.getByPlaceholderText('student@school.com') as HTMLInputElement
            expect(input.type).toBe('email')
        })

        it('password input has password type', () => {
            render(<Signup />)
            const input = screen.getByPlaceholderText('••••••••') as HTMLInputElement
            expect(input.type).toBe('password')
        })
    })

    // ============ User Interaction Tests ============
    describe('User Interaction', () => {
        it('allows entering invite code', () => {
            render(<Signup />)
            const input = screen.getByPlaceholderText('INV-XXXX-XXXX') as HTMLInputElement
            fireEvent.change(input, { target: { value: 'ABC123' } })
            expect(input.value).toBe('ABC123')
        })

        it('allows entering email', () => {
            render(<Signup />)
            const input = screen.getByPlaceholderText('student@school.com') as HTMLInputElement
            fireEvent.change(input, { target: { value: 'new@test.com' } })
            expect(input.value).toBe('new@test.com')
        })

        it('allows entering password', () => {
            render(<Signup />)
            const input = screen.getByPlaceholderText('••••••••') as HTMLInputElement
            fireEvent.change(input, { target: { value: 'password123' } })
            expect(input.value).toBe('password123')
        })

        it('invite code is converted to uppercase', () => {
            render(<Signup />)
            const input = screen.getByPlaceholderText('INV-XXXX-XXXX') as HTMLInputElement
            // The input has uppercase class, so CSS handles this
            expect(input.className).toContain('uppercase')
        })
    })

    // ============ API Integration Tests ============
    describe('API Integration', () => {
        it('submits signup form with credentials', async () => {
            vi.mocked(api.post)
                .mockResolvedValueOnce({ data: {} }) // signup
                .mockResolvedValueOnce({  // auto-login
                    data: {
                        access_token: 'test-token',
                        user: { id: 1, email: 'new@test.com', role: 'STUDENT' }
                    }
                })

            render(<Signup />)

            fireEvent.change(screen.getByPlaceholderText('INV-XXXX-XXXX'), {
                target: { value: 'ABC123' }
            })
            fireEvent.change(screen.getByPlaceholderText('student@school.com'), {
                target: { value: 'new@test.com' }
            })
            fireEvent.change(screen.getByPlaceholderText('••••••••'), {
                target: { value: 'password123' }
            })

            fireEvent.click(screen.getByRole('button', { name: /complete registration/i }))

            await waitFor(() => {
                expect(api.post).toHaveBeenCalledWith('/auth/signup', {
                    email: 'new@test.com',
                    password: 'password123',
                    invite_code: 'ABC123'
                })
            })
        })

        it('auto-logs in after successful signup', async () => {
            vi.mocked(api.post)
                .mockResolvedValueOnce({ data: {} })
                .mockResolvedValueOnce({
                    data: { access_token: 'token', user: { role: 'STUDENT' } }
                })

            render(<Signup />)

            fireEvent.change(screen.getByPlaceholderText('INV-XXXX-XXXX'), {
                target: { value: 'ABC123' }
            })
            fireEvent.change(screen.getByPlaceholderText('student@school.com'), {
                target: { value: 'test@test.com' }
            })
            fireEvent.change(screen.getByPlaceholderText('••••••••'), {
                target: { value: 'password123' }
            })

            fireEvent.click(screen.getByRole('button', { name: /complete registration/i }))

            await waitFor(() => {
                expect(api.post).toHaveBeenCalledTimes(2)
                expect(api.post).toHaveBeenLastCalledWith('/auth/login', expect.any(Object))
            })
        })
    })

    // ============ Error Handling Tests ============
    describe('Error Handling', () => {
        it('shows error on failed signup', async () => {
            vi.mocked(api.post).mockRejectedValueOnce({
                response: { data: { error: 'Invalid invite code' } }
            })

            render(<Signup />)

            fireEvent.change(screen.getByPlaceholderText('INV-XXXX-XXXX'), {
                target: { value: 'INVALID' }
            })
            fireEvent.change(screen.getByPlaceholderText('student@school.com'), {
                target: { value: 'test@test.com' }
            })
            fireEvent.change(screen.getByPlaceholderText('••••••••'), {
                target: { value: 'password123' }
            })

            fireEvent.click(screen.getByRole('button', { name: /complete registration/i }))

            await waitFor(() => {
                expect(screen.getByText('Invalid invite code')).toBeInTheDocument()
            })
        })

        it('shows error on used invite code', async () => {
            vi.mocked(api.post).mockRejectedValueOnce({
                response: { data: { error: 'Invite code already used' } }
            })

            render(<Signup />)

            fireEvent.change(screen.getByPlaceholderText('INV-XXXX-XXXX'), {
                target: { value: 'USED123' }
            })
            fireEvent.change(screen.getByPlaceholderText('student@school.com'), {
                target: { value: 'test@test.com' }
            })
            fireEvent.change(screen.getByPlaceholderText('••••••••'), {
                target: { value: 'password123' }
            })

            fireEvent.click(screen.getByRole('button', { name: /complete registration/i }))

            await waitFor(() => {
                expect(screen.getByText('Invite code already used')).toBeInTheDocument()
            })
        })

        it('shows error on expired invite code', async () => {
            vi.mocked(api.post).mockRejectedValueOnce({
                response: { data: { error: 'Invite code has expired' } }
            })

            render(<Signup />)

            fireEvent.change(screen.getByPlaceholderText('INV-XXXX-XXXX'), {
                target: { value: 'EXPIRED' }
            })
            fireEvent.change(screen.getByPlaceholderText('student@school.com'), {
                target: { value: 'test@test.com' }
            })
            fireEvent.change(screen.getByPlaceholderText('••••••••'), {
                target: { value: 'password123' }
            })

            fireEvent.click(screen.getByRole('button', { name: /complete registration/i }))

            await waitFor(() => {
                expect(screen.getByText('Invite code has expired')).toBeInTheDocument()
            })
        })

        it('shows generic error on network failure', async () => {
            vi.mocked(api.post).mockRejectedValueOnce(new Error('Network Error'))

            render(<Signup />)

            fireEvent.change(screen.getByPlaceholderText('INV-XXXX-XXXX'), {
                target: { value: 'ABC123' }
            })
            fireEvent.change(screen.getByPlaceholderText('student@school.com'), {
                target: { value: 'test@test.com' }
            })
            fireEvent.change(screen.getByPlaceholderText('••••••••'), {
                target: { value: 'password123' }
            })

            fireEvent.click(screen.getByRole('button', { name: /complete registration/i }))

            await waitFor(() => {
                expect(screen.getByText(/signup failed/i)).toBeInTheDocument()
            })
        })
    })

    // ============ Accessibility Tests ============
    describe('Accessibility', () => {
        it('form has proper structure', () => {
            render(<Signup />)
            const form = document.querySelector('form')
            expect(form).toBeInTheDocument()
        })

        it('submit button is of type submit', () => {
            render(<Signup />)
            const button = screen.getByRole('button', { name: /complete registration/i }) as HTMLButtonElement
            expect(button.type).toBe('submit')
        })

        it('inputs are focusable', () => {
            render(<Signup />)
            const inviteInput = screen.getByPlaceholderText('INV-XXXX-XXXX')
            inviteInput.focus()
            expect(document.activeElement).toBe(inviteInput)
        })

        it('back to login link is visible', () => {
            render(<Signup />)
            const backLink = screen.getByText('Back to Login')
            expect(backLink).toBeVisible()
        })
    })
})
