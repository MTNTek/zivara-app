export enum NotificationType {
  // Application lifecycle
  ApplicationReceived = 'application_received',
  ApplicationUnderReview = 'application_under_review',
  ApplicationShortlisted = 'application_shortlisted',
  ApplicationRejected = 'application_rejected',
  ApplicationHired = 'application_hired',
  ApplicationWithdrawn = 'application_withdrawn',

  // Shift lifecycle
  ShiftAssigned = 'shift_assigned',
  ShiftConfirmed = 'shift_confirmed',
  ShiftCancelled = 'shift_cancelled',
  ShiftCompletionPrompt = 'shift_completion_prompt',

  // Payments
  PaymentProcessed = 'payment_processed',
  PaymentFailed = 'payment_failed',

  // Ratings
  RatingReceived = 'rating_received',

  // Verification
  VerificationApproved = 'verification_approved',
  VerificationRejected = 'verification_rejected',

  // Account
  AccountSuspended = 'account_suspended',

  // Search
  SavedSearchMatch = 'saved_search_match',

  // Disputes
  DisputeResolved = 'dispute_resolved',
}
