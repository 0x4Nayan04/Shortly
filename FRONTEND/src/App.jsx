import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import {
	Routes,
	Route,
	useNavigate,
	useLocation,
	Navigate
} from 'react-router-dom';
import Navbar from './components/Navbar';
import { PageLoader } from './components/LoadingSpinner';
import { SkipLink, LiveRegion, useAnnouncement } from './components/Accessibility';
import { logoutUser, getCurrentUser } from './api/user.api';
import { getMyUrls } from './api/shortUrl.api';

// Lazy load heavy components for code splitting
const LandingPage = lazy(() => import('./components/LandingPage'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const LoginForm = lazy(() => import('./components/LoginForm'));
const RegisterForm = lazy(() => import('./components/RegisterForm'));
const AccountSettings = lazy(() => import('./components/AccountSettings'));
const UserProfileModal = lazy(() => import('./components/UserProfileModal'));

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
		<main
			id="main-content"
			className='min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center py-12 px-4'
			role="main"
			aria-labelledby="login-heading"
		>
			<div className='max-w-md w-full'>
				<button
					onClick={() => navigate('/')}
					className='mb-6 flex items-center text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg px-2 py-1'
					aria-label="Go back to home page">
					<svg
						className='w-5 h-5 mr-2'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
						aria-hidden="true">
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M15 19l-7-7 7-7'
						/>
					</svg>
					Back to home
				</button>
				<Suspense fallback={<PageLoader message="Loading login form..." />}>
					<LoginForm
						onLoginSuccess={onLoginSuccess}
						switchToRegister={() => navigate('/register')}
					/>
				</Suspense>
			</div>
		</main>
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
		<main
			id="main-content"
			className='min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center py-12 px-4'
			role="main"
			aria-labelledby="register-heading"
		>
			<div className='max-w-md w-full'>
				<button
					onClick={() => navigate('/')}
					className='mb-6 flex items-center text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg px-2 py-1'
					aria-label="Go back to home page">
					<svg
						className='w-5 h-5 mr-2'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
						aria-hidden="true">
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M15 19l-7-7 7-7'
						/>
					</svg>
					Back to home
				</button>
				<Suspense fallback={<PageLoader message="Loading registration form..." />}>
					<RegisterForm
						onRegisterSuccess={onRegisterSuccess}
						switchToLogin={() => navigate('/login')}
					/>
				</Suspense>
			</div>
		</main>
	);
};

const ProtectedRoute = ({ user, authChecked, component, navigate }) => {
	// Show loading only for protected routes while auth is being checked
	if (!authChecked) {
		return (
			<main
				id="main-content"
				className='min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center'
				role="main"
				aria-busy="true"
				aria-label="Checking authentication status"
			>
				<div className='text-center' role="status">
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2' aria-hidden="true"></div>
					<p className='text-gray-600 text-sm'>Checking authentication...</p>
				</div>
			</main>
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
	const [announcement, announce] = useAnnouncement();
	const navigate = useNavigate();
	const location = useLocation();

	// Memoized fetch user stats function
	const fetchUserStats = useCallback(async () => {
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
	}, []);

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

	// Memoized auth success handler
	const handleAuthSuccess = useCallback((response) => {
		const userData = response.data?.user || response.user;
		setUser(userData || { email: 'User' });
		announce('Successfully signed in. Redirecting to dashboard.');
		navigate('/dashboard');
	}, [navigate, announce]);

	// Memoized logout handler
	const handleLogout = useCallback(async () => {
		try {
			await logoutUser();
		} catch {
		} finally {
			setUser(null);
			announce('You have been signed out.');
			navigate('/');
		}
	}, [navigate, announce]);

	// Memoized showAuth handler
	const showAuth = useCallback(() => navigate('/login'), [navigate]);

	// Memoized profile handler
	const handleShowProfile = useCallback(() => {
		fetchUserStats();
		setShowProfileModal(true);
	}, [fetchUserStats]);

	// Memoized close profile handler
	const handleCloseProfile = useCallback(() => setShowProfileModal(false), []);

	return (
		<div className='min-h-screen bg-gray-50'>
			{/* Skip Link for keyboard navigation */}
			<SkipLink targetId="main-content" />
			
			{/* Live region for screen reader announcements */}
			<LiveRegion message={announcement} politeness="polite" />
			
			<Navbar
				user={user}
				onLogout={handleLogout}
				onShowAuth={showAuth}
				onShowProfile={handleShowProfile}
			/>
			<Suspense fallback={<PageLoader />}>
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
			</Suspense>

			{/* Profile Modal - Only render when user exists */}
			{user && showProfileModal && (
				<Suspense fallback={null}>
					<UserProfileModal
						isOpen={showProfileModal}
						onClose={handleCloseProfile}
						user={user}
						userStats={userStats}
					/>
				</Suspense>
			)}
		</div>
	);
};

export default App;
