import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-2xl bg-[#0F0F1A] border border-red-500/20 text-center space-y-4 my-6">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-base text-[#F0EDFF]">
              {this.props.fallbackTitle || 'Đã xảy ra sự cố hiển thị dữ liệu'}
            </h3>
            <p className="text-xs text-[#8B84A8] max-w-md mx-auto">
              Hệ thống đã cách ly lỗi để bảo vệ phiên làm việc của bạn.
            </p>
          </div>
          {this.state.error && (
            <pre className="text-[11px] font-mono text-red-400/80 bg-[#161626] p-3 rounded-xl max-w-lg mx-auto overflow-x-auto text-left">
              {this.state.error.message}
            </pre>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={this.handleReset}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Tải Lại Giao Diện
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
