import { useState, useEffect } from 'react';
import {
	Routes,
	Route,
	useNavigate,
	useLocation,
	Navigate
} from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import AccountSettings from './components/AccountSettings';
import UserProfileModal from './components/UserProfileModal';
import { logoutUser, getCurrentUser } from './api/user.api';
import { getMyUrls } from './api/shortUrl.api';

// Helper components for proper routing
const LoginPage = ({ user, navigate, onLoginSuccess }) => {
	if (user) {
		return (
			<Navigate
				to='/dashboard'
				replace
			/>
		);
	}

	return (
		<div className='min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center py-12 px-4'>
			<div className='max-w-md w-full'>
				<button
					onClick={() => navigate('/')}
					className='mb-6 flex items-center text-gray-600 hover:text-gray-800 transition-colors'>
					<svg
						className='w-5 h-5 mr-2'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M15 19l-7-7 7-7'
						/>
					</svg>
					Back to home
				</button>
				<LoginForm
					onLoginSuccess={onLoginSuccess}
					switchToRegister={() => navigate('/register')}
				/>
			</div>
		</div>
	);
};

const RegisterPage = ({ user, navigate, onRegisterSuccess }) => {
	if (user) {
		return (
			<Navigate
				to='/dashboard'
				replace
			/>
		);
	}

	return (
		<div className='min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center py-12 px-4'>
			<div className='max-w-md w-full'>
				<button
					onClick={() => navigate('/')}
					className='mb-6 flex items-center text-gray-600 hover:text-gray-800 transition-colors'>
					<svg
						className='w-5 h-5 mr-2'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M15 19l-7-7 7-7'
						/>
					</svg>
					Back to home
				</button>
				<RegisterForm
					onRegisterSuccess={onRegisterSuccess}
					switchToLogin={() => navigate('/login')}
				/>
			</div>
		</div>
	);
};

const ProtectedRoute = ({ user, authChecked, component, navigate }) => {
	// Show loading only for protected routes while auth is being checked
	if (!authChecked) {
		return (
			<div className='min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2'></div>
					<p className='text-gray-600 text-sm'>Checking authentication...</p>
				</div>
			</div>
		);
	}
	
	if (!user) {
		return (
			<Navigate
				to='/login'
				replace
			/>
		);
	}
	return component;
};

const App = () => {
	const [user, setUser] = useState(null);
	const [authChecked, setAuthChecked] = useState(false);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [userStats, setUserStats] = useState({
		totalUrls: 0,
		totalClicks: 0
	});
	const navigate = useNavigate();
	const location = useLocation();

	// Fetch user stats for profile modal
	const fetchUserStats = async () => {
		try {
			// Get first 50 URLs for stats calculation
			const response = await getMyUrls(50, 0);
			if (response && response.data && response.data.urls) {
				const urls = response.data.urls;
				const totalClicks = urls.reduce(
					(sum, url) => sum + (url.click || 0),
					0
				);
				setUserStats({
					totalUrls: response.data.totalCount || urls.length,
					totalClicks: totalClicks
				});
			}
		} catch (error) {
			console.error('Error fetching user stats:', error);
		}
	};

	// Check for existing user session on component mount
	useEffect(() => {
		const checkAuthStatus = async () => {
			try {
				const response = await getCurrentUser();
				if (response && response.user) {
					setUser(response.user);
					// If user is logged in and on auth pages, redirect to dashboard
					if (
						location.pathname === '/login' ||
						location.pathname === '/register'
					) {
						navigate('/dashboard');
					}
				}
			} catch (error) {
				// User is not authenticated or session expired
				console.log('No active session');
				// If user is not authenticated and trying to access protected route, redirect to home
				if (location.pathname === '/dashboard' || location.pathname === '/settings') {
					navigate('/');
				}
			} finally {
				setAuthChecked(true);
			}
		};

		checkAuthStatus();
	}, [location.pathname, navigate]);

	const handleAuthSuccess = (response) => {
		setUser(response.user || { email: 'User' });
		navigate('/dashboard');
		console.log('User authenticated:', response);
	};

	const handleLogout = async () => {
		try {
			await logoutUser();
			setUser(null);
			navigate('/');
			console.log('User logged out successfully');
		} catch (error) {
			console.error('Logout error:', error);
			// Force logout even if API call fails
			localStorage.clear();
			sessionStorage.clear();
			setUser(null);
			navigate('/');
			console.log('Forced local logout due to API error');
		}
	};

	const showAuth = () => navigate('/login');

	const handleShowProfile = () => {
		fetchUserStats();
		setShowProfileModal(true);
	};

	return (
		<div className='min-h-screen bg-gray-50'>
			<Navbar
				user={user}
				onLogout={handleLogout}
				onShowAuth={showAuth}
				onShowProfile={handleShowProfile}
			/>
			<Routes>
				<Route
					path='/'
					element={
						<LandingPage
							onShowAuth={showAuth}
							user={user}
						/>
					}
				/>
				<Route
					path='/login'
					element={
						<LoginPage
							user={user}
							navigate={navigate}
							onLoginSuccess={handleAuthSuccess}
						/>
					}
				/>
				<Route
					path='/register'
					element={
						<RegisterPage
							user={user}
							navigate={navigate}
							onRegisterSuccess={handleAuthSuccess}
						/>
					}
				/>
				<Route
					path='/dashboard'
					element={
						<ProtectedRoute
							user={user}
							authChecked={authChecked}
							component={<Dashboard user={user} />}
							navigate={navigate}
						/>
					}
				/>
				<Route
					path='/settings'
					element={
						<ProtectedRoute
							user={user}
							authChecked={authChecked}
							component={<AccountSettings user={user} />}
							navigate={navigate}
						/>
					}
				/>
			</Routes>

			{/* Profile Modal */}
			{user && (
				<UserProfileModal
					isOpen={showProfileModal}
					onClose={() => setShowProfileModal(false)}
					user={user}
					userStats={userStats}
				/>
			)}
		</div>
	);
};

export default App;
