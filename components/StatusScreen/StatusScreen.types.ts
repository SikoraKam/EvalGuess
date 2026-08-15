export interface StatusScreenProps {
  message: string;
  detail?: string;
  /** Presence of a retry handler switches the screen from loading to error. */
  onRetry?: () => void;
}
