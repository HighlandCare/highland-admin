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

/** True when a list response (or array) already has rows to keep on screen. */
export const listHasRows = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  return getListFromResponse(value).length > 0;
};

export const getResponseTotalPages = (response) =>
  response?.total_pages ??
  response?.totalPages ??
  response?.data?.total_pages ??
  response?.data?.totalPages;

/**
 * Loads every page. Fetches page 1 first (unless seedResponse is passed),
 * then remaining pages in parallel.
 */
export const fetchAllPages = async (
  fetchPage,
  {
    getItems,
    listKeys,
    pageSize = ROWS_PER_PAGE,
    maxPages = 100,
    seedResponse = null,
  } = {}
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

    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => fetchPage(index + 2))
    );

    return firstItems.concat(...rest.map(resolveItems));
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
