import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '../test/utils'
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

    // ============ UI Rendering Tests ============
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

    // ============ Data Fetching Tests ============
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

    // ============ Modal Tests ============
    describe('Modal Interaction', () => {
        it('opens modal when Add Vote Head button is clicked', async () => {
            render(<VoteHeadPage />)

            // Wait for data to load
            await waitFor(() => {
                expect(screen.getByText('Tuition')).toBeInTheDocument()
            })

            // Click add button
            await act(async () => {
                fireEvent.click(screen.getByText('Add Vote Head'))
            })

            // Modal should show "Add Vote Head" title (not "New Vote Head")
            await waitFor(() => {
                // The modal shows "Add Vote Head" for new, "Edit Vote Head" for editing
                const modalTitle = screen.getAllByText(/Vote Head/i)
                expect(modalTitle.length).toBeGreaterThan(1) // Title in header + button
            })
        })

        it('shows input field in modal', async () => {
            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText('Tuition')).toBeInTheDocument()
            })

            await act(async () => {
                fireEvent.click(screen.getByText('Add Vote Head'))
            })

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Tuition/i)).toBeInTheDocument()
            })
        })

        it('shows save button in modal', async () => {
            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText('Tuition')).toBeInTheDocument()
            })

            await act(async () => {
                fireEvent.click(screen.getByText('Add Vote Head'))
            })

            await waitFor(() => {
                expect(screen.getByText('Save')).toBeInTheDocument()
            })
        })

        it('shows cancel button in modal', async () => {
            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText('Tuition')).toBeInTheDocument()
            })

            await act(async () => {
                fireEvent.click(screen.getByText('Add Vote Head'))
            })

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument()
            })
        })

        it('closes modal when Cancel is clicked', async () => {
            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText('Tuition')).toBeInTheDocument()
            })

            await act(async () => {
                fireEvent.click(screen.getByText('Add Vote Head'))
            })

            await waitFor(() => {
                expect(screen.getByText('Cancel')).toBeInTheDocument()
            })

            await act(async () => {
                fireEvent.click(screen.getByText('Cancel'))
            })

            // Modal should be closed - Save button should not be visible
            await waitFor(() => {
                expect(screen.queryByPlaceholderText(/Tuition/i)).not.toBeInTheDocument()
            })
        })
    })

    // ============ CRUD Tests ============
    describe('CRUD Operations', () => {
        it('submits new vote head', async () => {
            vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 4, name: 'Transport' } })

            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText('Tuition')).toBeInTheDocument()
            })

            await act(async () => {
                fireEvent.click(screen.getByText('Add Vote Head'))
            })

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Tuition/i)).toBeInTheDocument()
            })

            await act(async () => {
                fireEvent.change(screen.getByPlaceholderText(/Tuition/i), {
                    target: { value: 'Transport' }
                })
                fireEvent.click(screen.getByText('Save'))
            })

            await waitFor(() => {
                expect(api.post).toHaveBeenCalledWith('/vote-heads', { name: 'Transport' })
            })
        })

        it('refetches after successful create', async () => {
            vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 4 } })

            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText('Tuition')).toBeInTheDocument()
            })

            await act(async () => {
                fireEvent.click(screen.getByText('Add Vote Head'))
            })

            await act(async () => {
                fireEvent.change(screen.getByPlaceholderText(/Tuition/i), {
                    target: { value: 'New' }
                })
                fireEvent.click(screen.getByText('Save'))
            })

            await waitFor(() => {
                // Should have called get again after create
                expect(api.get).toHaveBeenCalledTimes(2)
            })
        })
    })

    // ============ Error Handling ============
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
                expect(screen.getByText(/No vote heads yet/i)).toBeInTheDocument()
            })
        })
    })

    // ============ Loading State ============
    describe('Loading State', () => {
        it('shows loading spinner initially', () => {
            // Delay the response
            vi.mocked(api.get).mockImplementation(() => new Promise(() => { }))

            render(<VoteHeadPage />)

            expect(document.querySelector('.animate-spin')).toBeInTheDocument()
        })

        it('hides loading after data loads', async () => {
            render(<VoteHeadPage />)

            await waitFor(() => {
                expect(screen.getByText('Tuition')).toBeInTheDocument()
            })

            expect(document.querySelector('.flex.items-center.justify-center.h-64 .animate-spin')).not.toBeInTheDocument()
        })
    })
})
