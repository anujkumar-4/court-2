# Judiciary Pending Cases Priority Management (Node.js + HTML/CSS/JS)

A MERN-style role-based judiciary case management starter with:
- Login for Judge, Court (SC/HC/DC), Police Station, Advocate
- Role-specific dashboard after login
- Pending cases listing grouped and filterable by category
- Advocate certificate verification section
- Profile menu in top-right corner

## Tech Stack
- Backend: Node.js, Express, JWT auth, Mongoose models
- Frontend: HTML, CSS, Vanilla JS
- Database: MongoDB (optional); falls back to in-memory demo dataset if MongoDB unavailable

## Run

```bash
npm install
npm start
```

Open: `http://localhost:3000`

## Demo credentials
- `judge@court.gov.in / Pass@123`
- `sc@court.gov.in / Pass@123`
- `hc@court.gov.in / Pass@123`
- `dc@court.gov.in / Pass@123`
- `police@station.gov.in / Pass@123`
- `advocate@bar.in / Pass@123`

## API
- `POST /api/auth/login`
- `GET /api/profile` (Bearer token)
- `GET /api/cases` (Bearer token)

## Notes
Set env vars as needed:
- `PORT`
- `JWT_SECRET`
- `MONGO_URI`
