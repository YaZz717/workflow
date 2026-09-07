/** Types génériques pour les pages App Router (Next.js 16, params/searchParams async). */
export type SearchParams = Record<string, string | string[] | undefined>;

export type PageParams<T = Record<string, string>> = {
  params: Promise<T>;
  searchParams: Promise<SearchParams>;
};
