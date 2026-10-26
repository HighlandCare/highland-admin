import { ROWS_PER_PAGE } from "../components/data-table";

export const getListFromResponse = (response, keys = ["data", "feedbacks"]) => {
  if (Array.isArray(response)) {
    return response;
  }

  for (const key of keys) {
    if (Array.isArray(response?.[key])) {
      return response[key];
    }

    if (Array.isArray(response?.data?.[key])) {
      return response.data[key];
    }
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
};

const getResponseTotalPages = (response) =>
  response?.total_pages ??
  response?.totalPages ??
  response?.data?.total_pages ??
  response?.data?.totalPages;

const FETCH_ALL_CONCURRENCY = 8;

/** Loads every page. Page 1 first, then remaining pages in parallel batches. */
export const fetchAllPages = async (
  fetchPage,
  { getItems, listKeys, pageSize = ROWS_PER_PAGE, maxPages = 100, seedResponse } = {}
) => {
  const resolveItems = getItems || ((response) => getListFromResponse(response, listKeys));

  const firstResponse = seedResponse ?? (await fetchPage(1));
  const firstItems = resolveItems(firstResponse);
  const knownTotalPages = getResponseTotalPages(firstResponse);

  if (knownTotalPages != null) {
    const totalPages = Math.min(Math.max(Number(knownTotalPages) || 1, 1), maxPages);
    if (totalPages <= 1) {
      return firstItems;
    }

    let allItems = firstItems;

    for (let start = 2; start <= totalPages; start += FETCH_ALL_CONCURRENCY) {
      const end = Math.min(start + FETCH_ALL_CONCURRENCY - 1, totalPages);
      const batch = await Promise.all(
        Array.from({ length: end - start + 1 }, (_, index) => fetchPage(start + index))
      );
      allItems = allItems.concat(...batch.map(resolveItems));
    }

    return allItems;
  }

  // Fallback when API omits total pages: walk sequentially until a short page.
  if (firstItems.length < pageSize) {
    return firstItems;
  }

  let allItems = firstItems;
  let page = 2;

  while (page <= maxPages) {
    const response = await fetchPage(page);
    const items = resolveItems(response);

    if (!items.length) {
      break;
    }

    allItems = allItems.concat(items);

    if (items.length < pageSize) {
      break;
    }

    page += 1;
  }

  return allItems;
};

export const wrapListResponse = (items, listKey = "data") => ({
  [listKey]: items,
  current_page: 1,
  total_pages: Math.max(1, Math.ceil(items.length / ROWS_PER_PAGE)),
  total_records: items.length,
});
