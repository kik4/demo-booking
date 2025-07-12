interface StepNavigationProps {
  onPrevious?: () => void;
  onNext?: () => void;
  showPrevious?: boolean;
  nextLabel?: string;
  previousLabel?: string;
  nextDisabled?: boolean;
  disabled?: boolean;
}

export function StepNavigation({
  onPrevious,
  onNext,
  showPrevious = true,
  nextLabel = "次へ",
  previousLabel = "戻る",
  nextDisabled = false,
  disabled = false,
}: StepNavigationProps) {
  return (
    <div className="flex justify-between">
      {showPrevious && onPrevious ? (
        <button
          type="button"
          onClick={onPrevious}
          disabled={disabled}
          className="neumorphism-button-secondary px-6 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50"
        >
          {previousLabel}
        </button>
      ) : (
        <div />
      )}

      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled || disabled}
          className="neumorphism-button-primary px-6 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}
