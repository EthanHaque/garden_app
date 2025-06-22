# Client Application (`packages/client`)

This package is a UI built with React and Vite. It serves as the user-facing interface for the application, designed for a fast and intuitive experience.

---

### Setup & Running

1.  **Install Dependencies:** From the root of the repository:

    ```bash
    bun install
    ```

2.  **Run the Server:**
    ```bash
    cd packages/client
    bun run vite
    ```

### Key Features & Design Decisions

- **Framework & Build Tool:** **React** with **Vite** was selected to provide a best-in-class developer experience. Vite offers near-instant Hot Module Replacement for rapid development and optimized production builds.

- **UI & Styling:**

    - **Tailwind CSS:** A utility-first CSS framework is used for efficient and consistent styling without leaving the HTML.
    - **shadcn/ui:** This project leverages `shadcn/ui` for its component foundation.
    - **Theming:** A theming system supports both **light and dark modes**, managed by the `ThemeProvider` context. It uses CSS variables for all colors, which are dynamically updated based on the selected theme.

- **Routing:** Client-side navigation is handled by **`react-router-dom`**. The application defines public routes (e.g., `/login`, `/signup`) and protected routes that are only accessible after authentication. The `ProtectedLayout` component acts as a gatekeeper for these routes, redirecting unauthenticated users to the login page.

- **State & Authentication Management:**
    - **React Context:** The `AuthContext` provides a centralized place to manage authentication state (`user`, `tokens`) and expose auth-related functions (`login`, `logout`, `signup`) to the entire application.
    - **`ApiClient`**: A `ApiClient` class (`src/lib/api.ts`) is a cornerstone of the client's design. It handles API requests by:
        - Automatically attaching the JWT access token to the headers of outgoing requests.
        - Intercepting `401 Unauthorized` responses, which may indicate an expired access token.
        - Seamlessly calling the server's `/api/auth/refresh` endpoint to get a new access token.
        - Retrying the original failed request with the new token.
