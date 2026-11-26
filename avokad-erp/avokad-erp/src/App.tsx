import { Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import ComingNext from './pages/ComingNext';
import Overview from './pages/Overview';
import Intake from './pages/Intake';
import InventoryExport from './pages/InventoryExport';
import AdminHr from './pages/AdminHr';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Overview />} />
        <Route path="intake" element={<Intake />} />
        <Route path="inventory-export" element={<InventoryExport />} />
        <Route path="admin-hr" element={<AdminHr />} />
        <Route path="*" element={<ComingNext title="Page not found" />} />
      </Route>
    </Routes>
  );
}
