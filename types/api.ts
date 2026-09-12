export interface Page<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
  // Fallbacks for compatibility if the backend ever returns top-level pagination again
  totalPages?: number;
  totalElements?: number;
  last?: boolean;
  size?: number;
  number?: number;
  first?: boolean;
  empty?: boolean;
}
