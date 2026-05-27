import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, ExternalLink } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='text-center px-4 max-w-md'>
        <div className='w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6'>
          <span className='text-4xl font-bold text-indigo-600'>404</span>
        </div>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>Page not found</h1>
        <p className='text-gray-600 mb-1'>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <p className='text-sm text-gray-400 mb-8'>
          Check the URL for typos or use a link below.
        </p>
        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <button
            onClick={() => navigate(-1)}
            className='inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2'
          >
            <ArrowLeft className='w-4 h-4' aria-hidden='true' />
            Go back
          </button>
          <Link
            to='/'
            className='inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2'
          >
            <Home className='w-4 h-4' aria-hidden='true' />
            Home page
          </Link>
        </div>
        <div className='mt-8 pt-6 border-t border-gray-200'>
          <p className='text-sm text-gray-500 mb-3'>Try these pages instead:</p>
          <div className='flex flex-wrap gap-2 justify-center'>
            <Link to='/' className='text-sm text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1'>
              URL Shortener <ExternalLink className='w-3 h-3' aria-hidden='true' />
            </Link>
            <Link to='/login' className='text-sm text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1'>
              Sign In <ExternalLink className='w-3 h-3' aria-hidden='true' />
            </Link>
            <Link to='/register' className='text-sm text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1'>
              Sign Up <ExternalLink className='w-3 h-3' aria-hidden='true' />
            </Link>
            <Link to='/privacy' className='text-sm text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1'>
              Privacy <ExternalLink className='w-3 h-3' aria-hidden='true' />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
