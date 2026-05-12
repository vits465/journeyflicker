# JourneyFlicker — Curated Discovery

A luxury travel-agency web app built with **React + TypeScript + Vite + TailwindCSS** (frontend) and **Express + Zod** (backend).

**Live Demo**: [https://journeyflicker.com/](https://journeyflicker.com/) (Replace with your actual live URL)

## Features

- **Modern & Responsive UI**: Beautifully designed pages using TailwindCSS, with smooth animations and lazy loading.
- **Image Optimization & Lazy Loading**: Built-in logic for fast performance and optimal media handling.
- **Admin Dashboard**: Comprehensive secure admin panel to manage tours, destinations, visas, and user inquiries.
- **Secure Authentication**: Built with JWT, Scrypt hashing, and rate-limiting to prevent brute force attacks.
- **Analytics & SEO Ready**: Includes `sitemap.xml`, `robots.txt`, open-graph tags, and structured dynamic SEO meta elements.
- **Modular Backend Architecture**: Powered by Express, Mongoose, Zod for strict validation, and Upstash Redis for caching.

## Screenshots

*(Add screenshots of your application here to improve your GitHub profile and recruiter impression!)*

<details>
<summary>Click to view screenshots</summary>

- ![Home Page](/path/to/home-screenshot.jpg)
- ![Tours Listing](/path/to/tours-screenshot.jpg)
- ![Admin Dashboard](/path/to/admin-screenshot.jpg)

</details>

---

## Quick Start

### 1 — Install & run the backend API (port 5174)

```bash
cd backend
npm install
npm run dev
```

The API will serve on **http://localhost:5174**.  
The seed data lives in `backend/data/db.json` — all edits persist there.

### 2 — Install & run the frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

---

## Project Structure

```
journeyflicker/
├── backend/
│   ├── src/index.js          Express REST API
│   ├── data/db.json          JSON database (seed data included)
│   └── package.json
│
└── frontend/
    ├── index.html
    ├── vite.config.ts         Dev-server + API proxy (/api → :5174)
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── postcss.config.js
    └── src/
        ├── main.tsx
        ├── App.tsx            Routes (public + admin)
        ├── index.css          Tailwind base + custom animations
        ├── App.css
        ├── components/
        │   ├── Header.tsx
        │   ├── Footer.tsx
        │   ├── SiteLayout.tsx
        │   ├── AdminLayout.tsx
        │   └── ScrollFx.tsx   Intersection-observer scroll animations
        ├── lib/
        │   ├── api.ts         Typed API client (fetch wrapper + types)
        │   └── useScrollFx.ts Hook powering reveal + parallax effects
        └── pages/
            ├── HomePage.tsx
            ├── ToursPage.tsx
            ├── TourDetailsPage.tsx
            ├── DestinationsPage.tsx
            ├── DestinationDetailsPage.tsx
            ├── VisasPage.tsx
            ├── AboutPage.tsx
            ├── FaqPage.tsx
            ├── ContactPage.tsx
            ├── AdminDashboard.tsx
            ├── AdminDestinations.tsx
            ├── AdminTours.tsx
            └── AdminVisas.tsx
```

---

## Routes

| Path | Page |
|------|------|
| `/` | Home |
| `/tours` | Tours listing |
| `/tours/:id` | Tour detail |
| `/destinations` | Destinations listing |
| `/destinations/:id` | Destination detail |
| `/visas` | Visa intelligence |
| `/about` | About |
| `/faq` | FAQ |
| `/contact` | Contact |
| `/admin` | Admin dashboard |
| `/admin/destinations` | Manage destinations |
| `/admin/tours` | Manage tours |
| `/admin/visas` | Manage visas |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/destinations` | List all destinations |
| GET | `/api/destinations/:id` | Get one destination |
| POST | `/api/destinations` | Create destination |
| PUT | `/api/destinations/:id` | Update destination |
| DELETE | `/api/destinations/:id` | Delete destination |
| GET | `/api/tours` | List all tours |
| GET | `/api/tours/:id` | Get one tour |
| POST | `/api/tours` | Create tour |
| PUT | `/api/tours/:id` | Update tour |
| DELETE | `/api/tours/:id` | Delete tour |
| GET | `/api/visas` | List all visas |
| POST | `/api/visas` | Create visa |
| PUT | `/api/visas/:id` | Update visa |
| DELETE | `/api/visas/:id` | Delete visa |
| POST | `/api/upload` | Upload image (base64) |

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, React Router v6, TailwindCSS v3
- **Fonts**: Inter, Outfit, Cormorant Garamond, Material Symbols Outlined (Google Fonts)
- **Backend**: Node.js (ESM), Express 4, Zod validation, JSON file store
- **Images**: Unsplash (CDN URLs, no API key needed)
