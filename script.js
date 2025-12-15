//Here we're fetch the elements of HTML to JS

const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");

//Awaits the click of 'searchBtn' so it can conduct the command 'searchBooks'

searchBtn.addEventListener("click", searchBooks);

//Asynch prevent that the program blocks, while waiting for an input
async function searchBooks() {
//Extract the text of the Input to the variable query and erase the spaces with trim
    const query = searchInput.value.trim();
//Here we catch up the individuality that the user isn't typing a value in the input field
//then replies the following string
    if (!query) {
        alert("Please enter a book title");
        return;
    }
//We allocate the Google link to the variable 'url', q means query and equates to the variable
//'query' which takes the value dependeing to the users input (potential book title)
    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}`;
//Due to potential errors we use try. Fetch the content of what is concatenated in url.
//and allocate it to response.
    try {
        const response = await fetch(url);
//Parsing it to json to have acces to the items of the body of 'response', saving it to 'data'
        const data = await response.json();
//Array of books test for errors
        displayResults(data.items);
    } catch (error) {
        console.error("Error fetching books:", error);
    }
}
//The Parameter 'books' takes the value of data.
function displayResults(books) {
//Sets <div> empty
    resultsDiv.innerHTML = "";
//Catch the individuality when 'books' has no value aligning with booknames of the index of Google
    if (!books) {
        resultsDiv.innerHTML = "<p>No books found.</p>";
        return;
    }
//Brief spelling (arrow function). Iteration loop for each element in 'books', cashed in book.
//Extract values of volumeInfo of each book of the dictionary, allocated to 'info'.
    books.forEach(book => {
        const info = book.volumeInfo;
//New html container in DOM allocated to 'bookElement' awaits. 
//Save each cache of placeholder book to 'bookElement'
        const bookElement = document.createElement("div");
        bookElement.classList.add("book");
//Revise content container in bookElement. Backticks for variables and multiple strings
//Formation optional chaining, preventing from crash or empty string. Description to an range of 
//index 150 coupled with '...', else empty string, if false.
        bookElement.innerHTML = `
      <h3>${info.title || "No title"}</h3>
      <p><strong>Author:</strong> ${info.authors ? info.authors.join(", ") : "Unknown"}</p>
      <img src="${info.imageLinks?.thumbnail || ""}" />
      <p>${info.description ? info.description.substring(0, 150) + "..." : ""}</p>
    `;
//Display DOM 'bookelement' in browser. Program terminated.
        resultsDiv.appendChild(bookElement);
    });
}
