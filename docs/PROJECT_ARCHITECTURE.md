# Project Architecture Documentation: Ta Panda Innovation

This document provides a comprehensive overview of the architecture for the Ta Panda Innovation project. It is intended to help Senior Software Architects and AI agents quickly understand the codebase, its structural decisions, and its integration points without needing to manually inspect the source code.

---

## 1. Project Overview

* **Purpose of the project**: A digital storefront and portfolio website for Ta Panda Innovation, an interior design studio based in Kolkata. It showcases their projects, services, values, and provides a contact/consultation booking system. It also includes a custom CRM/Admin panel for managing the project gallery.
* **Technology stack**: 
  * **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (Vanilla)
  * **Backend**: Serverless (Supabase BaaS and Google Apps Script)
* **Overall architecture**: Single Page Application (SPA) approach for the public-facing site with smooth scrolling, paired with a separate single-page Admin CRM. Data is managed client-side and synced directly to Supabase.
* **Deployment architecture**: Static hosting (can be deployed on GitHub Pages, Vercel, Netlify, or similar).
* **Hosting platform**: Client-side static files.
* **Build system**: None (Vanilla web technologies without a bundler, though `package.json` exists for historical or local dev reasons).
* **Package manager**: npm (used primarily for local dependencies if any, but the core app relies on CDN links).
* **Runtime environment**: Web Browser.

---

## 2. Folder Structure

The project uses a flat folder structure for its core files, relying on a few directories for assets.

* **`/` (Root Directory)**
  * **Purpose**: Houses all core application files (HTML, CSS, JS).
  * **Contents**: `index.html`, `admin.html`, `script.js`, `admin.js`, `styles.css`, `admin.css`, `supabase-client.js`, `package.json`.
  * **Dependencies**: Relies on CDN for Supabase SDK.
* **`/images`**
  * **Purpose**: Stores static image assets used across the website.
  * **Contents**: Logos, background images, founder portraits, hero animation frames, and favicons. Highly optimized `.webp` format is preferred.
* **`/node_modules`**
  * **Purpose**: Local npm dependencies (e.g., Express, Multer, pg) likely used for an experimental or historical backend (as `server.js` is currently absent from the active architecture).

---

## 3. Routing Architecture

The application does not use a traditional JavaScript router (like React Router).

* **Route structure**: File-based routing determined by the web server.
* **Public routes**: 
  * `/` or `/index.html`: The main public landing page.
* **Admin routes**: 
  * `/admin.html`: The CRM dashboard.
* **Authentication flow**: 
  * The admin route has an HTML overlay (`#loginOverlay`). 
  * Authentication is handled purely on the client-side via a hardcoded password checked in `admin.js`.
* **Protected pages**: `/admin.html` (protected via simple DOM manipulation hiding the main content until the password is provided).
* **Dynamic routes**: None.
* **Layout hierarchy**: 
  * Public layout: Navbar -> Hero -> Sections (Projects, Values, Services, About, Contact) -> Footer.
  * Admin layout: Sidebar (Categories) -> Main Content Area (Items Grid).

---

## 4. Frontend Architecture

* **Framework**: Vanilla HTML, CSS, and JavaScript. No modern component frameworks (like React or Vue) are used.
* **UI libraries**: None. Custom DOM manipulation is used throughout.
* **Styling system**: Vanilla CSS. 
  * Utilizes CSS Variables (`:root`) for colors, typography, and spacing.
  * Extensively uses CSS Grid and Flexbox for layouts.
* **Component architecture**: Procedural. UI elements are updated via direct DOM selection (`document.getElementById`, `querySelector`) and imperative logic.
* **State management**: 
  * Application state (like loaded projects) is stored in global or module-scoped variables (e.g., `projectsData`, `activeCategoryId` in `admin.js`).
  * `sessionStorage` is used to persist the admin authentication state (`tapanda_crm_auth`).
* **Context providers**: N/A.
* **Hooks**: N/A.
* **Utilities**: Custom utility functions exist within the main JS files (e.g., image optimization to WebP via Canvas API in `admin.js`).

---

## 5. Backend Architecture

* **Does the project have a backend?**: Not a traditional monolithic backend. It uses a Backend-as-a-Service (BaaS) architecture.
* **How is it implemented?**: 
  * **Supabase** acts as the primary data and storage layer, accessed directly from the client browser via the `@supabase/supabase-js` SDK.
  * **Google Apps Script** acts as a serverless function endpoint to handle form submissions (Contact and Consultation) and likely triggers email notifications or populates a Google Sheet.

---

## 6. API Architecture

* **Supabase API (REST via SDK)**
  * **Endpoint**: `https://zkjgefkwrixevtdxrqgm.supabase.co`
  * **Purpose**: Fetching and saving project gallery data and uploading images.
  * **Authentication**: Uses a public Anon Key (`SUPABASE_ANON_KEY`).
