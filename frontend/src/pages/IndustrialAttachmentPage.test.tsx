import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '../test/utils'
import IndustrialAttachmentPage from '../pages/IndustrialAttachmentPage'

vi.mock('../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    },
}))

import api from '../services/api'

const mockStudents = [
    { id: 1, enrollment_number: 'STU001', user: { email: 'student1@test.com' } },
    { id: 2, enrollment_number: 'STU002', user: { email: 'student2@test.com' } },
]

describe('IndustrialAttachmentPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(api.get).mockImplementation((url: string) => {
            if (url.includes('/students')) {
                return Promise.resolve({ data: mockStudents })
            }
            return Promise.resolve({ data: [] })
        })
    })

    it('renders page title', async () => {
        render(<IndustrialAttachmentPage />)

        await waitFor(() => {
            expect(screen.getByText('Industrial Attachments')).toBeInTheDocument()
        })
    })

    it('shows page description', async () => {
        render(<IndustrialAttachmentPage />)

        await waitFor(() => {
            expect(screen.getByText(/Track TVET student workplace training/i)).toBeInTheDocument()
        })
    })

    it('shows new attachment button', async () => {
        render(<IndustrialAttachmentPage />)

        await waitFor(() => {
            expect(screen.getByText('New Attachment')).toBeInTheDocument()
        })
    })

    it('shows All filter button', async () => {
        render(<IndustrialAttachmentPage />)

        await waitFor(() => {
            expect(screen.getByText('All')).toBeInTheDocument()
        })
    })

    it('shows PLANNED filter button', async () => {
        render(<IndustrialAttachmentPage />)

        await waitFor(() => {
            expect(screen.getByText('PLANNED')).toBeInTheDocument()
        })
    })

    it('shows ONGOING filter button', async () => {
        render(<IndustrialAttachmentPage />)

        await waitFor(() => {
            expect(screen.getByText('ONGOING')).toBeInTheDocument()
        })
    })

    it('shows COMPLETED filter button', async () => {
        render(<IndustrialAttachmentPage />)

        await waitFor(() => {
            expect(screen.getByText('COMPLETED')).toBeInTheDocument()
        })
    })

    it('fetches attachments on mount', async () => {
        render(<IndustrialAttachmentPage />)

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/tvet/attachments')
        })
    })

    it('fetches students on mount', async () => {
        render(<IndustrialAttachmentPage />)

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/students')
        })
    })

    it('shows empty state when no attachments', async () => {
        render(<IndustrialAttachmentPage />)

        await waitFor(() => {
            expect(screen.getByText('No attachments found')).toBeInTheDocument()
        })
    })
})
