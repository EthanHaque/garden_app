# Application Architecture Overview

This repository is structured as a monorepo managed by Bun workspaces, containing a decoupled frontend client and backend server. This architecture promotes separation of concerns, independent development workflows, and shared tooling.

---

### Core Technologies

- **Runtime:** [Bun](https://bun.sh/) (dropin replacement for Node.js written in Zig)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Monorepo Management:** Bun Workspaces
- **Client Framework:** [React](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Server Framework:** [Express.js](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- **Linting:** [ESLint](https://eslint.org/)
- **Formatting:** [Prettier](https://prettier.io/)

---

### Getting Started

1.  **Install Dependencies:** From the root of the repository, install all dependencies for both workspaces.

    ```bash
    bun install
    ```

2.  **Run the Application:** Both the client and server must be running concurrently. You will need two separate terminal sessions.

3.  **Run the Server:**

    ```bash
    cd packages/server
    bun run src/index.ts
    ```

4.  **Run the Client:**

    ```bash
    cd packages/client
    bun run vite
    ```

### Key Features & Design Decisions

- **Bun instead of Node:** It is not lost on me that this is a deviation from the traditional MERN stack. Bun felt like an appropriate replacement for Node because of its speed and ease of use, while also maintaining compatability with Node. Given the time constraints, Bun was a better tooling choice than Node. Furthermore, to swap Bun with Node requires a few tweaks to configuraiton files since I was careful not use any Bun-specific features in my implementation.

### Architectural Design

The application is architected as a monorepo and laregly centers around two primary packages within the `packages/` directory:

- `packages/client`: An Application built with React. It is responsible for all user-facing views and interactions. It communicates with the server via a RESTful API.
- `packages/server`: A RESTful API server built with Express.js. It handles business logic, data persistence, and user authentication.
