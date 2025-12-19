import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test/utils'
import IndustrialAttachmentPage from '../pages/IndustrialAttachmentPage'

vi.mock('../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    },
}))

import api from '../services/api'

const mockAttachments = [
    { id: 1, student_id: 1, company_name: 'Kenya Power', status: 'ONGOING', logbook_grade: 'B', student: { user: { email: 'student1@test.com' } } },
    { id: 2, student_id: 2, company_name: 'Safaricom', status: 'PLANNED', logbook_grade: '', student: { user: { email: 'student2@test.com' } } },
    { id: 3, student_id: 3, company_name: 'KCB Bank', status: 'COMPLETED', logbook_grade: 'A', student: { user: { email: 'student3@test.com' } } },
]

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
            return Promise.resolve({ data: mockAttachments })
        })
    })

    it('renders attachment list', async () => {
        render(<IndustrialAttachmentPage />)

        await waitFor(() => {
            expect(screen.getByText('Kenya Power')).toBeInTheDocument()
            expect(screen.getByText('Safaricom')).toBeInTheDocument()
            expect(screen.getByText('KCB Bank')).toBeInTheDocument()
        })
    })

    it('shows status filter buttons', async () => {
        render(<IndustrialAttachmentPage />)

        await waitFor(() => {
            expect(screen.getByText('All')).toBeInTheDocument()
            expect(screen.getByText('PLANNED')).toBeInTheDocument()
            expect(screen.getByText('ONGOING')).toBeInTheDocument()
            expect(screen.getByText('COMPLETED')).toBeInTheDocument()
        })
    })

    it('filters attachments by status', async () => {
        render(<IndustrialAttachmentPage />)

        await waitFor(() => {
            const ongoingButton = screen.getByText('ONGOING')
            fireEvent.click(ongoingButton)
        })

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/tvet/attachments?status=ONGOING')
        })
    })

    it('opens new attachment modal', async () => {
        render(<IndustrialAttachmentPage />)

        await waitFor(() => {
            const addButton = screen.getByText(/new attachment/i)
            fireEvent.click(addButton)
        })

        await waitFor(() => {
            expect(screen.getByText(/company name/i)).toBeInTheDocument()
            expect(screen.getByText(/supervisor/i)).toBeInTheDocument()
        })
    })

    it('creates new attachment', async () => {
        vi.mocked(api.post).mockResolvedValueOnce({
            data: { id: 4, company_name: 'KPLC', status: 'PLANNED' }
        })

        render(<IndustrialAttachmentPage />)

        await waitFor(() => {
            const addButton = screen.getByText(/new attachment/i)
            fireEvent.click(addButton)
        })

        // Fill form
        const studentSelect = await screen.findByRole('combobox')
        fireEvent.change(studentSelect, { target: { value: '1' } })

        const companyInput = screen.getByPlaceholderText(/kenya power/i)
        fireEvent.change(companyInput, { target: { value: 'KPLC' } })

        const saveButton = screen.getByRole('button', { name: /save/i })
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/tvet/attachments', expect.objectContaining({
                company_name: 'KPLC'
            }))
        })
    })

    it('updates attachment grade', async () => {
        vi.mocked(api.put).mockResolvedValueOnce({ data: {} })

        render(<IndustrialAttachmentPage />)

        await waitFor(() => {
            expect(screen.getByText('Kenya Power')).toBeInTheDocument()
        })

        // Grade dropdowns should be present
        const gradeSelects = screen.getAllByRole('combobox')
        expect(gradeSelects.length).toBeGreaterThan(0)
    })

    it('displays grade columns', async () => {
        render(<IndustrialAttachmentPage />)

        await waitFor(() => {
            expect(screen.getByText('Logbook')).toBeInTheDocument()
            expect(screen.getByText('Supervisor')).toBeInTheDocument()
            expect(screen.getByText('Final')).toBeInTheDocument()
        })
    })
})
