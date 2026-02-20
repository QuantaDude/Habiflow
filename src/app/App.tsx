import { RouterProvider } from 'react-router';
import { router } from './routes';
import { HabitProvider } from './context/HabitContext';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <HabitProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </HabitProvider>
  );
}
