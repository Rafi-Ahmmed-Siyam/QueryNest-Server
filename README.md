# QueryNest Server

---

## Project Purpose

This server powers the **QueryNest** application, providing robust APIs for managing user product queries and recommendations, alongside secure authentication.

---

## Live Site

* **Live Site Link:** \[[Insert your Client Live Site Link here](https://query-nest-server-delta.vercel.app/)]

---

## Key Technologies & Packages

* **Node.js** & **Express.js**: Core server runtime and web framework.
* **MongoDB**: Database for storing queries and recommendations.
* **`cors`**: Enables cross-origin requests.
* **`cookie-parser`**: Parses cookies for JWT handling.
* **`jsonwebtoken`**: For JWT-based authentication.
* **`dotenv`**: Manages environment variables.

---

## API Endpoints

### Authentication
* `POST /jwt`: Generates and sets a JWT token.
* `GET /logOut`: Clears the JWT token.

### Query Management
* `POST /add-query`: Adds a new product query.
* `GET /queries`: Retrieves recent queries (e.g., for homepage).
* `GET /allQueries`: Fetches all queries with optional product name search.
* `GET /queries/:email`: Gets a user's specific queries (private).
* `GET /query/:id`: Fetches a single query by ID.
* `DELETE /delete-query/:id`: Deletes a query (private).
* `PUT /update-query/:id`: Updates a query (private).

### Recommendation Management
* `POST /add-recommendation`: Adds a recommendation and increments query count.
* `GET /recommendations`: Retrieves all recommendations.
* `GET /recommendation/:id`: Gets recommendations for a specific query.
* `GET /recommender-data/:email`: Gets recommendations made by or for a user (private).
* `DELETE /delete-recommendetion/:id`: Deletes a recommendation and decrements query count (private).
