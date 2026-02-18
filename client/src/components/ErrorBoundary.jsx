import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-900 text-white min-h-screen">
                    <h1 className="text-2xl font-bold">Something went wrong.</h1>
                    <pre className="mt-4 p-2 bg-black rounded overflow-auto">
                        {this.state.error && this.state.error.toString()}
                    </pre>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 rounded">
                        Reload
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
