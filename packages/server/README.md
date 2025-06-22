# Server API (`packages/server`)

This package contains the Express.js backend API for the application. Its primary responsibilities are handling API requests, authenticating users, and interacting with the database.

---

### Setup & Running

1.  **Environment Variables:** Create a `.env` file in the `packages/server` directory and provide the following variables:

    ```
    DATABASE_URL="your-mongodb-connection-string"
    JWT_ACCESS_SECRET="your-access-secret-key"
    JWT_REFRESH_SECRET="your-refresh-secret-key"
    ```

2.  **Install Dependencies:** From the root of the repository:

    ```bash
    bun install
    ```

3.  **Run the Server:**
    ```bash
    cd packages/server
    bun run src/index.ts
    ```
    The server will start on the port defined in your `.env` file or default to `3000`.

### Key Features & Design Decisions

- **Authentication:** The server employs a two-token JWT (JSON Web Token) based authentication strategy.

    - **Access & Refresh Tokens:** Upon successful login, the server generates a short-lived _access token_ and a long-lived _refresh token_. These tokens are explicity signed using the server's secret keys and the user's identity, and implicitly signed using the current timestamp.
    - **Secure Token Storage:** The refresh token is sent to the client via a `httpOnly`, `SameSite=Strict` cookie to prevent access from client-side JavaScript, mitigating XSS and CSRF attacks. The access token is sent in the response body for the client to manage in memory.
    - **Token Refresh:** The client automatically handles rotating tokens once their's is invalidatated.
    - **Token Protection:** The `protect` middleware ensures that protected API routes are only accessible with a valid access token sent in the `Authorization` header.
    - **Password Storage:** Passwords are stored as salted hashes.

- **Structured Logging:** **Pino** is used for high-performance, structured JSON logging. A custom middleware injects a `correlationId` into every request, ensuring that the entire lifecycle of a request can be traced through the logs for easier debugging and monitoring.

- **Validation:** Request body validation is handled by **Zod** in dedicated middleware. This approach keeps the controller logic clean and focused on business operations, while ensuring all incoming data conforms to the required schema before it is processed.

- **Configuration Management:** All environment-specific variables (e.g., database URLs, JWT secrets) are managed via a `.env` file and centrally loaded and validated in `src/config/index.ts`. The server will fail to start if critical variables are missing, so be sure to populate you own .env file.

### API Endpoints

The API is versioned and structured under the `/api` prefix.

- `GET /api/healthz`: A health check endpoint to verify server status.
- `POST /api/auth/signup`: User registration.
- `POST /api/auth/login`: User login.
- `POST /api/auth/logout`: Clears the refresh token cookie.
- `POST /api/auth/refresh`: Generates a new access token using the refresh token.
- `GET /api/auth/check`: A protected route to verify the current user's authentication status.
