import { useLocation } from 'react-router-dom';
import { useDocumentMeta } from './hooks/useDocumentMeta';
import { LiveRegion, SkipLink } from './components/Accessibility';
import { useAuth } from './contexts/AuthContext';
import AppRoutes from './routes/AppRoutes';

const App = () => {
  const location = useLocation();
  const { announcement } = useAuth();

  useDocumentMeta(location.pathname);

  return (
    <div className='min-h-screen'>
      <SkipLink targetId='main-content' />

      <LiveRegion
        message={announcement}
        politeness='polite'
      />

      <AppRoutes />
    </div>
  );
};

export default App;
