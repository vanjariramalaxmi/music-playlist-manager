# Music Playlist Manager

A full-stack music playlist manager built with React, Express, MongoDB, and JWT authentication. Users can create songs, search the song library, build playlists, and add or remove songs from playlists.

## Features

- JWT registration, login, profile loading, and protected routes
- Song CRUD with creator-only edit/delete actions
- Debounced song search and pagination
- Playlist CRUD with owner-only controls
- Many-to-many playlist/song relationships
- Responsive React UI with loading skeletons and toast feedback
- Helmet, rate limiting, input validation, and restricted CORS

## Stack

- Frontend: React, Vite, React Router, Axios, plain CSS
- Backend: Node.js, Express, Mongoose
- Database: MongoDB Atlas or local MongoDB
- Authentication: JWT and bcryptjs
- Testing: Jest, Supertest, MongoMemoryServer

## Project Structure

```text
music-playlist-manager/
├── client/       # React/Vite application
├── server/       # Express API
├── readme.md
└── .gitignore
```

## Run Locally

### Prerequisites

- Node.js 18 or newer
- MongoDB locally, or a MongoDB Atlas database

### 1. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Configure the API

Create `server/.env` from `server/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/music_playlist_manager
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Create `client/.env` from `client/.env.example`:

```env
VITE_API_URL=http://localhost:5000
```

Never commit either `.env` file.

### 3. Start the applications

Terminal 1:

```bash
cd server
npm run dev
```

Terminal 2:

```bash
cd client
npm run dev
```

Open `http://localhost:5173`.

### Useful commands

```bash
# Backend tests
cd server
npm test

# Frontend production build
cd client
npm run build

# Seed sample songs after configuring server/.env
cd server
npm run seed
```

## Environment Variables

| Variable | App | Purpose |
|---|---|---|
| `PORT` | Server | HTTP port, normally `5000` |
| `MONGO_URI` | Server | MongoDB connection string |
| `JWT_SECRET` | Server | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | Server | JWT lifetime, for example `7d` |
| `CLIENT_URL` | Server | Allowed frontend origin; comma-separated origins are supported |
| `VITE_API_URL` | Client | Public base URL of the deployed API |

## API Reference

All protected endpoints require:

```http
Authorization: Bearer <jwt>
```

| Method | Endpoint | Auth | Description |
|---|---|---:|---|
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/auth/register` | No | Register a user |
| `POST` | `/api/auth/login` | No | Login and receive a token |
| `GET` | `/api/auth/me` | Yes | Get the current user |
| `POST` | `/api/songs` | Yes | Create a song |
| `GET` | `/api/songs?page=1&limit=10` | Yes | List songs |
| `GET` | `/api/songs/search?q=love&page=1&limit=10` | Yes | Search songs |
| `GET` | `/api/songs/:id` | Yes | Get one song |
| `PUT` | `/api/songs/:id` | Yes, creator | Update a song |
| `DELETE` | `/api/songs/:id` | Yes, creator | Delete a song and remove it from playlists |
| `POST` | `/api/playlists` | Yes | Create a playlist |
| `GET` | `/api/playlists?page=1&limit=10` | Yes | List public and owned playlists |
| `GET` | `/api/playlists/mine?page=1&limit=10` | Yes | List owned playlists |
| `GET` | `/api/playlists/:id` | Yes | Get a playlist with populated songs |
| `PUT` | `/api/playlists/:id` | Yes, owner | Update a playlist |
| `DELETE` | `/api/playlists/:id` | Yes, owner | Delete a playlist |
| `POST` | `/api/playlists/:id/songs` | Yes, owner | Add `{ "songId": "..." }` |
| `DELETE` | `/api/playlists/:id/songs/:songId` | Yes, owner | Remove a song |

Successful responses use `{ "success": true, "data": ... }`. Errors use `{ "success": false, "message": "..." }`.

## MongoDB Atlas

1. Create an account at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a free shared cluster and choose a region near your API host.
3. In **Database Access**, create a database user with a strong password.
4. In **Network Access**, add the IP address used by your deployment. For a quick deployment test, `0.0.0.0/0` works but is less restrictive; replace it with a narrower allowlist before production.
5. Select **Connect → Drivers**, copy the Node.js connection string, and replace the username, password, and database name.
6. Set the final connection string as the server `MONGO_URI` environment variable.

## Deploy the Backend

### Render

1. Push the repository to GitHub and create a **Web Service** in Render.
2. Set the root directory to `server`.
3. Use:
   - Build command: `npm install`
   - Start command: `npm start`
4. Add environment variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d`, and `CLIENT_URL`.
5. Deploy and verify `https://<render-service>.onrender.com/api/health` returns a successful response.

### Railway

1. Create a Railway project from the GitHub repository.
2. Set the service root directory to `server` if prompted.
3. Set the start command to `npm start`.
4. Add `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `CLIENT_URL` under Variables.
5. Generate a public domain and verify `/api/health`.

`PORT` is supplied by Render/Railway automatically. The server reads it from `process.env.PORT`.

## Deploy the Frontend

### Vercel

1. Import the repository into Vercel.
2. Set the project root directory to `client`.
3. Use the Vite defaults:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add `VITE_API_URL=https://<your-api-host>`.
5. Deploy, copy the frontend URL, and set that exact URL as the backend `CLIENT_URL`.
6. Redeploy the backend if its environment variables changed.

### Netlify

1. Add the repository as a new site.
2. Set the base directory to `client`.
3. Set the build command to `npm run build` and publish directory to `client/dist`.
4. Add `VITE_API_URL=https://<your-api-host>`.
5. Set the final Netlify URL as the backend `CLIENT_URL`.

## Production Checklist

- Use a long, unique `JWT_SECRET`.
- Use an Atlas database user with only the required permissions.
- Restrict Atlas Network Access to deployment IPs where possible.
- Set `CLIENT_URL` to the exact deployed frontend origin, including `https://` and without a trailing slash.
- Set `VITE_API_URL` to the API origin without a trailing slash.
- Confirm `/api/health`, registration, login, song CRUD, and playlist mutations after deployment.
- Do not commit `.env` files, secrets, or database credentials.

## Screenshots

The application screens are available through the local and deployed URLs above. Add exported screenshots here after deployment if this repository is being used as a portfolio project.

## License

This project is intended for learning and demonstration purposes.
