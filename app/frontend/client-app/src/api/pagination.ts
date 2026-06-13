export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
  categorie?: number | string | null;
  poste?: string;
  statut?: string;
  date_reservation?: string;
}

export const isPaginatedResponse = <T>(
  data: T[] | PaginatedResponse<T>
): data is PaginatedResponse<T> => (
  Boolean(data)
  && !Array.isArray(data)
  && Array.isArray((data as PaginatedResponse<T>).results)
  && typeof (data as PaginatedResponse<T>).count === 'number'
);

export const mapPaginatedData = <Input, Output>(
  data: Input[] | PaginatedResponse<Input>,
  mapper: (item: Input) => Output
): Output[] | PaginatedResponse<Output> => {
  if (isPaginatedResponse(data)) {
    return {
      ...data,
      results: data.results.map(mapper),
    };
  }
  return data.map(mapper);
};

export const toPaginatedResponse = <T>(
  data: T[] | PaginatedResponse<T>
): PaginatedResponse<T> => (
  isPaginatedResponse(data)
    ? data
    : {
        count: data.length,
        next: null,
        previous: null,
        results: data,
      }
);

export const getPaginationItems = <T>(data: T[] | PaginatedResponse<T>): T[] => (
  isPaginatedResponse(data) ? data.results : data
);
