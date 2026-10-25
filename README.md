<div align="center">

# 🏨 HotelPro
### A modern hotel booking and management platform

**Discover rooms · Manage reservations · Streamline hotel operations**

<img src="screenshots/01-home.png" alt="HotelPro home page" width="900">

[Features](#-features) · [Screenshots](#-screenshots) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started)

</div>

---

## ✨ Overview

**HotelPro** is a full-stack hotel booking application. Guests can browse rooms, check availability, make bookings, and review reservations. Staff and administrators can manage rooms, bookings, guest accounts, and hotel operations from a dedicated dashboard.

**Live demo:** [Open HotelPro](https://frontend-two-pi-55.vercel.app/)

## 🚀 Features

### For guests
- 🛏️ Browse rooms by type, capacity, amenities, floor, and nightly price.
- 🔎 Search availability using dates, guest count, room type, and price filters.
- 🔐 Register and log in with token-based authentication.
- 📅 View personal bookings and reservation statuses.
- 💳 Demo checkout with Card and UPI payment options.
- 📱 Responsive desktop and mobile layout.

### For staff and administrators
- 📊 Dashboard overview of rooms, occupancy, bookings, and revenue.
- 🏨 Create, edit, and remove room listings.
- 🧾 Search and manage bookings, check-ins, check-outs, confirmations, and cancellations.
- 👥 View guest/staff accounts and manage roles.
- 💰 Review payment and booking statuses.

### Engineering highlights
- REST API separating frontend and backend.
- MongoDB persistence.
- Password hashing and role-based access controls.
- Availability checks designed to prevent overlapping reservations.
- Environment-based deployment configuration.

## 🖼️ Screenshots

### Guest experience

| Home page | Room catalogue |
|---|---|
| ![Home page](screenshots/01-home.png) | ![Rooms](screenshots/02-rooms.png) |

| Login | My bookings |
|---|---|
| ![Login](screenshots/04-login.png) | ![My bookings](screenshots/05-my-bookings.png) |

**Payment checkout**

![Payment](screenshots/06-payment.png)

### Admin experience

| Dashboard | Room management |
|---|---|
| ![Admin dashboard](screenshots/07-admin-dashboard.png) | ![Room management](screenshots/08-admin-rooms.png) |

| Booking management | Guest and staff management |
|---|---|
| ![Bookings](screenshots/09-admin-bookings.png) | ![Guests and staff](screenshots/10-admin-guests.png) |

### Responsive design

<p align="center">
  <img src="screenshots/12-mobile-home.png" alt="HotelPro mobile home page" width="300">
</p>

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, hashed passwords |
| Deployment | Vercel |

## 🗂️ Project Structure

```text
Hotel-Pro/
├── frontend/        # React + Vite user interface
├── backend/         # Express REST API
├── screenshots/     # README screenshots
└── README.md
```

## ⚙️ Getting Started

### Prerequisites
- Node.js (LTS recommended)
- npm
- MongoDB database (for example, MongoDB Atlas)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Mohitrath/Hotel-Pro.git
cd Hotel-Pro
```

### 2. Start the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

Start the backend using the script in `backend/package.json` (commonly `npm run dev`). If that script is unavailable, use the start command defined in the package file.

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Run:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## ☁️ Deployment

### Backend on Vercel
Configure these environment variables in **Vercel → Project → Settings → Environment Variables**:

- `MONGO_URI`
- `JWT_SECRET`
- `NODE_ENV=production`
- `CLIENT_URL` — deployed frontend origin

Redeploy after changing environment variables.

### Frontend on Vercel
Set:

```env
VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api
```

Replace the example domain with the actual backend URL. Variables prefixed with `VITE_` are exposed to browser code; never put passwords or private tokens in them.

### Verify the API
Open `https://YOUR-BACKEND-DOMAIN/api/health`. A healthy response should confirm that the API is running and, if supported by the backend, that the database is connected. If the frontend shows a network/database error, check backend logs, `MONGO_URI`, MongoDB Atlas Network Access, and CORS settings.

## 🔒 Security Notes

- Keep database credentials and JWT secrets private.
- Rotate credentials that have been exposed.
- Restrict MongoDB Atlas network access where practical; avoid `0.0.0.0/0` unless you understand the implications.
- The payment UI is a demo, not a production payment integration. Do not enter real payment credentials.
- Before production use, add validation, rate limiting, secure session/token handling, backups, logging, and tests.

## 🧪 Suggested Test Checklist

- [ ] Home page loads and featured rooms appear.
- [ ] Room search returns results for valid dates and guest counts.
- [ ] Registration and login work.
- [ ] Guests can create and view bookings.
- [ ] Overlapping bookings are rejected.
- [ ] Demo payment updates the expected booking/payment state.
- [ ] Admin can manage rooms and bookings.
- [ ] Unauthorized users cannot access admin-only API routes.
- [ ] Mobile and desktop layouts work.
- [ ] Backend health endpoint and database connection are healthy.

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit your changes.
4. Push the branch and open a pull request.

## 📄 License

No license is specified in this README. Add a `LICENSE` file if you intend to distribute the project under an open-source license.

---

<div align="center">

**Built with ❤️ for smoother hotel stays and simpler hotel operations.**

</div>
