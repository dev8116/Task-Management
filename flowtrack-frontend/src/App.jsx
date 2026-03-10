import './styles/global.css';
import './styles/sidebar.css';
import './styles/navbar.css';
import './styles/dashboard.css';
import './styles/auth.css';
import './styles/login.css';
import './styles/register.css';
import './styles/tasks.css';
import './styles/projects.css';
import './styles/attendance.css';
import './styles/leave.css';
import './styles/productivity.css';
import './styles/statcard.css';
import './styles/loading.css';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TaskProvider } from './context/TaskContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <TaskProvider>
            <AppRoutes />
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
          </TaskProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}