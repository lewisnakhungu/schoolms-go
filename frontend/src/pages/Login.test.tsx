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
})