* **Google Apps Script Web App**
  * **Endpoint**: `https://script.google.com/macros/s/.../exec` (Defined in `script.js` as `APP_SCRIPT_URL`)
  * **Purpose**: Form submission handling.
  * **Request**: `POST` with JSON payload containing form data (e.g., `formType`, `name`, `email`, `phone`).
  * **Response**: Implicit success (client ignores detailed response).
  * **Authentication**: None (Publicly accessible endpoint).

---

## 7. Database / Data Layer

* **Current database**: Supabase (PostgreSQL).
* **Schema Design**: 
  * Table: `projects_store`
  * The entire gallery structure (categories and items) is stored as a massive JSON object in a single row (`id=1`) inside a column named `data`.
* **External storage**: Supabase Storage.
  * Bucket: `portfolio`
  * Stores thumbnail and high-resolution actual images uploaded via the Admin CRM.
* **Local storage usage**: `sessionStorage` for admin login persistence.
* **Google Sheets usage**: Implied integration via the Google Apps Script endpoint for lead capturing.

---

## 8. Authentication System

* **Login flow**: User visits `/admin.html` -> Presented with a password input overlay -> Enters password -> JavaScript verifies against a hardcoded string -> Hides overlay and reveals CRM.
* **Session handling**: `sessionStorage.setItem('tapanda_crm_auth', 'true')`.
* **Token storage**: N/A. (No JWTs used for the user auth, only the Supabase Anon Key is used for database access).
* **User roles**: Single role (Admin).
* **Permissions**: Anyone with the password has full read/write/delete access to the database via the client application.

---

## 9. Build & Deployment

* **Build process**: None. The files are served exactly as they are written.
* **Deployment workflow**: Manual or via simple Git integration with a static hosting provider.
* **GitHub Actions / CI/CD**: Not explicitly defined in the current directory.
* **Static hosting**: The architecture is perfectly suited for static hosting (GitHub Pages, Vercel, Netlify).
* **Environment variables**: Not securely utilized in production. Supabase keys are hardcoded in `supabase-client.js`. (Note: A `.dotenv` dependency exists in `package.json`, likely for legacy server use).

---

## 10. Admin Panel Architecture

* **Pages**: A single page (`admin.html`).
* **Layout**: CSS Grid/Flexbox layout with a fixed left Sidebar and a scrolling Main Content area.
* **Components (Procedural)**:
  * **Sidebar**: Manages Categories (Add, Edit, Delete, Select).
  * **Main Content**: Displays the Items Grid for the selected category.
  * **Modals**: "Add New Item" modal for handling bulk/single image uploads, titles, and details.
* **Features**:
  * Client-side image optimization (resizing and converting to `.webp` via HTML5 Canvas) before uploading to Supabase.
  * Force Cloud Sync button to manually push `projectsData` state to Supabase.
  * Automatic shuffling of gallery items on upload.

---

## 11. Reusable Components

While not built with a component framework, several UI patterns are reused:

* **`.nav-cta`, `.btn-primary`**: Standardized button styling.
* **`.reveal` / `.card-parallax`**: CSS classes used in conjunction with `IntersectionObserver` to trigger scroll animations.
* **`.service-card` / `.value-slide-card`**: Standardized card layouts for presenting textual information with icons.
* **Lightbox (`#lightbox`)**: A custom full-screen image viewing gallery with next/previous navigation used on the main portfolio grid.

---

## 12. Styling System

* **Framework**: Custom Vanilla CSS.
* **CSS Variables (Design Tokens)**: Defined in `:root` (e.g., `--accent-gold`, `--bg-primary`, `--text-primary`).
* **Typography**: Heavy use of Google Fonts:
  * `Cormorant Garamond` & `Playfair Display` (Serif, Headlines)
  * `Outfit` & `Inter` (Sans-serif, Body text)
* **Responsive system**: CSS Media Queries are used to adjust grid layouts (e.g., changing from 3 columns to 1 column on mobile) and font sizes.
* **Icons**: Inline SVG icons are used throughout the HTML.

---

## 13. Performance

* **Lazy loading**: Applied natively to images using `loading="lazy"`.
* **Code splitting**: Not implemented. All JS is loaded in a single `script.js` file.
* **Optimizations**: 
  * The Admin CRM forcibly optimizes all uploaded images to WebP format with a maximum width (800px for thumbnails, 1920px for actual images) before hitting the network.
* **Bundle size strategy**: N/A.

---

## 14. Security

