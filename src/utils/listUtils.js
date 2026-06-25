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

export const fetchAllPages = async (
  fetchPage,
  { getItems, listKeys, pageSize = ROWS_PER_PAGE, maxPages = 100 } = {}
) => {
  const resolveItems = getItems || ((response) => getListFromResponse(response, listKeys));

  let page = 1;
  let allItems = [];

  while (page <= maxPages) {
    const response = await fetchPage(page);
    const items = resolveItems(response);

    if (!items.length && page > 1) {
      break;
    }

    allItems = allItems.concat(items);

    const responseTotalPages =
      response?.total_pages ??
      response?.totalPages ??
      response?.data?.total_pages ??
      response?.data?.totalPages;

    if (responseTotalPages != null) {
      const totalPages = Math.max(Number(responseTotalPages) || 1, 1);

      if (page >= totalPages) {
        break;
      }

      page += 1;
      continue;
    }

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
