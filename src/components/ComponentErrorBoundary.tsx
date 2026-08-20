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
        <div className="p-6 rounded-2xl bg-[#0F0F1A] border border-amber-500/30 text-center space-y-3 my-4 max-w-2xl mx-auto">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#F0EDFF]">
              Tạm thời không thể tải mục {this.props.componentName || 'này'}
            </h4>
            <p className="text-xs text-[#8B84A8]">
              Vui lòng chụp ảnh màn hình thông báo lỗi bên dưới gửi cho Admin để được hỗ trợ.
            </p>
          </div>
          <div className="text-left mt-4 bg-black/50 p-4 rounded-xl border border-red-500/30 overflow-auto text-xs text-red-400 font-mono">
            <strong>Error:</strong> {this.state.error?.message}
            <br /><br />
            <strong>Stack Trace:</strong><br />
            <pre className="whitespace-pre-wrap">{this.state.error?.stack}</pre>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#161626] border border-white/10 hover:border-[#7C3AED]/40 text-xs font-bold text-[#F0EDFF] hover:text-[#9D5CF6] transition-all cursor-pointer mt-4"
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
