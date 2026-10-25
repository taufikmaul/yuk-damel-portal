import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Resilient Error Boundary component based on frontend-patterns.
 * Catches unhandled runtime exceptions in child component trees,
 * preventing blank white-screen crashes and offering a clear recovery path.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  private handleBackHome = () => {
    this.setState({ hasError: false, error: null });
    sessionStorage.setItem('ngabsen_current_view', 'landing');
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#faf6f5] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#f0dbd8] p-6 sm:p-8 shadow-xl shadow-rose-950/5 text-center">
            <div className="size-12 rounded-full bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="size-6" />
            </div>

            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Terjadi Kendala pada Tampilan
            </h2>

            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Sistem mendeteksi galat sementara saat memuat modul antarmuka. Anda dapat mencoba memuat ulang tampilan atau kembali ke beranda utama.
            </p>

            {this.state.error?.message && (
              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-left font-mono text-[11px] text-slate-600 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
              <Button
                type="button"
                onClick={this.handleReset}
                className="bg-[#a9484c] hover:bg-[#8f3b3f] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <RefreshCw className="size-3.5" />
                <span>Muat Ulang Halaman</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={this.handleBackHome}
                className="border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="size-3.5" />
                <span>Kembali ke Beranda</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
