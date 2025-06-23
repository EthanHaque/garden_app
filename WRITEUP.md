# Cultivar

This repository is structured as a monorepo managed by Bun workspaces, containing a decoupled frontend client,
microservice api wrappers, a scraping service, and a backend server. This promotes separation of concerns,
independent development workflows, and shared tooling.

### Table of Contents

- Core Technologies
- High-Level Architecture
- Backend Architecture
- Frontend Architecture
- Data Management
- Code Quality & Cross-Cutting Concerns

---

### Core Technologies

- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Runtime:** [Bun](https://bun.sh/) (dropin replacement for Node.js written in Zig)
- **Build Tool:** [Vite](https://vite.dev/)
- **Client Framework:** [React](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Server Framework:** [Express.js](https://expressjs.com/)
- **State Management:** [React Hooks](https://react.dev/reference/react/hooks) and (Socket.IO)[https://socket.io/]
- **Job Queue:** [BullMQ](https://bullmq.io/) with [Redis](https://redis.io/)
- **Web Scraping:** [Puppeteer](https://pptr.dev/)
- **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/),
  [Radix UI](https://www.radix-ui.com/), and GSAP [GSAP](https://gsap.com/)
- **Linting:** [ESLint](https://eslint.org/)
- **Formatting:** [Prettier](https://prettier.io/)

I chose to use Bun instead of Node because I find it speeds up the development workflow. I was careful not to use any
Bun-specific features in my implementation, so, with a few tweaks to configurations, the application will work fine
with Node as well. Additionally, I chose BullMQ as a job queue for scalability and fault tolerance. Furthermore, even
though it has higher overhead, I used Puppeteer for scraping to position the application for implementing hydration
and full-page screenshots. With more time, I would have dynamically swapped the Puppeteer instance with a lightweight
agent based on scraping context: page protections, the size of the scraping job, etc. The rest of the technologies
I chose because they are part of the Garden tech stack, or beacuse they integrated well within the rest of the
application. MongoDB Atlas does offer vector search capabilities in addition to text search, which does make development
easier, but I prefer using specialized vector-db's (e.g. Qdrant or Milvus) for storing embeddings in production. With
more time I would migrate to a cheaper, more scalable solution.

---

### High-Level Architecture

The application is organized into a monorepo containing multiple, distinct packages (`client`, `server`, `crawler`,
`ocr`, and `embed`). Users are authenticated and authorized with a two-token system, and submit jobs via the UI.
Long-running scraping tasks are offloaded to a separate crawling service using a message queue with an in-memory
database. Jobs are picked up off the queue whenever a worker becomes available. The client establishes a Socket.IO
connection and listents for job:update events as the job is processed. Once the worker finishes, the document is added
to MongoDB, links the original Job document to the new result document, and finally triggers a completed event through
the queue and pushes the event to the client.

### Backend Architecture

The server is built with Express and exposes a REST API. The API endpoints are protected via an authorization system
based on a two-token JSON Web Token scheme. It uses short-lived access tokens for requests that is automatically
refreshed by the client, and a long-lived refresh token for maintaining the user's session. For real time communication,
a Socket.IO connection provides a bi-directional communication channel for the client and server, avoiding polling.

BullMQ manages the queue of scraping jobs. Failed jobs are automatically retried with exponential backoff until a
certain threshold is met, then the job is failed and the user has the option to retry the job manually. The worker
threads also provide fault tolence with the ocr and embedding microservices to handle transient failures gracefully.
[LangChain](https://www.langchain.com/) provides an interface for text processing that I extend for this usecase.

### Frontend Architecture

### Data Management

### Code Quality & Cross-Cutting Concerns

### Key Features & Design Decisions
