<div align="center">

# 🏨 HotelPro

### A smarter way to manage hotel stays, rooms, guests, and reservations.

A full-stack hotel management application built with **React, Vite, Node.js, Express, and MongoDB**.

<p>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18">
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-API-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License">
</p>

**Room discovery · Reservation management · Payments demo · Role-based admin dashboard**

</div>

---

## 📚 Table of Contents

- [✨ Overview](#-overview)
- [🚀 Features](#-features)
- [🧰 Tech Stack](#-tech-stack)
- [🖼️ Screenshots](#️-screenshots)
- [🏗️ Project Structure](#️-project-structure)
- [⚙️ Getting Started](#️-getting-started)
- [🔐 Demo Accounts](#-demo-accounts)
- [💳 Payment Demo](#-payment-demo)
- [🔌 API Overview](#-api-overview)
- [🛡️ Security Notes](#️-security-notes)
- [🧪 Testing](#-testing)
- [📦 Production Build](#-production-build)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## ✨ Overview

**HotelPro** is a full-stack hotel management system designed to make the reservation lifecycle easier to manage. Guests can explore rooms, book stays, manage their reservations, and try a simulated payment flow. Authorized staff can manage room inventory, guest records, bookings, payments, and hotel dashboard statistics.

The application uses a React frontend and an Express REST API backed by MongoDB. JWT authentication and role-based access control separate guest, staff, and administrator capabilities.

## 🚀 Features

### 🧳 For guests
- Create an account and sign in securely.
- Browse rooms and filter availability by dates, guest count, room type, and price.
- View room details and booked dates.
- Create reservations with server-calculated pricing and tax.
- View personal bookings and cancel eligible reservations.
- View a profile and manage account details.
- Try the simulated card/UPI payment experience.

### 🧑‍💼 For staff
- View dashboard statistics, including occupancy, revenue, arrivals, and departures.
- Add and update room information and mark rooms for maintenance.
- Search and filter reservations.
- Move bookings through confirmation, check-in, and check-out workflows.
- Record payments, including cash payments.
- Search guest records and review stay history.
- Access the payment ledger.

### 🛠️ For administrators
- Access staff management features.
- Delete rooms and users.
- Create staff/admin accounts and update user roles.

### 🔒 Security-minded implementation
- Password hashing with bcrypt.
- JWT-based authentication and role checks.
- Public registration is restricted to guest accounts.
- Security headers, CORS configuration, and authentication rate limiting.
- Request sanitization and Mongoose validation.
- Guests are restricted to their own bookings and payments.
- Card numbers are not persisted; the demo payment flow retains only limited card metadata.

> **Important:** The payment integration is simulated for development and demonstration. It is not a production payment gateway.

## 🧰 Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, React Router, Axios |
| UI | Bootstrap 5, Bootstrap Icons, custom CSS |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Security | Helmet, CORS, express-rate-limit, input sanitization |
| Development | npm, Vite, Nodemon |

## 🖼️ Screenshots

Want to showcase the UI? Add screenshots to a folder such as `docs/screenshots/`, then replace the examples below with your actual image paths.

```md
![HotelPro Home](docs/screenshots/home.png)
![Room Listing](docs/screenshots/rooms.png)
![Admin Dashboard](docs/screenshots/admin-dashboard.png)
```

<!-- Once you add screenshots, you can display them here:
<p align="center">
  <img src="docs/screenshots/home.png" alt="HotelPro home page" width="80%">
</p>
-->

## 🏗️ Project Structure

```text
HotelPro/
├── backend/
│   ├── config/          # Database connection
│   ├── controllers/     # Request handlers and business logic
│   ├── middleware/      # Authentication, authorization, errors, sanitization
│   ├── models/          # User, Room, Booking, Payment schemas
│   ├── routes/          # API routes
│   ├── test/            # API smoke test
│   ├── utils/           # Helpers and availability logic
│   ├── .env.example     # Environment variable template
│   ├── app.js
│   ├── server.js
│   └── seed.js          # Demo users and room data
└── frontend/
    ├── src/
    │   ├── components/  # Shared UI components
    │   ├── context/     # Authentication context
    │   ├── pages/       # Guest-facing pages
    │   ├── pages/admin/ # Admin and staff pages
    │   ├── api.js
    │   ├── App.jsx
    │   └── main.jsx
    └── vite.config.js
```

## ⚙️ Getting Started

### Prerequisites

Install the following before running the project:

- **Node.js 18 or later** (recommended)
- npm (included with Node.js)
- MongoDB running locally, or a MongoDB Atlas database URI
- Git (optional, for cloning the repository)

### 1. Get the project

```bash
git clone https://github.com/Mohitrath/Hotel-Pro.git
cd Hotel-Pro
```

If you downloaded the project as a ZIP, extract it and open the extracted project folder in your terminal.

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a local environment file by copying the example:

**Windows PowerShell**
```powershell
Copy-Item .env.example .env
```

**Linux / macOS / WSL**
```bash
cp .env.example .env
```

Open `backend/.env` and configure your local values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hotelpro
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
TAX_RATE=0.12
```

For MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string. Keep credentials private and URL-encode special characters in the database username or password when required.

### 3. Seed demo data

With MongoDB available, run:

```bash
npm run seed
```

This creates the demo accounts and sample rooms. Run the seed script only when you intend to create or reset the sample data.

### 4. Start the backend

```bash
npm run dev
```

The API should be available at:

- API base: `http://localhost:5000/api`

Keep this terminal running.

### 5. Start the frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally:

- **Frontend:** `http://localhost:5173`

### 6. Frontend API configuration

Check `frontend/src/api.js` for the API base URL. If your backend runs at a different host or port, update the configuration accordingly. For a production Vite build, configure `VITE_API_URL` if the app's API client is set up to read it.

## 🔐 Demo Accounts

After running `npm run seed`, the current seed setup provides these development accounts:

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@hotelpro.com` | `Admin@123` |
| Staff | `staff@hotelpro.com` | `Staff@123` |
| Guest | `guest@hotelpro.com` | `Guest@123` |

Use these accounts for local testing only. **Change or remove demo credentials before deploying publicly.** Do not use these passwords for real accounts.

## 💳 Payment Demo

HotelPro currently uses a **simulated payment gateway**. It is intended for testing the application workflow, not for processing real money.

| Test card | Result |
|---|---|
| `4242 4242 4242 4242` | Simulated success |
| `4000 0000 0000 0002` | Simulated decline |

Use a future expiry date and any required test CVV if requested by the form. Do not enter real payment card details.

For real payments, integrate a provider such as Razorpay or Stripe using server-side order creation and verified webhook/signature handling before marking a payment as successful.

## 🔌 API Overview

The backend exposes REST endpoints under `/api`.

| Area | Example endpoints | Access |
|---|---|---|
| Authentication | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/me` | Public / authenticated |
| Rooms | `GET /rooms`, `GET /rooms/:id`, `GET /rooms/:id/booked-dates` | Public |
| Room management | `GET /rooms/manage/all`, `POST /rooms`, `PUT /rooms/:id` | Staff / admin |
| Bookings | `POST /bookings`, `GET /bookings/my`, `GET /bookings/:id`, `PUT /bookings/:id/cancel` | Authenticated; ownership rules apply |
| Booking operations | `GET /bookings`, `PUT /bookings/:id/status` | Staff / admin |
| Payments | `POST /payments`, `GET /payments/my` | Authenticated |
| Payment ledger | `GET /payments` | Staff / admin |
| Users | `GET /users`, `GET /users/:id` | Staff / admin |
| User administration | `POST /users`, `PUT /users/:id/role`, `DELETE /users/:id` | Role-restricted |
| Dashboard | `GET /dashboard/stats` | Staff / admin |

For protected endpoints, send the access token in the request header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Errors are returned as JSON with a `message` field. See `backend/routes/` and `backend/controllers/` for implementation details.

## 🛡️ Security Notes

Before deploying:

- [ ] Ensure `.env` files and secrets are excluded from Git.
- [ ] Generate a strong, unique `JWT_SECRET`.
- [ ] Use a production MongoDB user with least-privilege access.
- [ ] Restrict `CLIENT_URL` / CORS to your deployed frontend origin.
- [ ] Replace simulated payments with a real provider integration if needed.
- [ ] Change or remove demo accounts and passwords.
- [ ] Use HTTPS and review production logging and error handling.
- [ ] Never commit database connection strings, API keys, or payment credentials.

## 🧪 Testing

The backend includes an API smoke test covering key flows such as authentication, access control, booking overlap checks, payments, refunds, expiry, and dashboard data.

Use a **disposable test database** because the test removes its test database after execution:

```bash
cd backend
TEST_MONGO_URI=mongodb://127.0.0.1:27017/hotelpro_test node test/smoke.test.js
```

In Windows PowerShell, set the variable first:

```powershell
$env:TEST_MONGO_URI="mongodb://127.0.0.1:27017/hotelpro_test"
node test/smoke.test.js
```

## 📦 Production Build

Build the frontend:

```bash
cd frontend
npm install
npm run build
```

Vite generates production assets in `frontend/dist/`.

For deployment, host the frontend on a static hosting service and deploy the backend separately. Set the frontend API URL to your deployed backend and configure the backend's `CLIENT_URL`, `MONGO_URI`, and `JWT_SECRET` using the hosting provider's environment-variable settings. Never upload `.env` files or secrets to the repository.

## 🗺️ Roadmap

Potential improvements:

- [ ] Real payment gateway integration with verified webhooks
- [ ] Email confirmations and reservation notifications
- [ ] Automated tests in CI
- [ ] Booking and occupancy analytics enhancements
- [ ] Production deployment guide and UI screenshots

## 🤝 Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Make and test your changes.
4. Commit your work: `git commit -m "Add your feature"`.
5. Push the branch and open a pull request.

## 📄 License

No license file was included in the project archive. Add a `LICENSE` file and update this section before describing the project as MIT-licensed or granting reuse rights.

---

<div align="center">

**Built with ☕ and code — HotelPro**

If you find a bug or have an improvement idea, open an issue in the repository.

</div>
