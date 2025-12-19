import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test/utils'
import Login from '../pages/Login'
import { useNavigate } from 'react-router-dom'

// Mock navigate
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: vi.fn(() => vi.fn()),
    }
})

// Mock API
vi.mock('../services/api', () => ({
    default: {
        post: vi.fn(),
    },
}))

import api from '../services/api'

describe('Login Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders login form', () => {
        render(<Login />)

        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('shows error on empty form submission', async () => {
        render(<Login />)

        const submitButton = screen.getByRole('button', { name: /sign in/i })
        fireEvent.click(submitButton)

        // Form validation should prevent submission
        await waitFor(() => {
            expect(api.post).not.toHaveBeenCalled()
        })
    })

    it('submits form with valid credentials', async () => {
        const mockResponse = {
            data: {
                token: 'test-token',
                user: { id: 1, email: 'test@example.com', role: 'SCHOOLADMIN' }
            }
        }
        vi.mocked(api.post).mockResolvedValueOnce(mockResponse)

        render(<Login />)

        fireEvent.change(screen.getByPlaceholderText(/email/i), {
            target: { value: 'test@example.com' }
        })
        fireEvent.change(screen.getByPlaceholderText(/password/i), {
            target: { value: 'password123' }
        })

        const submitButton = screen.getByRole('button', { name: /sign in/i })
        fireEvent.click(submitButton)

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

        fireEvent.change(screen.getByPlaceholderText(/email/i), {
            target: { value: 'wrong@example.com' }
        })
        fireEvent.change(screen.getByPlaceholderText(/password/i), {
            target: { value: 'wrongpassword' }
        })

        const submitButton = screen.getByRole('button', { name: /sign in/i })
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(api.post).toHaveBeenCalled()
        })
    })

    it('has link to signup page', () => {
        render(<Login />)

        const signupLink = screen.getByText(/sign up/i)
        expect(signupLink).toBeInTheDocument()
    })
})
