Library Books REST API Design

Overview

This API allows users to view, add, update, and delete books in a library.

Base URL: /api

1. List All Books

* Method: GET
* Path: /api/books
* Description: Returns a list of all books in the library.
* Success status code: 200 OK

2. Get One Book

* Method: GET
* Path: /api/books/{id}
* Description: Returns details of a single book using its ID.
* Success status code: 200 OK

3. Create a Book

* Method: POST
* Path: /api/books
* Description: Adds a new book to the library.
* Example request body:

{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publishedYear": 1958
}

* Success status code: 201 Created

4. Update a Book

* Method: PUT
* Path: /api/books/{id}
* Description: Updates an existing book using its ID.
* Example request body:

{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publishedYear": 1959
}

* Success status code: 200 OK

5. Delete a Book

* Method: DELETE
* Path: /api/books/{id}
* Description: Deletes a book from the library using its ID.
* Success status code: 204 No Content

6. List Books by Author

* Method: GET
* Path: /api/books?author=Chinua%20Achebe
* Description: Returns books written by the specified author using a query parameter.
* Success status code: 200 OK

Error Codes

400 Bad Request

* Description: The request contains invalid data.
* Example: A request to create a book is missing the required title or author.

404 Not Found

* Description: The requested resource does not exist.
* Example: A request to /api/books/999 searches for a book ID that does not exist.