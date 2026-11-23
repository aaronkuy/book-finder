import assert from "node:assert/strict";
import { test } from "node:test";

import { RESULT_LIMIT, buildSearchUrl, coverUrl, toBook, workUrl } from "../books.js";

test("buildSearchUrl keeps characters that have a meaning in a URL", () => {
    // Each of these broke the search while the term was pasted into the URL.
    for (const query of ["C#", "C++", "Dungeons & Dragons", "100% wolf", "a=b?c"]) {
        const url = new URL(buildSearchUrl(query));
        assert.equal(url.searchParams.get("q"), query);
        assert.equal(url.hash, "");
        assert.deepEqual([...url.searchParams.keys()], ["q", "fields", "limit"]);
    }
});

test("buildSearchUrl asks the Open Library search for a limited set of fields", () => {
    const url = new URL(buildSearchUrl("dune"));
    assert.equal(url.origin + url.pathname, "https://openlibrary.org/search.json");
    assert.equal(url.searchParams.get("limit"), String(RESULT_LIMIT));
    assert.equal(
        url.searchParams.get("fields"),
        "key,title,author_name,first_publish_year,cover_i",
    );
});

test("coverUrl builds the address only from a positive integer", () => {
    assert.equal(
        coverUrl(11481354),
        "https://covers.openlibrary.org/b/id/11481354-M.jpg?default=false",
    );
    for (const id of [undefined, null, -1, 0, 1.5, "11481354", "x/../../evil"]) {
        assert.equal(coverUrl(id), null);
    }
});

test("workUrl accepts work keys and nothing else", () => {
    assert.equal(workUrl("/works/OL893415W"), "https://openlibrary.org/works/OL893415W");
    for (const key of [undefined, 42, "", "//evil.example/works/OL1W", "/works/OL1W/../x", "javascript:alert(1)"]) {
        assert.equal(workUrl(key), null);
    }
});

test("toBook maps a complete search document", () => {
    const book = toBook({
        key: "/works/OL893415W",
        title: "Dune",
        author_name: ["Frank Herbert"],
        first_publish_year: 1965,
        cover_i: 11481354,
    });
    assert.deepEqual(book, {
        title: "Dune",
        authors: ["Frank Herbert"],
        year: 1965,
        coverUrl: "https://covers.openlibrary.org/b/id/11481354-M.jpg?default=false",
        url: "https://openlibrary.org/works/OL893415W",
    });
});

test("toBook falls back when fields are missing or have the wrong type", () => {
    assert.deepEqual(toBook({}), {
        title: "Untitled",
        authors: [],
        year: null,
        coverUrl: null,
        url: null,
    });
    const odd = toBook({ title: "  ", author_name: "Frank Herbert", first_publish_year: "1965" });
    assert.equal(odd.title, "Untitled");
    assert.deepEqual(odd.authors, []);
    assert.equal(odd.year, null);
});
