import { useLocation } from 'react-router-dom';
import { useDocumentMeta } from './hooks/useDocumentMeta';
import { SkipLink } from './components/Accessibility';
import AppRoutes from './routes/AppRoutes';

const App = () => {
  const location = useLocation();

  useDocumentMeta(location.pathname);

  return (
    <div className="min-h-screen">
      <SkipLink targetId="main-content" />

      <AppRoutes />
    </div>
  );
};

export default App;
