# FlowTrack

> Built a full-stack production-ready task management system with JWT authentication, role-based access control, analytics dashboard, and performance tracking.

FlowTrack is a **Unified Task & Productivity Management System** — a production-ready MERN stack frontend built with React, Vite, and Tailwind CSS. It features role-based dashboards for Admins, Managers, and Employees, a drag-and-drop Kanban board, real-time analytics, attendance tracking, and PDF report generation.

---

## ✨ Features

- 🔐 **JWT Authentication** — Login, logout, forgot password, OTP verification, email verification
- 👥 **Role-Based Access Control** — Admin, Manager, Employee dashboards with protected routes
- 📊 **Analytics Dashboard** — Recharts-powered charts (area, bar, pie, line) for productivity & performance
- 🗂️ **Kanban Board** — Drag & drop task management with 4 columns (To Do, In Progress, In Review, Done)
- ✅ **Task Management** — Create, assign, update, delete tasks with priority & deadline tracking
- 🕐 **Attendance Tracking** — Check-in/check-out with time recording
- 🌴 **Leave Management** — Apply for leaves, approve/reject as manager/admin
- 📈 **Performance Tracking** — Individual and team performance history charts
- 🌙 **Dark Mode** — Full dark/light theme with system preference support
- 📱 **Responsive Design** — Mobile-first, works on all screen sizes
- 🎨 **Glassmorphism UI** — Modern frosted glass card effects
- 📄 **PDF Reports** — Export weekly/monthly reports using jsPDF
- 🔔 **Toast Notifications** — User feedback with react-toastify
- ✨ **Framer Motion Animations** — Page transitions and card animations

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | UI Framework |
| **Vite** | Build Tool |
| **Tailwind CSS** | Styling |
| **Framer Motion** | Animations & Transitions |
| **Recharts** | Data Visualization |
| **Axios** | HTTP Client |
| **React Router DOM v6** | Routing |
| **@hello-pangea/dnd** | Drag & Drop Kanban |
| **jsPDF + jspdf-autotable** | PDF Generation |
| **React Toastify** | Toast Notifications |
| **React Icons** | Icon Library |
| **Context API** | State Management |

---

## 📁 Project Structure

```
src/
├── api/
│   ├── axios.js              # Primary Axios instance
│   └── axiosInstance.js      # Named Axios instance with interceptors
├── components/
│   ├── common/               # Shared UI components
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Footer.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── SkeletonLoader.jsx
│   │   ├── Modal.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── PriorityBadge.jsx
│   │   └── SearchFilter.jsx
│   ├── auth/                 # Authentication forms
│   ├── dashboard/            # Role-specific dashboard widgets
│   ├── analytics/            # Chart & analytics components
│   ├── tasks/                # Kanban board & task components
│   ├── manager/              # Manager-specific components
│   └── employee/             # Employee-specific components
├── context/
│   ├── AuthContext.jsx       # Auth state (user, token, role)
│   ├── ThemeContext.jsx      # Dark/light mode
│   └── TaskContext.jsx       # Task state management
├── hooks/
│   ├── useAuth.js
│   ├── useTheme.js
│   ├── useTasks.js
│   ├── useDebounce.js
│   └── usePagination.js
├── layouts/
│   ├── AuthLayout.jsx        # Auth pages layout
│   ├── DashboardLayout.jsx   # Main app layout (sidebar + navbar)
│   └── PageTransition.jsx    # Framer Motion page wrapper
├── pages/
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx     # Role-based dashboard router
│   ├── AnalyticsPage.jsx
│   ├── TasksPage.jsx         # Kanban + List view
│   ├── ManagerPanelPage.jsx
│   ├── EmployeePanelPage.jsx
│   ├── ProfilePage.jsx
│   ├── SettingsPage.jsx
│   ├── NotFoundPage.jsx
│   └── ...
├── routes/
│   ├── AppRoutes.jsx         # Route configuration
│   └── ProtectedRoute.jsx    # Role-based route guard
├── services/                 # API service functions
├── utils/
│   ├── constants.js          # App-wide constants & enums
│   ├── helpers.js            # Utility functions
│   ├── validators.js         # Form validation
│   └── pdfGenerator.js       # PDF report utility
├── data/
│   └── mockData.js           # Development mock data
└── style/
    └── animations.css        # Custom CSS animations
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
# Clone the repository
git clone https://github.com/dev8116/flowtrack-frontend.git
cd flowtrack-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🔐 Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@flowtrack.com | Admin@123 |

> Additional Manager and Employee accounts can be created via the Admin panel (User Management).

---

## 📸 Screenshots

*(Add screenshots here)*

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.