* **Authentication**: Extremely weak. Uses client-side validation with a hardcoded password.
* **Authorization**: None. No Server-Side validation of admin rights.
* **API protection**: Supabase relies on Row Level Security (RLS). If RLS is not configured properly in the Supabase dashboard, the database is vulnerable to unauthorized writes because the Anon key is public.
* **Secrets**: `SUPABASE_ANON_KEY` is public (standard for Supabase, provided RLS is active). No backend secrets are currently managed.

---

## 15. Existing Integrations

* **Supabase**: Primary Database (PostgreSQL) and Blob Storage.
* **Google Apps Script**: Handles form submissions (Contact and Free Consultation requests).
* **Social Platforms**: Outbound links and icons for Facebook and Instagram.
* **WhatsApp**: Direct chat links integrated into the floating button and footer (`wa.me` links).
* **Google Maps**: Embedded iframe in the footer to show the business location.

---

## 16. Existing Dashboard Capability

* **Pages**: Single Dashboard (`admin.html`).
* **Widgets/Features**:
  * Category Manager (Create, Rename, Delete).
  * Project Item Manager (Upload images, set Title/Subtitle).
  * Auto-Optimizer (Client-side Canvas WebP converter).
  * Cloud Sync Status indicator.
* **Reusable Components**: The modular structure of the JS allows for the extraction of the WebP optimizer function and the Supabase upload logic.

---

## 17. Extensibility Analysis: Ta Panda Marketing OS

**Goal:** Determine the viability of integrating a new "Marketing OS" module.

* **Can it be integrated into the current architecture?**
  Yes, but doing so within the current Vanilla JS SPA architecture is highly discouraged. Vanilla JS becomes difficult to maintain as application state complexity increases.
* **Should it be a separate module?**
  **Yes. Highly recommended.** The Marketing OS should be built as a separate application (e.g., in a `/marketing-os` sub-directory) using a modern framework like React (Next.js/Vite) or Vue.
* **Can it communicate with n8n Webhooks?**
  Yes. Standard `fetch()` API calls can be made to any n8n webhook endpoint.
* **Can it consume REST APIs?**
  Yes, using the native `fetch()` API.
* **Can it work with Google Sheets?**
  Yes. It can expand upon the existing Google Apps Script pattern or use direct API integrations.
* **Can it support real-time updates?**
  Yes. Supabase has built-in Realtime subscriptions via WebSockets which can be utilized.
* **Can it support Kanban Boards, Calendar Views, Charts?**
  Implementing these in Vanilla JS is extremely tedious. A framework (React/Vue) allows the use of established libraries (e.g., `react-beautiful-dnd`, `fullcalendar`, `chart.js`) making this highly feasible.
* **Can it support File Uploads?**
  Yes, extending the existing Supabase Storage logic.
* **Can it support Authentication & Role-based Access (RBAC)?**
  **Needs Refactoring.** The current hardcoded password must be discarded. Supabase Auth must be implemented to manage users, sessions, and roles securely via JWTs, coupled with proper Row Level Security (RLS) policies in the database.

---

## 18. Recommendations

1. **Frontend Modernization**: For any complex new features (like the Marketing OS), migrate the dashboard/admin architecture to a modern component-based framework (React/Next.js).
2. **Security Overhaul**: 
   * Immediately replace the client-side hardcoded password with Supabase Auth (Email/Password or OAuth).
   * Ensure Supabase Row Level Security (RLS) is strictly configured to prevent unauthorized data manipulation.
3. **Database Normalization**: Move away from storing the entire project gallery as a single JSON blob. Utilize standard relational tables (e.g., a `categories` table and a `project_items` table) to improve query efficiency, indexing, and partial updates.

---

## 19. AI Integration Notes

*(For AI Software Architects extending this project)*

* **Important design decisions**: The site heavily relies on direct DOM manipulation and `IntersectionObserver` for animations. Do not expect reactive state binding in the current `script.js` or `admin.js`.
* **Coding conventions**: 
  * Procedural JavaScript. Event listeners are bound directly in `DOMContentLoaded`.
  * CSS relies on utility-like classes (`.reveal`) mixed with semantic class names (`.hero-sequence-container`).
* **Architectural patterns**: Client-heavy BaaS. The browser acts as a thick client connecting directly to Supabase.
* **Data Mutability (`admin.js`)**: The `projectsData` global object acts as the single source of truth in the admin panel. Any modifications to this object must be followed by a call to `saveData()` to sync the JSON blob to Supabase.
* **Image Handling**: Always pass newly uploaded files through the `optimizeToWebP()` function before calling Supabase storage uploads to maintain performance standards.
* **Areas to modify with caution**: 
  * The Hero canvas animation logic in `script.js` relies on precise frame calculations linked to scroll percentage. Modify with extreme care to avoid breaking the visual sequence.
  * The Values section pinned scroll transition (`values-pinned-container`) utilizes complex, synchronized opacity and transform interpolations.
