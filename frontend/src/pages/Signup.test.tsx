import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test/utils'
import Signup from '../pages/Signup'

vi.mock('../services/api', () => ({
    default: {
        post: vi.fn(),
    },
}))

import api from '../services/api'

describe('Signup Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders signup form', () => {
        render(<Signup />)

        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/invite code/i)).toBeInTheDocument()
    })

    it('submits form with valid data', async () => {
        const mockResponse = {
            data: {
                token: 'test-token',
                user: { id: 1, email: 'new@example.com', role: 'STUDENT' }
            }
        }
        vi.mocked(api.post).mockResolvedValueOnce(mockResponse)

        render(<Signup />)

        fireEvent.change(screen.getByPlaceholderText(/email/i), {
            target: { value: 'new@example.com' }
        })
        fireEvent.change(screen.getByPlaceholderText(/password/i), {
            target: { value: 'password123' }
        })
        fireEvent.change(screen.getByPlaceholderText(/invite code/i), {
            target: { value: 'ABC123' }
        })

        const submitButton = screen.getByRole('button', { name: /create account/i })
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/auth/signup', {
                email: 'new@example.com',
                password: 'password123',
                invite_code: 'ABC123'
            })
        })
    })

    it('shows error on invalid invite code', async () => {
        vi.mocked(api.post).mockRejectedValueOnce({
            response: { data: { error: 'Invalid invite code' } }
        })

        render(<Signup />)

        fireEvent.change(screen.getByPlaceholderText(/email/i), {
            target: { value: 'new@example.com' }
        })
        fireEvent.change(screen.getByPlaceholderText(/password/i), {
            target: { value: 'password123' }
        })
        fireEvent.change(screen.getByPlaceholderText(/invite code/i), {
            target: { value: 'INVALID' }
        })

        const submitButton = screen.getByRole('button', { name: /create account/i })
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(api.post).toHaveBeenCalled()
        })
    })

    it('has link to login page', () => {
        render(<Signup />)

        const loginLink = screen.getByText(/sign in/i)
        expect(loginLink).toBeInTheDocument()
    })
})
