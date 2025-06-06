import UrlForm from '../components/UrlForm';
import { useNavigate } from 'react-router-dom';

const LandingPage = ({ onShowAuth, user }) => {
	const navigate = useNavigate();
	return (
		<div className='min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 to-indigo-100'>
			{/* Hero Section */}
			<div className='max-w-4xl mx-auto px-4 pt-20 pb-16 text-center'>
				<h1 className='text-5xl md:text-6xl font-bold text-gray-900 mb-6'>
					Shorten URLs.
					<br />
					<span className='text-blue-600'>Share Everywhere.</span>
				</h1>
				<p className='text-xl text-gray-600 mb-12 max-w-2xl mx-auto'>
					Transform long, complex URLs into short, memorable links that are easy
					to share and track.
				</p>

				{/* URL Shortener Card */}
				<div className='max-w-2xl mx-auto'>
					<div className='bg-white rounded-2xl shadow-xl p-8 border border-gray-100'>
						<UrlForm
							user={user}
							onShowAuth={() => navigate('/login')}
						/>

						{/* Call to Action - Only show if user is not logged in */}
						{!user && (
							<div className='mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100'>
								<h3 className='text-lg font-semibold text-blue-900 mb-2'>
									Want to track and manage your links?
								</h3>
								<p className='text-blue-700 mb-4'>
									Create an account to save your URLs and create custom short
									links.
								</p>
								<button
									onClick={onShowAuth}
									className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors'>
									Get Started Free
								</button>
							</div>
						)}

						{/* Logged in user message */}
						{user && (
							<div className='mt-8 p-6 bg-green-50 rounded-xl border border-green-100'>
								<h3 className='text-lg font-semibold text-green-900 mb-2'>
									Welcome back, {user.name}! 👋
								</h3>
								<p className='text-green-700 mb-4'>
									You're logged in and ready to create short URLs. Visit your
									dashboard to manage all your links.
								</p>
								<button
									onClick={() => navigate('/dashboard')}
									className='bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors'>
									Go to Dashboard
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default LandingPage;
