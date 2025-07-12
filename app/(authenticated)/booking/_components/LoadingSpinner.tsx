interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export function LoadingSpinner({
  message = "読み込み中...",
  size = "md",
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-4",
    lg: "h-12 w-12 border-4",
  };

  const containerClasses = fullScreen
    ? "flex min-h-screen items-center justify-center"
    : "flex items-center justify-center";

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center">
        <div
          className={`animate-spin rounded-full border-blue-500 border-t-transparent ${sizeClasses[size]}`}
        />
        {message && <p className="mt-2 text-gray-600">{message}</p>}
      </div>
    </div>
  );
}
