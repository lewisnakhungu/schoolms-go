import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '../test/utils'
import VoteHeadPage from '../pages/VoteHeadPage'

vi.mock('../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
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

    describe('UI Rendering', () => {
        it('renders vote head page title', async () => {
            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText('Vote Heads')).toBeInTheDocument()
            })
        })

        it('displays Kenya-style allocation description', async () => {
            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText(/Kenya-style fee allocation/i)).toBeInTheDocument()
            })
        })

        it('shows Add Vote Head button', async () => {
            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText('Add Vote Head')).toBeInTheDocument()
            })
        })

        it('displays priority-based allocation info card', async () => {
            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText('Priority-Based Allocation')).toBeInTheDocument()
            })
        })

        it('shows priority column header', async () => {
            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText('Priority')).toBeInTheDocument()
            })
        })

        it('shows name column header', async () => {
            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText('Name')).toBeInTheDocument()
            })
        })

        it('shows status column header', async () => {
            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText('Status')).toBeInTheDocument()
            })
        })

        it('shows actions column header', async () => {
            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText('Actions')).toBeInTheDocument()
            })
        })
    })

    describe('Data Fetching', () => {
        it('fetches vote heads on mount', async () => {
            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(api.get).toHaveBeenCalledWith('/vote-heads')
            })
        })

        it('displays vote head names after loading', async () => {
            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText('Tuition')).toBeInTheDocument()
                expect(screen.getByText('R&MI')).toBeInTheDocument()
                expect(screen.getByText('Activity Fee')).toBeInTheDocument()
            })
        })

        it('displays priority numbers', async () => {
            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText('1')).toBeInTheDocument()
                expect(screen.getByText('2')).toBeInTheDocument()
                expect(screen.getByText('3')).toBeInTheDocument()
            })
        })

        it('shows active status badges', async () => {
            render(<VoteHeadPage />)

            await waitFor(() => {
                const activeElements = screen.getAllByText('Active')
                expect(activeElements.length).toBe(3)
            })
        })
    })

    describe('Error Handling', () => {
        it('handles fetch error gracefully', async () => {
            vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'))

            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText('Vote Heads')).toBeInTheDocument()
            })
        })

        it('handles empty vote heads list', async () => {
            vi.mocked(api.get).mockResolvedValueOnce({ data: [] })

            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText('Vote Heads')).toBeInTheDocument()
            })
        })
    })
})
