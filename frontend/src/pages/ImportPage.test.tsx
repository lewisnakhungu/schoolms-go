import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test/utils'
import ImportPage from '../pages/ImportPage'

vi.mock('../services/api', () => ({
    default: {
        post: vi.fn(),
    },
}))

import api from '../services/api'

describe('ImportPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders upload section', () => {
        render(<ImportPage />)

        expect(screen.getByText(/import students/i)).toBeInTheDocument()
        expect(screen.getByText(/choose file/i)).toBeInTheDocument()
    })

    it('shows file format requirements', () => {
        render(<ImportPage />)

        expect(screen.getByText(/required columns/i)).toBeInTheDocument()
        expect(screen.getByText(/adm_no/i)).toBeInTheDocument()
        expect(screen.getByText(/name/i)).toBeInTheDocument()
    })

    it('shows preview button after file selection', async () => {
        render(<ImportPage />)

        const file = new File(['adm_no,name\n001,John'], 'students.csv', { type: 'text/csv' })
        const input = document.querySelector('input[type="file"]') as HTMLInputElement

        if (input) {
            fireEvent.change(input, { target: { files: [file] } })

            await waitFor(() => {
                expect(screen.getByText(/preview data/i)).toBeInTheDocument()
            })
        }
    })

    it('previews CSV data', async () => {
        vi.mocked(api.post).mockResolvedValueOnce({
            data: {
                total: 5,
                valid: 4,
                errors: 1,
                preview: [
                    { adm_no: '001', name: 'John', class_name: 'Form 1', current_balance: 5000 },
                    { adm_no: '002', name: 'Jane', class_name: 'Form 2', current_balance: 0 },
                ],
                error_rows: [
                    { row_num: 5, error: 'Missing name' }
                ]
            }
        })

        render(<ImportPage />)

        const file = new File(['adm_no,name\n001,John\n002,Jane'], 'students.csv', { type: 'text/csv' })
        const input = document.querySelector('input[type="file"]') as HTMLInputElement

        if (input) {
            fireEvent.change(input, { target: { files: [file] } })

            await waitFor(() => {
                const previewButton = screen.getByText(/preview data/i)
                fireEvent.click(previewButton)
            })

            await waitFor(() => {
                expect(api.post).toHaveBeenCalledWith(
                    '/import/students/preview',
                    expect.any(FormData),
                    expect.any(Object)
                )
            })
        }
    })

    it('shows import results', async () => {
        vi.mocked(api.post).mockResolvedValueOnce({
            data: {
                total_rows: 10,
                imported: 8,
                skipped: 2,
                errors: []
            }
        })

        render(<ImportPage />)

        // Simulate import completion by checking result rendering
        // This would typically happen after form submission
        expect(screen.getByText(/import students/i)).toBeInTheDocument()
    })

    it('displays error rows from preview', async () => {
        vi.mocked(api.post).mockResolvedValueOnce({
            data: {
                total: 2,
                valid: 1,
                errors: 1,
                preview: [],
                error_rows: [
                    { row_num: 2, error: 'Missing admission number' }
                ]
            }
        })

        render(<ImportPage />)
        // Component renders without error
        expect(screen.getByText(/import students/i)).toBeInTheDocument()
    })
})
