import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '../test/utils'
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

    // ============ UI Rendering Tests ============
    describe('UI Elements', () => {
        it('renders page title', () => {
            render(<ImportPage />)
            expect(screen.getByText('Import Students')).toBeInTheDocument()
        })

        it('shows page description', () => {
            render(<ImportPage />)
            expect(screen.getByText(/Upload CSV\/Excel file to bulk import students/i)).toBeInTheDocument()
        })

        it('shows upload section title', () => {
            render(<ImportPage />)
            expect(screen.getByText('Upload Student Data')).toBeInTheDocument()
        })

        it('shows choose file button', () => {
            render(<ImportPage />)
            expect(screen.getByText('Choose File')).toBeInTheDocument()
        })

        it('shows file format info section', () => {
            render(<ImportPage />)
            expect(screen.getByText('File Format Requirements')).toBeInTheDocument()
        })

        it('shows required columns header', () => {
            render(<ImportPage />)
            expect(screen.getByText(/Required columns:/i)).toBeInTheDocument()
        })

        it('shows admission number in requirements', () => {
            render(<ImportPage />)
            expect(screen.getByText(/adm_no/i)).toBeInTheDocument()
        })

        it('shows optional columns header', () => {
            render(<ImportPage />)
            expect(screen.getByText(/Optional:/i)).toBeInTheDocument()
        })

        it('shows default password info', () => {
            render(<ImportPage />)
            expect(screen.getByText(/changeme123/i)).toBeInTheDocument()
        })

        it('shows duplicates info', () => {
            render(<ImportPage />)
            expect(screen.getByText(/Duplicates will be skipped/i)).toBeInTheDocument()
        })
    })

    // ============ File Input Tests ============
    describe('File Input', () => {
        it('has file input element', () => {
            render(<ImportPage />)
            const fileInput = document.querySelector('input[type="file"]')
            expect(fileInput).toBeInTheDocument()
        })

        it('file input accepts csv files', () => {
            render(<ImportPage />)
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
            expect(fileInput?.accept).toContain('.csv')
        })

        it('file input accepts xlsx files', () => {
            render(<ImportPage />)
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
            expect(fileInput?.accept).toContain('.xlsx')
        })

        it('file input accepts xls files', () => {
            render(<ImportPage />)
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
            expect(fileInput?.accept).toContain('.xls')
        })
    })

    // ============ File Upload Flow ============
    describe('File Upload', () => {
        it('shows preview button after file selection', async () => {
            render(<ImportPage />)

            const file = new File(['adm_no,name\n001,John'], 'students.csv', { type: 'text/csv' })
            const input = document.querySelector('input[type="file"]') as HTMLInputElement

            if (input) {
                fireEvent.change(input, { target: { files: [file] } })

                await waitFor(() => {
                    expect(screen.getByText(/preview/i)).toBeInTheDocument()
                })
            }
        })

        it('displays selected filename', async () => {
            render(<ImportPage />)

            const file = new File(['adm_no,name\n001,John'], 'students.csv', { type: 'text/csv' })
            const input = document.querySelector('input[type="file"]') as HTMLInputElement

            if (input) {
                fireEvent.change(input, { target: { files: [file] } })

                await waitFor(() => {
                    expect(screen.getByText(/students.csv/i)).toBeInTheDocument()
                })
            }
        })
    })

    // ============ Preview API Tests ============
    describe('Preview API', () => {
        it('calls preview endpoint', async () => {
            vi.mocked(api.post).mockResolvedValueOnce({
                data: {
                    total: 5,
                    valid: 4,
                    errors: 1,
                    preview: [
                        { adm_no: '001', name: 'John', class_name: 'Form 1' },
                    ],
                    error_rows: []
                }
            })

            render(<ImportPage />)

            const file = new File(['adm_no,name\n001,John'], 'students.csv', { type: 'text/csv' })
            const input = document.querySelector('input[type="file"]') as HTMLInputElement

            if (input) {
                fireEvent.change(input, { target: { files: [file] } })

                await waitFor(() => {
                    const previewButton = screen.getByText(/preview/i)
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
    })

    // ============ Error Handling ============
    describe('Error Handling', () => {
        it('handles preview error', async () => {
            vi.mocked(api.post).mockRejectedValueOnce({
                response: { data: { error: 'Invalid file format' } }
            })

            render(<ImportPage />)

            const file = new File(['invalid content'], 'bad.txt', { type: 'text/plain' })
            const input = document.querySelector('input[type="file"]') as HTMLInputElement

            if (input) {
                fireEvent.change(input, { target: { files: [file] } })

                await waitFor(() => {
                    const previewButton = screen.getByText(/preview/i)
                    fireEvent.click(previewButton)
                })

                await waitFor(() => {
                    expect(api.post).toHaveBeenCalled()
                })
            }
        })
    })

    // ============ Accessibility ============
    describe('Accessibility', () => {
        it('file input is accessible', () => {
            render(<ImportPage />)
            const fileInput = document.querySelector('input[type="file"]')
            expect(fileInput).toBeInTheDocument()
        })

        it('choose file button is clickable', () => {
            render(<ImportPage />)
            const button = screen.getByText('Choose File')
            expect(button).toBeEnabled()
        })
    })
})
