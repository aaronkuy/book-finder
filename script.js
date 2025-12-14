const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");

searchBtn.addEventListener("click", searchBooks);

async function searchBooks() {
    const query = searchInput.value.trim();

    if (!query) {
        alert("Please enter a book title");
        return;
    }

    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        displayResults(data.items);
    } catch (error) {
        console.error("Error fetching books:", error);
    }
}

function displayResults(books) {
    resultsDiv.innerHTML = "";

    if (!books) {
        resultsDiv.innerHTML = "<p>No books found.</p>";
        return;
    }

    books.forEach(book => {
        const info = book.volumeInfo;

        const bookElement = document.createElement("div");
        bookElement.classList.add("book");

        bookElement.innerHTML = `
      <h3>${info.title || "No title"}</h3>
      <p><strong>Author:</strong> ${info.authors ? info.authors.join(", ") : "Unknown"}</p>
      <img src="${info.imageLinks?.thumbnail || ""}" />
      <p>${info.description ? info.description.substring(0, 150) + "..." : ""}</p>
    `;

        resultsDiv.appendChild(bookElement);
    });
}
