# Cloudflare Workers Chat Demo

[![[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ALPHA818/velocityos-web-based-car-dashboard-interface)]](https://deploy.workers.cloudflare.com)

A production-ready full-stack chat application built on Cloudflare Workers. Features user management, chat boards, and real-time messaging using Durable Objects for scalable, stateful storage. React frontend with modern UI components, Tailwind CSS, and TanStack Query for data fetching.

## ✨ Features

- **Durable Objects Entities**: Users and ChatBoards with automatic indexing and pagination
- **Real-time Chat**: Send and list messages per chat board
- **Modern UI**: shadcn/ui components, Tailwind CSS, dark mode support
- **Type-safe APIs**: Shared TypeScript types between frontend and worker
- **Reactive Data**: TanStack Query for optimistic updates and caching
- **Scalable Architecture**: Single Global Durable Object for multi-entity storage
- **Production Optimized**: Hono routing, CORS, error handling, and logging
- **Bun-powered**: Fast development and deployment workflow

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Lucide Icons, Sonner (toasts)
- **Backend**: Cloudflare Workers, Hono, Durable Objects
- **Data**: Global Durable Object (SQLite-backed storage)
- **Tools**: Bun, Wrangler, ESLint, Prettier

## 🚀 Quick Start

1. **Clone & Install**
   ```bash
   git clone <your-repo-url>
   cd velocity-os-ajk22f0pbdwn_plihcfqc
   bun install
   ```

2. **Development**
   ```bash
   bun dev
   ```
   Opens at `http://localhost:3000` (or `$PORT`).

3. **Type Generation**
   ```bash
   bun cf-typegen
   ```

4. **Build & Preview**
   ```bash
   bun build
   bun preview
   ```

## 📚 API Documentation

All APIs under `/api/*`. Uses standard REST with JSON responses `{ success: boolean; data?: T; error?: string }`.

### Users
- `GET /api/users?cursor=&limit=` - List users (paginated)
- `POST /api/users` - `{ name: string }` → Create user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/deleteMany` - `{ ids: string[] }` → Bulk delete

### Chats
- `GET /api/chats?cursor=&limit=` - List chats (paginated)
- `POST /api/chats` - `{ title: string }` → Create chat
- `DELETE /api/chats/:id` - Delete chat
- `POST /api/chats/deleteMany` - `{ ids: string[] }` → Bulk delete

### Messages
- `GET /api/chats/:chatId/messages` - List messages
- `POST /api/chats/:chatId/messages` - `{ userId: string; text: string }` → Send message

Test with curl:
```bash
curl -X POST http://localhost:8787/api/chats -H "Content-Type: application/json" -d '{"title": "Test Chat"}'
```

## 🔧 Development Workflow

- **Hot Reload**: Frontend auto-reloads on `src/` changes. Worker HMR on `worker/user-routes.ts`.
- **Linting**: `bun lint`
- **Custom Routes**: Edit `worker/user-routes.ts` → Auto-reloads in dev.
- **Entities**: Extend `worker/entities.ts` using `IndexedEntity` base class.
- **Seed Data**: Mock users/chats auto-seed on first API call.
- **Error Reporting**: Client errors logged to `/api/client-errors`.
- **Theme**: Toggle dark/light mode in UI.

**Pro Tips**:
- Use `wrangler tail` for live logs after deploy.
- `shared/types.ts` & `shared/mock-data.ts` shared between FE/BE.
- Never edit `worker/core-utils.ts` or `worker/index.ts` – core infrastructure.

## ☁️ Deployment

1. **Build Assets**
   ```bash
   bun build
   ```

2. **Deploy to Cloudflare**
   ```bash
   bun deploy
   ```
   Deploys Worker + static assets. SPA routing handled automatically.

[![[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ALPHA818/velocityos-web-based-car-dashboard-interface)]](https://deploy.workers.cloudflare.com)

**Custom Domain**: Update `wrangler.jsonc` with `routes` and run `bun deploy`.

**Environment Vars**: Add via Wrangler dashboard or `wrangler.toml`.

## 🤝 Contributing

1. Fork & clone
2. `bun install`
3. `bun dev` → Test changes
4. Update types in `shared/`
5. Submit PR

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

## 🙌 Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [shadcn/ui](https://ui.shadcn.com/)
- Questions? Open an issue.

Built with ❤️ for Cloudflare Workers.