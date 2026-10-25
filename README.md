# HotelPro – Hotel Management System (MERN)

Secure, scalable hotel management: room inventory, real-time availability, bookings, guest management,
payments, and an admin dashboard. Stack: **MongoDB, Express, React (Vite), Node.js, JWT, Bootstrap**.

## Quick start

Prerequisites: Node.js 16+ (18+ recommended), npm 8+, MongoDB running locally (or an Atlas URI).

```bash
# 1) Backend
cd backend
npm install
cp .env.example .env        # (a ready-to-use .env is already included for local dev)
npm run seed                # creates demo users + 12 rooms
npm run dev                 # API on http://localhost:5000

# 2) Frontend (new terminal)
cd frontend
npm install
npm run dev                 # App on http://localhost:5173
```

Demo logins (created by `npm run seed`):

| Role  | Email               | Password   |
|-------|---------------------|------------|
| Admin | admin@hotelpro.com  | Admin@123  |
| Staff | staff@hotelpro.com  | Staff@123  |
| Guest | guest@hotelpro.com  | Guest@123  |

> Change `JWT_SECRET` in `backend/.env` before deploying anywhere.

## Features

**Guests**
- Register / log in (JWT), edit profile, change password
- Search rooms by dates, guests, type, price (booked rooms are excluded automatically)
- Book a room (price, 12 % tax and total computed server-side), pay by card or UPI, cancel (auto-refund)
- Unpaid reservations hold the room for 30 minutes, then expire automatically

**Staff** (`/admin`)
- Dashboard: occupancy, revenue (6-month chart), arrivals / departures today, bookings by status
- Rooms: add / edit, set maintenance
- Bookings: search & filter, confirm → check-in → check-out, collect payment (incl. cash), cancel
- Guests: search, view stay history
- Payments: full transaction ledger

**Admin** (everything staff can do, plus)
- Delete rooms, create staff/admin accounts, change roles, delete users

## Security
- Passwords hashed with bcrypt (12 rounds); JWT auth; role-based authorization (guest / staff / admin)
- Public registration can only ever create `guest` accounts
- `helmet` headers, CORS allow-list, request body size limit, rate limiting on `/api/auth`
- NoSQL-injection sanitising middleware; Mongoose schema validation
- Card numbers are validated in memory and **never stored** (only last 4 digits)
- Guests can only read / pay / cancel their own bookings

## Payments
Payments run through a **simulated gateway** (see `controllers/paymentController.js`, block marked `GATEWAY`).
Test cards: `4242 4242 4242 4242` succeeds, `4000 0000 0000 0002` is declined. To go live, replace that block
with Stripe / Razorpay (create the order server-side and verify the webhook/signature before marking paid).

## API overview (`/api`)

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET/PUT /auth/me` |
| Rooms | `GET /rooms` (filters: `checkIn, checkOut, guests, type, minPrice, maxPrice`), `GET /rooms/:id`, `GET /rooms/:id/booked-dates`, `GET /rooms/manage/all` *(staff)*, `POST /rooms` *(staff)*, `PUT /rooms/:id` *(staff)*, `DELETE /rooms/:id` *(admin)* |
| Bookings | `POST /bookings`, `GET /bookings/my`, `GET /bookings/:id`, `PUT /bookings/:id/cancel`, `GET /bookings` *(staff)*, `PUT /bookings/:id/status` *(staff)* |
| Payments | `POST /payments`, `GET /payments/my`, `GET /payments` *(staff)* |
| Users | `GET /users`, `GET /users/:id` *(staff)*, `POST /users`, `PUT /users/:id/role`, `DELETE /users/:id` *(admin)* |
| Dashboard | `GET /dashboard/stats` *(staff)* |

Send the token as `Authorization: Bearer <token>`. Errors are `{ "message": "..." }`.

## Testing
`backend/test/smoke.test.js` is an end-to-end API test (auth, RBAC, overlap prevention, payments, refunds, expiry, dashboard):

```bash
cd backend
TEST_MONGO_URI=mongodb://127.0.0.1:27017/hotelpro_test node test/smoke.test.js
```
(It drops that database afterwards – use a throw-away name.) Import the endpoints into Postman for manual testing.

## Project structure
```
backend/   server.js, app.js, seed.js, config/, models/, controllers/, routes/, middleware/, utils/, test/
frontend/  src/{api.js, App.jsx, context/, components/, pages/, pages/admin/}
```

## Production build
```bash
cd frontend && npm run build        # outputs frontend/dist
```
Serve `dist/` from any static host and set `VITE_API_URL` (e.g. `https://api.example.com/api`) at build time,
and set `CLIENT_URL` on the backend to your site's origin for CORS.

## Known limitations / next steps
- Payment gateway is simulated (see above)
- Overlap check is done in application code; for very high concurrency add a Mongo transaction or unique slot locking
- No email notifications yet (add nodemailer in `bookingController` after confirmation)
