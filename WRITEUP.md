# Application Architecture Overview

This repository is structured as a monorepo managed by Bun workspaces, containing a decoupled frontend client and
backend server. This architecture promotes separation of concerns, independent development workflows, and shared
tooling.

---

### Core Technologies

- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Runtime:** [Bun](https://bun.sh/) (dropin replacement for Node.js written in Zig)
- **Build Tool:** [Vite](https://vite.dev/)
- **Client Framework:** [React](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Server Framework:** [Express.js](https://expressjs.com/)
- **State Management:** [React Hooks](https://react.dev/reference/react/hooks) and (Socket.IO)[https://socket.io/]
- **Job Queue:** [BullMQ](https://bullmq.io/)
- **Web Scraping:** [Puppeteer](https://pptr.dev/)
- **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/),
  [Radix UI](https://www.radix-ui.com/), and GSAP [GSAP](https://gsap.com/)
- **Linting:** [ESLint](https://eslint.org/)
- **Formatting:** [Prettier](https://prettier.io/)

---

#### **1. High-Level Architecture**

#### **2. Backend Architecture**

#### **3. Frontend Architecture**

#### **4. Data Management**

#### **5. Code Quality & Cross-Cutting Concerns**

### Key Features & Design Decisions

- **Bun instead of Node:** It is not lost on me that this is a deviation from the traditional MERN stack. Bun felt like an appropriate replacement for Node because of its speed and ease of use, while also maintaining compatability with Node. Given the time constraints, Bun was a better tooling choice than Node. Furthermore, to swap Bun with Node requires a few tweaks to configuraiton files since I was careful not use any Bun-specific features in my implementation.

### Architectural Design

The application is architected as a monorepo and laregly centers around two primary packages within the `packages/` directory:

- `packages/client`: An Application built with React. It is responsible for all user-facing views and interactions. It communicates with the server via a RESTful API.
- `packages/server`: A RESTful API server built with Express.js. It handles business logic, data persistence, and user authentication.

\<a name="top"\>\</a\>

# Application Architecture Overview

This repository is structured as a monorepo managed by Bun workspaces, containing a decoupled frontend client, backend
server. and microservice API wrappers. This architecture promotes separation of concerns, independent development
workflows, and shared tooling.

---

### Table of Contents

- [Core Technologies](https://www.google.com/search?q=%23core-technologies)
- [High-Level Architecture](https://www.google.com/search?q=%23high-level-architecture)
- [Backend Architecture](https://www.google.com/search?q=%23backend-architecture)
- [Frontend Architecture](https://www.google.com/search?q=%23frontend-architecture)
- [Data Management](https://www.google.com/search?q=%23data-management)
- [Code Quality & Cross-Cutting Concerns](https://www.google.com/search?q=%23code-quality-cross-cutting-concerns)

---

\<h2 id="core-technologies"\>Core Technologies\</h2\>

- Language: TypeScript
- Runtime: Bun (drop-in replacement for Node.js written in Zig)
- Build Tool: Vite
- Client Framework: React with Vite
- Server Framework: Express.js
- State Management: React Hooks and Socket.IO
- Job Queue: BullMQ
- Web Scraping: Puppeteer
- Database: MongoDB with Mongoose
- Styling: Tailwind CSS with shadcn/ui, Radix UI, and GSAP
- Linting: ESLint
- Formatting: Prettier

\<p align="right"\>\<a href="\#top"\>[Back to Top]\</a\>\</p\>

---

\<h2 id="high-level-architecture"\>High-Level Architecture\</h2\>

\<p align="right"\>\<a href="\#top"\>[Back to Top]\</a\>\</p\>

---

\<h2 id="backend-architecture"\>Backend Architecture\</h2\>

\<p align="right"\>\<a href="\#top"\>[Back to Top]\</a\>\</p\>

---

\<h2 id="frontend-architecture"\>Frontend Architecture\</h2\>

\<p align="right"\>\<a href="\#top"\>[Back to Top]\</a\>\</p\>

---

\<h2 id="data-management"\>Data Management\</h2\>

\<p align="right"\>\<a href="\#top"\>[Back to Top]\</a\>\</p\>

---

\<h2 id="code-quality-cross-cutting-concerns"\>Code Quality & Cross-Cutting Concerns\</h2\>

\<p align="right"\>\<a href="\#top"\>[Back to Top]\</a\>\</p\>
