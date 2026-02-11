# Basic JS API

A REST API to manage information about **whatever you need**, built with **Fastify**, **Prisma**, and PostgreSQL.

---

## 💻 Technologies of Stack

- **Node.js** >= 24
- **Fastify** – fast and lightweight web framework
- **Prisma** – ORM for PostgreSQL database with **soft delete** implementation
- **PostgreSQL** – relational database
- **dotenv** – environment variable management
- **argon2** – secure password hashing
- **Jest & Supertest** – unit and integration testing
- **javascript-obfuscator** – code obfuscation for production

---

## ⚡ Installation

Clone the repository and install dependencies with **pnpm**:

```bash
git clone https://github.com/periscuelo/basic-js-api.git
cd basic-js-api
pnpm install
````

After installation, the `postinstall` command will automatically generate the Prisma client.

---

## 🛠️ Available Scripts

| Command                | Description                                                              |
| ---------------------- | ------------------------------------------------------------------------ |
| `pnpm dev`             | Starts the server in development mode with watch.                        |
| `pnpm start`           | Starts the server in production mode using the build from `dist`.        |
| `pnpm build`           | Obfuscates the application code for production.                          |
| `pnpm prisma:deploy`   | Apply database migrations in the development environment.                |
| `pnpm prisma:generate` | Generates the Prisma client.                                             |
| `pnpm prisma:migrate`  | Create database migrations in the development environment.               |
| `pnpm prisma:push`     | Updates the database with the Prisma schema without creating migrations. |
| `pnpm prisma:reset`    | Erase all in database allowing execute migrations again.                 |
| `pnpm prisma:seed`     | Seed your data into the database using prisma for that.                  |
| `pnpm test`            | Runs tests using Jest.                                                   |
| `pnpm test:watch`      | Runs tests in watch mode.                                                |
| `pnpm test:e2e`        | Runs e2e tests, needs test database running in docker.                   |

> 💡 All Prisma commands use `.env.development` by default, while `start` uses `.env.production`.

---

## 🌱 Database

The application uses **Prisma** as an ORM to connect to **PostgreSQL**, with **soft delete automatically implemented** on models containing deletedAt field.
```code
 # sample of model User
 prisma.user.softDelete({ where: { id } })
```

Make sure to create your database and configure the environment variables:

```env
# .env.development
DATABASE_URL="postgresql://user:password@localhost:5433/mydb_dev"

# .env.docker
DATABASE_URL="postgresql://user:password@db-test:5432/mydb_test"

# .env.production
DATABASE_URL="postgresql://user:password@localhost:5432/mydb_prod"

# .env.test
DATABASE_URL="postgresql://user:password@localhost:5434/mydb_test"
```

To automatically create tables from the Prisma schema:

```bash
pnpm prisma:migrate
# or
pnpm prisma:push
```

---

## 🧪 Tests

The project uses **Jest** and **Supertest** for unit and integration tests.

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run e2e tests (needs test database running, using .env.test and .env.docker)
pnpm test:e2e
```

---

## 📄 API Documentation

Swagger documentation is available when starting the server (dev or production mode) at:

```
http://localhost:3000/docs
```

---

## 🔑 Authentication

The API uses **JWT** for user authentication, with cookies for secure storage.

---

## 📦 Project Structure

```
basic-js-api/
│
├─ src/
│  ├─ resources/
│  │  ├─ controllers/
│  │  ├─ repositories/
│  │  ├─ routes/
│  │  └─ schemas/
│  │
│  ├─ app.js
│  ├─ env.js
│  └─ server.js
│
├─ scripts/
│  └─ obfuscate.js
│
├─ prisma/
│  ├─ seed.js
│  ├─ schema.prisma
│  └─ migrations/
│
├─ .env.development
├─ .env.docker
├─ .env.production
├─ .env.test
├─ package.json
└─ README.md
```

> **Automatic Route Loading:** The API automatically loads all routes. Just create a file named `new.routes.js` for instance, inside the `routes` folder, and the API will recognize the new routes immediately.

---

## 🔧 Requirements

* Node.js >= 24
* pnpm >= 10.15 < 11
* PostgreSQL >= 17

---

## 📜 License

This project is licensed under the MIT License.

---

> Developed with ❤️ to still have something in Vanilla JavaScript.
