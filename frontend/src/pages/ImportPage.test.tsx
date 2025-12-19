import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '../test/utils'
import ImportPage from '../pages/ImportPage'

vi.mock('../services/api', () => ({
    default: {
        post: vi.fn(),
    },
}))

describe('ImportPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

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
})
