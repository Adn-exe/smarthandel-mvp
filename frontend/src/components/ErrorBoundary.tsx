import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from './ErrorState';
import { trackError } from '../utils/analytics';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Track the error
        trackError(error, errorInfo.componentStack || 'ErrorBoundary');

        // You can also log the error to an error reporting service
        this.logErrorToService(error, errorInfo);
    }

    private logErrorToService(error: Error, errorInfo: ErrorInfo) {
        // In development, log to console
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        } else {
            // In production, this would send to Sentry, LogRocket, etc.
            // For now, we simulate a monitoring service call
            console.log('Sending error to monitoring service...', {
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                timestamp: new Date().toISOString()
            });
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            // If a custom fallback is provided, use it
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Fallback to the standard ErrorState UI
            return (
                <div className="min-h-[400px] flex items-center justify-center p-4">
                    <ErrorState
                        error={this.state.error || "errors.unexpected_error"}
                        onRetry={this.handleReset}
                    />
                </div>
            );
        }

        return this.props.children;
    }
}
