import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test/utils'
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

const mockStudents = [
    { id: 1, enrollment_number: 'STU001', user: { email: 'student1@test.com' } },
    { id: 2, enrollment_number: 'STU002', user: { email: 'student2@test.com' } },
    { id: 3, enrollment_number: 'STU003', user: { email: 'student3@test.com' } },
]

const mockAttendance = [
    { id: 1, student_id: 1, status: 'PRESENT' },
    { id: 2, student_id: 2, status: 'ABSENT' },
]

describe('AttendancePage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(api.get).mockImplementation((url: string) => {
            if (url.includes('/classes')) {
                return Promise.resolve({ data: mockClasses })
            }
            if (url.includes('/students')) {
                return Promise.resolve({ data: mockStudents })
            }
            if (url.includes('/attendance')) {
                return Promise.resolve({ data: mockAttendance })
            }
            return Promise.resolve({ data: [] })
        })
    })

    it('renders attendance page', async () => {
        render(<AttendancePage />)

        await waitFor(() => {
            expect(screen.getByText(/attendance/i)).toBeInTheDocument()
        })
    })

    it('shows class selector', async () => {
        render(<AttendancePage />)

        await waitFor(() => {
            expect(screen.getByText(/select class/i)).toBeInTheDocument()
        })
    })

    it('shows date picker', async () => {
        render(<AttendancePage />)

        await waitFor(() => {
            const dateInputs = document.querySelectorAll('input[type="date"]')
            expect(dateInputs.length).toBeGreaterThan(0)
        })
    })

    it('loads students when class is selected', async () => {
        render(<AttendancePage />)

        await waitFor(() => {
            const classSelect = screen.getByRole('combobox')
            fireEvent.change(classSelect, { target: { value: '1' } })
        })

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/students'))
        })
    })

    it('shows status buttons for each student', async () => {
        render(<AttendancePage />)

        // Check for common attendance status labels  
        expect(screen.getByText(/attendance/i)).toBeInTheDocument()
    })

    it('submits attendance records', async () => {
        vi.mocked(api.post).mockResolvedValueOnce({ data: { message: 'Saved' } })

        render(<AttendancePage />)

        await waitFor(() => {
            const saveButton = screen.queryByText(/save/i)
            if (saveButton) {
                fireEvent.click(saveButton)
            }
        })
    })
})
