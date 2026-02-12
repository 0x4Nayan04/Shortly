import { useEffect } from 'react';
import { useFocusTrap } from './Accessibility';

const UserProfileModal = ({ isOpen, onClose, user, userStats }) => {
	// Focus trap for modal
	const focusTrapRef = useFocusTrap(isOpen, {
		onEscape: onClose,
		restoreFocus: true,
	});

	// Prevent body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div 
			className='fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4 bg-black'
			role="dialog"
			aria-modal="true"
			aria-labelledby="profile-modal-title"
			onClick={(e) => {
				// Close modal when clicking backdrop
				if (e.target === e.currentTarget) {
					onClose();
				}
			}}
		>
			<div 
				ref={focusTrapRef}
				className='bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-hide'
				role="document"
			>
				{/* Header */}
				<div className='flex items-center justify-between p-6 border-b border-gray-200'>
					<h2 id="profile-modal-title" className='text-xl font-semibold text-gray-900'>User Profile</h2>
					<button
						onClick={onClose}
						className='p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
						aria-label="Close profile modal">
						<svg
							className='w-5 h-5 text-gray-500'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
							aria-hidden="true">
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M6 18L18 6M6 6l12 12'
							/>
						</svg>
					</button>
				</div>

				{/* Profile Content */}
				<div className='p-6'>
					{/* Avatar and Basic Info */}
					<div className='flex flex-col items-center text-center mb-6'>
						<div className='relative mb-4'>
							<img
								src={user.avatar}
								alt={`${user.name}'s profile picture`}
								className='w-24 h-24 rounded-full shadow-lg'
								onError={(e) => {
									e.target.style.display = 'none';
									e.target.nextSibling.style.display = 'flex';
								}}
							/>
							<div 
								className='w-24 h-24 bg-blue-100 rounded-full items-center justify-center shadow-lg hidden'
								role="img"
								aria-label={`${user.name}'s profile picture placeholder`}
							>
								<span className='text-2xl font-bold text-blue-600' aria-hidden="true">
									{(user.name || user.email || 'U').charAt(0).toUpperCase()}
								</span>
							</div>
						</div>
						<h3 className='text-xl font-semibold text-gray-900 mb-1'>
							{user.name}
						</h3>
						<p className='text-gray-600 text-sm'>{user.email}</p>
						<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2'>
							<span className="sr-only">Account status: </span>
							Active Account
						</span>
					</div>

					{/* Account Stats */}
					<div className='grid grid-cols-2 gap-4 mb-6' role="group" aria-label="Account statistics">
						<div className='bg-gray-50 rounded-lg p-4 text-center'>
							<div className='text-2xl font-bold text-blue-600 mb-1' aria-hidden="true">
								{userStats?.totalUrls || 0}
							</div>
							<div className='text-sm text-gray-600'>URLs Created</div>
							<span className="sr-only">{userStats?.totalUrls || 0} URLs created</span>
						</div>
						<div className='bg-gray-50 rounded-lg p-4 text-center'>
							<div className='text-2xl font-bold text-green-600 mb-1' aria-hidden="true">
								{userStats?.totalClicks || 0}
							</div>
							<div className='text-sm text-gray-600'>Total Clicks</div>
							<span className="sr-only">{userStats?.totalClicks || 0} total clicks</span>
						</div>
					</div>

					{/* Account Details */}
					<div className='space-y-4'>
						<div>
							<label id="profile-name-label" className='text-sm font-medium text-gray-700 mb-1 block'>
								Full Name
							</label>
							<div 
								className='bg-gray-50 rounded-lg p-3 text-gray-900'
								aria-labelledby="profile-name-label"
							>
								{user.name}
							</div>
						</div>
						<div>
							<label id="profile-email-label" className='text-sm font-medium text-gray-700 mb-1 block'>
								Email Address
							</label>
							<div 
								className='bg-gray-50 rounded-lg p-3 text-gray-900'
								aria-labelledby="profile-email-label"
							>
								{user.email}
							</div>
						</div>
						<div>
							<label id="profile-member-label" className='text-sm font-medium text-gray-700 mb-1 block'>
								Member Since
							</label>
							<div 
								className='bg-gray-50 rounded-lg p-3 text-gray-900'
								aria-labelledby="profile-member-label"
							>
								<time dateTime={user.createdAt}>
									{user.createdAt
										? new Date(user.createdAt).toLocaleDateString('en-US', {
												year: 'numeric',
												month: 'long',
												day: 'numeric'
										  })
										: 'Recently joined'}
								</time>
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className='p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl'>
					<button
						onClick={onClose}
						className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};

export default UserProfileModal;
