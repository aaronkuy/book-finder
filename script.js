import { MIN_QUERY_LENGTH, buildSearchUrl, toBook } from "./books.js";

// Open Library usually answers within two seconds but can hang for much
// longer. After this time the search gives up and says so.
const TIMEOUT_MS = 15000;

const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const statusLine = document.getElementById("status");
const errorLine = document.getElementById("error");
const resultList = document.getElementById("results");

// The search that is allowed to change the page. A newer search replaces it.
let activeRequest = null;

// Submitting the form covers both the button and the Enter key.
form.addEventListener("submit", (event) => {
    event.preventDefault();
    searchBooks(input.value.trim());
});

async function searchBooks(query) {
    if (query.length < MIN_QUERY_LENGTH) {
        showError(`Type at least ${MIN_QUERY_LENGTH} characters: a title, an author or a keyword.`);
        input.focus();
        return;
    }

    // Without this, two quick searches would race and the slower answer
    // would overwrite the newer one.
    activeRequest?.abort();
    const request = new AbortController();
    activeRequest = request;
    const timeout = setTimeout(() => request.abort(), TIMEOUT_MS);

    resultList.replaceChildren();
    showStatus("Searching…");
    // The button stays enabled on purpose: a disabled submit button would
    // also block the Enter key, and a new search may replace a slow one.
    resultList.setAttribute("aria-busy", "true");

    try {
        const response = await fetch(buildSearchUrl(query), { signal: request.signal });
        // fetch() only rejects when the network fails. A 4xx or 5xx answer
        // resolves normally and has to be checked here.
        if (!response.ok) {
            throw new Error(`Open Library answered with HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data.docs)) {
            throw new Error("Open Library answered without a result list");
        }
        showResults(query, data.docs.map(toBook), data.numFound);
    } catch (error) {
        // Aborted by a newer search: that search owns the page now.
        if (activeRequest !== request) {
            return;
        }
        showError(
            request.signal.aborted
                ? "Open Library took too long to answer. Please try again."
                : "The search failed. Open Library may be busy, or you are offline. Please try again.",
        );
    } finally {
        clearTimeout(timeout);
        if (activeRequest === request) {
            resultList.removeAttribute("aria-busy");
        }
    }
}

function showResults(query, books, total) {
    if (books.length === 0) {
        showStatus(`No books found for “${query}”.`);
        return;
    }

    resultList.replaceChildren(...books.map(createCard));

    const shown = books.length.toLocaleString("en");
    const all = Number.isInteger(total) ? total.toLocaleString("en") : shown;
    showStatus(
        all === shown
            ? `${shown} ${books.length === 1 ? "result" : "results"} for “${query}”.`
            : `Showing ${shown} of ${all} results for “${query}”.`,
    );
}

// Cards are built node by node. Titles and names come from a public,
// user-edited catalogue; as textContent they can never turn into markup.
function createCard(book) {
    const card = document.createElement("li");
    card.className = "book";

    const title = document.createElement("h2");
    title.className = "book-title";
    if (book.url) {
        const link = document.createElement("a");
        link.href = book.url;
        link.textContent = book.title;
        title.append(link);
    } else {
        title.textContent = book.title;
    }

    const authors = document.createElement("p");
    authors.className = "book-authors";
    authors.textContent = book.authors.length > 0 ? book.authors.join(", ") : "Unknown author";

    card.append(createCover(book), title, authors);

    if (book.year !== null) {
        const year = document.createElement("p");
        year.className = "book-year";
        year.textContent = `First published ${book.year}`;
        card.append(year);
    }

    return card;
}

function createCover(book) {
    if (!book.coverUrl) {
        return createCoverPlaceholder();
    }

    const image = document.createElement("img");
    image.className = "book-cover";
    image.src = book.coverUrl;
    // Decorative: the title stands right next to the cover.
    image.alt = "";
    image.width = 72;
    image.height = 104;
    image.loading = "lazy";
    // A cover id can exist without an image behind it (404).
    image.addEventListener("error", () => image.replaceWith(createCoverPlaceholder()), {
        once: true,
    });
    return image;
}

function createCoverPlaceholder() {
    const placeholder = document.createElement("div");
    placeholder.className = "book-cover book-cover-missing";
    placeholder.textContent = "No cover";
    return placeholder;
}

function showStatus(message) {
    errorLine.hidden = true;
    errorLine.textContent = "";
    statusLine.textContent = message;
}

function showError(message) {
    statusLine.textContent = "";
    errorLine.textContent = message;
    errorLine.hidden = false;
}
