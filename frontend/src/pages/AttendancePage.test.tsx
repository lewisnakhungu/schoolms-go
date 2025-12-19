import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '../test/utils'
import AttendancePage from '../pages/AttendancePage'

vi.mock('../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}))

import api from '../services/api'

const mockClasses = [
    { id: 1, name: 'Form 1' },
    { id: 2, name: 'Form 2' },
]

describe('AttendancePage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(api.get).mockResolvedValue({ data: mockClasses })
    })

    it('renders page title', async () => {
        render(<AttendancePage />)

        await waitFor(() => {
            expect(screen.getByText('Attendance')).toBeInTheDocument()
        })
    })

    it('renders page description', async () => {
        render(<AttendancePage />)

        await waitFor(() => {
            expect(screen.getByText(/Mark and track student attendance/i)).toBeInTheDocument()
        })
    })

    it('renders select class label', async () => {
        render(<AttendancePage />)

        await waitFor(() => {
            expect(screen.getByText('Select Class')).toBeInTheDocument()
        })
    })

    it('fetches classes on mount', async () => {
        render(<AttendancePage />)

        await waitFor(() => {
            expect(api.get).toHaveBeenCalled()
        })
    })

    it('shows Form 1 class option', async () => {
        render(<AttendancePage />)

        await waitFor(() => {
            expect(screen.getByText('Form 1')).toBeInTheDocument()
        })
    })

    it('shows Form 2 class option', async () => {
        render(<AttendancePage />)

        await waitFor(() => {
            expect(screen.getByText('Form 2')).toBeInTheDocument()
        })
    })
})
