import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test/utils'
import VoteHeadPage from '../pages/VoteHeadPage'

vi.mock('../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    },
}))

import api from '../services/api'

const mockVoteHeads = [
    { id: 1, name: 'Tuition', priority: 1, is_active: true },
    { id: 2, name: 'R&MI', priority: 2, is_active: true },
    { id: 3, name: 'Activity Fee', priority: 3, is_active: true },
]

describe('VoteHeadPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(api.get).mockResolvedValue({ data: mockVoteHeads })
    })

    it('renders vote head list', async () => {
        render(<VoteHeadPage />)

        await waitFor(() => {
            expect(screen.getByText('Tuition')).toBeInTheDocument()
            expect(screen.getByText('R&MI')).toBeInTheDocument()
            expect(screen.getByText('Activity Fee')).toBeInTheDocument()
        })
    })

    it('shows add vote head button', async () => {
        render(<VoteHeadPage />)

        await waitFor(() => {
            expect(screen.getByText(/add vote head/i)).toBeInTheDocument()
        })
    })

    it('opens modal on add button click', async () => {
        render(<VoteHeadPage />)

        await waitFor(() => {
            const addButton = screen.getByText(/add vote head/i)
            fireEvent.click(addButton)
        })

        await waitFor(() => {
            expect(screen.getByText(/new vote head/i)).toBeInTheDocument()
        })
    })

    it('creates new vote head', async () => {
        vi.mocked(api.post).mockResolvedValueOnce({
            data: { id: 4, name: 'Transport', priority: 4, is_active: true }
        })
        vi.mocked(api.get).mockResolvedValue({ data: [...mockVoteHeads, { id: 4, name: 'Transport', priority: 4, is_active: true }] })

        render(<VoteHeadPage />)

        await waitFor(() => {
            const addButton = screen.getByText(/add vote head/i)
            fireEvent.click(addButton)
        })

        const nameInput = await screen.findByPlaceholderText(/tuition/i)
        fireEvent.change(nameInput, { target: { value: 'Transport' } })

        const saveButton = screen.getByRole('button', { name: /save/i })
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/vote-heads', expect.objectContaining({
                name: 'Transport'
            }))
        })
    })

    it('displays priority order correctly', async () => {
        render(<VoteHeadPage />)

        await waitFor(() => {
            const priorities = screen.getAllByText(/priority/i)
            expect(priorities.length).toBeGreaterThan(0)
        })
    })

    it('shows info card about priority allocation', async () => {
        render(<VoteHeadPage />)

        await waitFor(() => {
            expect(screen.getByText(/payments are allocated/i)).toBeInTheDocument()
        })
    })
})
