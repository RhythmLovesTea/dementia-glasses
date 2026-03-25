import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AddPerson from './pages/AddPerson';
import People from './pages/People';
import PersonDetail from './pages/PersonDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                    element={<Dashboard />} />
        <Route path="/add-person"          element={<AddPerson />} />
        <Route path="/people"              element={<People />} />
        <Route path="/people/:personId"    element={<PersonDetail />} />
        <Route path="*"                    element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
