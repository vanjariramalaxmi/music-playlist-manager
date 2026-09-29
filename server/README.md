# Music Playlist Manager API

This backend provides authentication, song management, playlist management, and song search for the Music Playlist Manager application.

## Environment

Create a `.env` file in the `server` folder with:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/music_playlist_manager
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
```

## Start the server

```bash
npm install
npm run dev
```

## API endpoints

| # | Method | Endpoint | Auth | Purpose |
|---|---|---|---|---|
| 1 | POST | /api/auth/register | No | Register a new user |
| 2 | POST | /api/auth/login | No | Login and receive JWT |
| 3 | GET | /api/auth/me | Yes | Get logged-in user profile |
| 4 | POST | /api/songs | Yes | Create a song |
| 5 | GET | /api/songs?page=1&limit=10 | Yes | List songs with pagination |
| 6 | GET | /api/songs/search?q=love&page=1&limit=10 | Yes | Search songs by title, artist, or album |
| 7 | GET | /api/songs/:id | Yes | Get a single song |
| 8 | PUT | /api/songs/:id | Yes | Update a song |
| 9 | DELETE | /api/songs/:id | Yes | Delete a song |
| 10 | POST | /api/playlists | Yes | Create a playlist |
| 11 | GET | /api/playlists?page=1&limit=10 | Yes | List public playlists plus my own |
| 12 | GET | /api/playlists/mine?page=1&limit=10 | Yes | List only my playlists |
| 13 | GET | /api/playlists/:id | Yes | Get a playlist by ID |
| 14 | PUT | /api/playlists/:id | Yes | Update a playlist |
| 15 | DELETE | /api/playlists/:id | Yes | Delete a playlist |
| 16 | POST | /api/playlists/:id/songs | Yes | Add a song to a playlist |
| 17 | DELETE | /api/playlists/:id/songs/:songId | Yes | Remove a song from a playlist |

## Example requests

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret123"}'
```

Example response:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "_id": "abc123",
      "name": "Alice",
      "email": "alice@example.com"
    }
  }
}
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'
```

### Get profile
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### Create song
```bash
curl -X POST http://localhost:5000/api/songs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Love Me",
    "artist": "John Doe",
    "album": "Heartbeats",
    "genre": "Pop",
    "duration": 210,
    "releaseYear": 2024
  }'
```

### Search songs
```bash
curl -X GET "http://localhost:5000/api/songs/search?q=love&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

Example response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "song_id",
      "title": "Love Me",
      "artist": "John Doe",
      "album": "Heartbeats",
      "genre": "Pop",
      "duration": 210,
      "releaseYear": 2024
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 1,
  "totalPages": 1
}
```

### Create playlist
```bash
curl -X POST http://localhost:5000/api/playlists \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Road Trip","description":"Favorite songs","isPublic":true}'
```

### Add song to playlist
```bash
curl -X POST http://localhost:5000/api/playlists/<playlistId>/songs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"songId":"<songId>"}'
```

### Remove song from playlist
```bash
curl -X DELETE http://localhost:5000/api/playlists/<playlistId>/songs/<songId> \
  -H "Authorization: Bearer <token>"
```

## Response standard

All API responses follow one of these shapes:

```json
{ "success": true, "data": { ... } }
```

or

```json
{ "success": false, "message": "Something went wrong" }
```

## Security notes

- JWT tokens are required for protected routes.
- `helmet` is enabled globally.
- Auth requests are rate-limited separately from general API traffic.
- Empty search queries return HTTP 400.
