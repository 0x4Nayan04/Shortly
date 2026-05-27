import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='text-center px-4'>
        <h1 className='text-6xl font-bold text-gray-300 mb-4'>404</h1>
        <p className='text-xl text-gray-600 mb-8'>Page not found</p>
        <Link
          to='/'
          className='inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors'
        >
          Go home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
