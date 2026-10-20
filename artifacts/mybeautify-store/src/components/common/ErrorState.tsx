export interface ErrorStateProps {
  retry?: () => void;
  title?: string;
  message?: string;
}

export function ErrorState({
  retry,
  title = 'We hit a quiet patch',
  message = 'Something did not load as expected. Please try again.',
}: ErrorStateProps) {
  return (
    <div className="error-state" data-testid="status-error">
      <h3>{title}</h3>
      <p>{message}</p>
      {retry && (
        <button className="button secondary" onClick={retry} data-testid="button-retry">
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorState;
