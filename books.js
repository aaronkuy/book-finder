// Everything that can be decided without a browser lives here, so that
// `node --test` can check it: the request URL and the mapping from an
// Open Library search document to what a result card shows.

const SEARCH_ENDPOINT = "https://openlibrary.org/search.json";
const COVER_ENDPOINT = "https://covers.openlibrary.org/b/id";
const SITE = "https://openlibrary.org";

// Ask only for what a card shows. Without `fields` every document comes
// back with dozens of properties (ISBN lists, subjects, ...).
const FIELDS = ["key", "title", "author_name", "first_publish_year", "cover_i"];

export const RESULT_LIMIT = 20;

// Open Library rejects shorter terms with HTTP 422 ("Query too short").
// Checking first saves the request and allows a precise message.
export const MIN_QUERY_LENGTH = 3;

/**
 * @param {string} query search term exactly as the user typed it
 * @returns {string} request URL for the Open Library search
 */
export function buildSearchUrl(query) {
    const url = new URL(SEARCH_ENDPOINT);
    // searchParams encodes the term. Put into the string by hand, "C#" would
    // end at the "#" and "Dungeons & Dragons" would be cut at the "&".
    url.searchParams.set("q", query);
    url.searchParams.set("fields", FIELDS.join(","));
    url.searchParams.set("limit", String(RESULT_LIMIT));
    return url.toString();
}

/**
 * @param {unknown} coverId `cover_i` of a search document
 * @returns {string|null} image URL, or null when the book has no cover
 */
export function coverUrl(coverId) {
    // The address is built from a checked number and never taken from the
    // response as a string, so the response cannot point the page at
    // another host.
    if (!Number.isInteger(coverId) || coverId <= 0) {
        return null;
    }
    // default=false: answer 404 for a missing cover instead of a blank
    // 1x1 image, so the page can show its own placeholder.
    return `${COVER_ENDPOINT}/${coverId}-M.jpg?default=false`;
}

/**
 * @param {unknown} key `key` of a search document, e.g. "/works/OL893415W"
 * @returns {string|null} page of the work on openlibrary.org
 */
export function workUrl(key) {
    if (typeof key !== "string" || !/^\/works\/OL\d+W$/.test(key)) {
        return null;
    }
    return SITE + key;
}

/**
 * Reduces a search document to the values a result card needs.
 * Every field of a document is optional, so each one gets a fallback.
 *
 * @param {object} doc one entry of `docs` in the search response
 */
export function toBook(doc) {
    const authors = Array.isArray(doc.author_name)
        ? doc.author_name.filter((name) => typeof name === "string")
        : [];

    return {
        title: typeof doc.title === "string" && doc.title.trim() ? doc.title : "Untitled",
        authors,
        year: Number.isInteger(doc.first_publish_year) ? doc.first_publish_year : null,
        coverUrl: coverUrl(doc.cover_i),
        url: workUrl(doc.key),
    };
}
