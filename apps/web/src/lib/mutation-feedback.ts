export type MutationFeedback = {
  successMessage?: string;
  errorDisplay?: 'toast' | 'inline';
};

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: MutationFeedback;
  }
}
