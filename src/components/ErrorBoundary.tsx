"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log to external service (e.g., Sentry)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to localStorage for debugging
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      };
      
      const existingLogs = JSON.parse(localStorage.getItem("error-logs") || "[]");
      existingLogs.push(errorLog);
      
      // Keep only last 10 errors
      if (existingLogs.length > 10) {
        existingLogs.shift();
      }
      
      localStorage.setItem("error-logs", JSON.stringify(existingLogs));
    } catch (e) {
      console.error("Failed to log error:", e);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
          <Card className="border-red-500/30 bg-slate-900/90 backdrop-blur max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30">
                <p className="text-sm text-red-300 font-medium mb-2">
                  {this.state.error?.message || "An unexpected error occurred"}
                </p>
                {process.env.NODE_ENV === "development" && this.state.error?.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-400 cursor-pointer hover:text-red-300">
                      View error details
                    </summary>
                    <pre className="mt-2 text-xs text-red-300 overflow-auto max-h-40 p-2 bg-black/30 rounded">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-300">
                  Don't worry! Your data is safe. Try one of these options:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={this.handleReset}
                    className="flex-1 bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-500">
                  If this problem persists, please contact support with the error details above.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Widget-specific error boundary with auto-recovery
export function WidgetErrorBoundary({ children, widgetType }: { children: ReactNode; widgetType: string }) {
  return (
    <ErrorBoundary
      fallback={
        <Card className="border-red-500/30 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
          <CardHeader className="p-3 pb-2 shrink-0">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Widget Error
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 flex-1 min-h-0 flex flex-col items-center justify-center gap-2">
            <p className="text-xs text-slate-400 text-center">
              The {widgetType} widget encountered an error
            </p>
            <Button
              size="sm"
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Reload
            </Button>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  );
}