import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  widgetType: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[Widget Error] ${this.props.widgetType}:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-red-500/30 bg-red-900/10 backdrop-blur h-full w-full overflow-hidden flex flex-col">
          <CardHeader className="p-3 pb-2 shrink-0">
            <CardTitle className="text-sm text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Widget Error
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 flex-1 min-h-0 flex flex-col items-center justify-center gap-3">
            <p className="text-xs text-red-300 text-center">
              {this.props.widgetType} widget failed to load
            </p>
            <p className="text-[10px] text-red-400/70 text-center max-w-[200px]">
              {this.state.error?.message || "Unknown error"}
            </p>
            <Button
              size="sm"
              onClick={this.handleRetry}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}