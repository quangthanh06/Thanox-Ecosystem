import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ComponentErrorBoundaryProps {
  children: React.ReactNode;
  componentName?: string;
  fallback?: React.ReactNode;
}

interface ComponentErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ComponentErrorBoundary extends React.Component<
  ComponentErrorBoundaryProps,
  ComponentErrorBoundaryState
> {
  constructor(props: ComponentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ComponentErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[Component Error in ${this.props.componentName || 'Unknown'}]:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 sm:p-8 rounded-3xl glass-prominent border border-amber-500/30 text-center space-y-3 my-4 max-w-2xl mx-auto shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display text-base font-bold text-[#F4F2FF]">
              Tạm thời không thể tải mục {this.props.componentName || 'này'}
            </h4>
            <p className="text-xs text-[#938EB5]">
              Vui lòng chụp ảnh màn hình thông báo lỗi bên dưới gửi cho Admin để được hỗ trợ.
            </p>
          </div>
          <div className="text-left mt-4 bg-black/60 p-4 rounded-2xl border border-red-500/30 overflow-auto text-xs text-red-300 font-mono">
            <strong>Error:</strong> {this.state.error?.message}
            <br /><br />
            <strong>Stack Trace:</strong><br />
            <pre className="whitespace-pre-wrap">{this.state.error?.stack}</pre>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl btn-liquid-secondary text-xs font-bold text-[#F4F2FF] transition-all cursor-pointer mt-4 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
