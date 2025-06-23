# Cultivar: Architectural Overview

> This application is a web scraping and processing platform built within a monorepo. The architecture is designed
> around a decoupled frontend, a backend API server, and an asynchronous processing worker, promoting a clean separation
> of concerns.

## Table of Contents

- Core Technologies
- Architectural Philosophy & Key Decisions
- High-Level Workflow
- Backend Architecture
- Frontend Architecture
- Data Management & Polymorphism
- Cross-Cutting Concerns
- Deploymnet

---

### Core Technologies

| Category     | Technology                        | Purpose                                         |
| :----------- | :-------------------------------- | :---------------------------------------------- |
| **Runtime**  | Bun                               | A fast, Node.js-compatible JavaScript runtime.  |
| **Backend**  | Express.js, BullMQ, Puppeteer     | API creation, job queuing, and web scraping.    |
| **Frontend** | React, Vite, Socket.IO Client     | UI, build tooling, and real-time communication. |
| **Database** | MongoDB with Mongoose             | Flexible NoSQL data storage and modeling.       |
| **Styling**  | Tailwind CSS, shadcn/ui, Radix UI | Utility-first CSS and component-based UI.       |
| **Tooling**  | TypeScript, ESLint, Prettier      | Type safety, linting, and code formatting.      |

---

### Architectural Philosophy & Key Decisions

> **Runtime Choice (Bun):** Bun was chosen to accelerate the development workflow. Care was taken to avoid Bun-specific
> APIs, ensuring the application remains compatible with Node.js with minimal configuration changes.

> **Asynchronous Processing (BullMQ):** To ensure the API remains responsive and can handle failures, long-running
> scraping tasks are managed by BullMQ.

> **High-Fidelity Scraping (Puppeteer):** While lightweight agents are faster, Puppeteer was chosen to position the app
> for implementing hydration and full-page screenshots. The worker architecture is designed with fault tolerance for
> interactions with external microservices. With more time, I would implement a context-dependent scraping pipeline.
> I.e. use Puppeteer only on sites that a lightweight agent would fail on, or when features like full-page screenshots
> are not necessary. This also helps with scaling for large jobs.

> **Database Choice (MongoDB):** MongoDB was selected for its flexibility. While it offers vector search capabilities,
> I prefer a dedicated vector database (e.g., Qdrant, Milvus) for a production environment to optimize for cost
> and scalability. With more time, I would migrate.

---

### High-Level Workflow

The application follows a decoupled, event-driven workflow:

1.  **Job Submission:** An authenticated user submits a URL through the React frontend. The client makes a `POST`
    request to the backend API.
2.  **Job Queuing:** The Express server validates the request, creates a `Job` entry in MongoDB, and pushes a task to
    the BullMQ queue.
3.  **Asynchronous Processing:** A dedicated `crawler` worker, running in a separate process, picks up the job from the
    queue.
4.  **Real-time Feedback:** As the worker processes the job, it sends status updates back through the queue. The
    backend server listens for these events and broadcasts them directly to the client via a **Socket.IO** connection,
    updating the UI in real-time.
5.  **Completion:** Once scraping is complete, the worker saves the results to MongoDB, updates the original `Job`
    document with a link to the results, and emits a final `completed` event.

---

### Backend Architecture

- **API Layer:** The Express server exposes a REST API secured with a two-token JWT scheme (short-lived access tokens
  and a long-lived refresh token stored in an HTTP-only cookie). This provides secure, stateless authentication.
- **Processing Layer:** The `crawler` worker uses Puppeteer to launch a headless browser to handle both HTML and PDF
  documents. It also uses LangChain's text processing utilities to chunk extracted text before embedding and storage.

### Frontend Architecture

The frontend is a Single-Page Application (SPA) built with **React** and bundled with **Vite**.

- **Client-Side Routing:** React Router manages navigation, using protected layout components to ensure only
  authenticated users can access the app's pageapp's pages.
- **State Management:** Global state for authentication and theme is managed via **React Context**.
- **Real-time Updates:** The dashboard establishes a **Socket.IO** connection to the backend to listen for real-time
  job updates, eliminating the need for polling.
- **Landing Page:** Added a landing page with some light animations for a bit of stylistic flair.

### Data Management & Polymorphism

- **Data Modeling:** Data is stored in MongoDB and managed with Mongoose, which defines schemas for `User`, `Job`, and
  job results.
- **Polymorphic Associations:** The `Job` schema contains a `resultType` field (which can be `HtmlResult` or `PdfResult`)
  dynamically controls which collection the `result` field references. This allows for a clean and flexible way to
  associate a single job with different kinds of result documents. This can be expanded to other types of content.
- **PDF Data Storage:** PDF images are stored on disk and served to the client and are visible in the UI.

### Cross-Cutting Concerns

- **Validation:** Incoming API requests are validated using **Zod**, ensuring data integrity before it reaches the
  controllers.
- **Logging:** A structured logger (**Pino**) is used on the backend to provide detailed and filterable logs, including
  correlation IDs to track requests across services.

### Deployment

- **Deploymnet Architecture:** The app is deployed with nginx as a reverse proxy and uses a self-signed ssl cert to
  enable HTTPS.
