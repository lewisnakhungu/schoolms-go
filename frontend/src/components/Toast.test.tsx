import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastProvider, useToast } from '../components/Toast'
import { BrowserRouter } from 'react-router-dom'

// Test component that uses the actual toast API
function TestToastConsumer() {
    const { addToast, toasts } = useToast()
    return (
        <div>
            <span data-testid="toastCount">{toasts.length}</span>
            <button onClick={() => addToast({ type: 'success', title: 'Success Title', message: 'Success message' })}>
                Show Success
            </button>
            <button onClick={() => addToast({ type: 'error', title: 'Error Title', message: 'Error message' })}>
                Show Error
            </button>
            <button onClick={() => addToast({ type: 'warning', title: 'Warning Title' })}>
                Show Warning
            </button>
            <button onClick={() => addToast({ type: 'info', title: 'Info Title' })}>
                Show Info
            </button>
        </div>
    )
}

const renderWithProvider = () => {
    return render(
        <BrowserRouter>
            <ToastProvider>
                <TestToastConsumer />
            </ToastProvider>
        </BrowserRouter>
    )
}

describe('Toast Component', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe('ToastProvider', () => {
        it('provides context to children', () => {
            renderWithProvider()
            // If context wasn't provided, this would throw
            expect(screen.getByTestId('toastCount')).toBeInTheDocument()
        })

        it('starts with no toasts', () => {
            renderWithProvider()
            expect(screen.getByTestId('toastCount').textContent).toBe('0')
        })
    })

    describe('addToast functionality', () => {
        it('adds a success toast', async () => {
            renderWithProvider()

            await act(async () => {
                fireEvent.click(screen.getByText('Show Success'))
            })

            expect(screen.getByTestId('toastCount').textContent).toBe('1')
            expect(screen.getByText('Success Title')).toBeInTheDocument()
            expect(screen.getByText('Success message')).toBeInTheDocument()
        })

        it('adds an error toast', async () => {
            renderWithProvider()

            await act(async () => {
                fireEvent.click(screen.getByText('Show Error'))
            })

            expect(screen.getByText('Error Title')).toBeInTheDocument()
            expect(screen.getByText('Error message')).toBeInTheDocument()
        })

        it('adds a warning toast without message', async () => {
            renderWithProvider()

            await act(async () => {
                fireEvent.click(screen.getByText('Show Warning'))
            })

            expect(screen.getByText('Warning Title')).toBeInTheDocument()
        })

        it('adds an info toast', async () => {
            renderWithProvider()

            await act(async () => {
                fireEvent.click(screen.getByText('Show Info'))
            })

            expect(screen.getByText('Info Title')).toBeInTheDocument()
        })
    })

    describe('Multiple toasts', () => {
        it('can add multiple toasts', async () => {
            renderWithProvider()

            await act(async () => {
                fireEvent.click(screen.getByText('Show Success'))
                fireEvent.click(screen.getByText('Show Error'))
            })

            expect(screen.getByTestId('toastCount').textContent).toBe('2')
        })

        it('displays all toast titles when multiple exist', async () => {
            renderWithProvider()

            await act(async () => {
                fireEvent.click(screen.getByText('Show Success'))
                fireEvent.click(screen.getByText('Show Error'))
            })

            expect(screen.getByText('Success Title')).toBeInTheDocument()
            expect(screen.getByText('Error Title')).toBeInTheDocument()
        })
    })

    describe('Auto-dismiss', () => {
        it('removes toast after default duration (4000ms)', async () => {
            renderWithProvider()

            await act(async () => {
                fireEvent.click(screen.getByText('Show Success'))
            })

            expect(screen.getByTestId('toastCount').textContent).toBe('1')

            await act(async () => {
                vi.advanceTimersByTime(4000)
            })

            expect(screen.getByTestId('toastCount').textContent).toBe('0')
        })
    })

    describe('useToast hook', () => {
        it('throws error when used outside provider', () => {
            // Suppress console.error for this test
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

            const TestComponent = () => {
                useToast()
                return null
            }

            expect(() => render(<TestComponent />)).toThrow('useToast must be used within a ToastProvider')

            consoleSpy.mockRestore()
        })
    })
})
