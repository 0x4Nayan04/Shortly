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
			className='fixed inset-0 z-50 flex items-center justify-center p-4'
			role="dialog"
			aria-modal="true"
			aria-labelledby="profile-modal-title"
		>
			<div 
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				aria-hidden="true"
				onClick={onClose}
			/>
			<div 
				ref={focusTrapRef}
				className='relative bg-white rounded-2xl shadow-xl border border-gray-100/50 max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-hide animate-scale-in'
				role="document"
				onClick={(e) => e.stopPropagation()}
			>
				<div className='flex items-center justify-between p-6 border-b border-gray-100/60'>
					<h2 id="profile-modal-title" className='text-xl font-semibold text-gray-900'>User Profile</h2>
					<button
						onClick={onClose}
						className='p-2 hover:bg-gray-50/80 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2'
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

				<div className='p-6'>
					<div className='flex flex-col items-center text-center mb-6'>
						<div className='relative mb-4'>
							<img
								src={user.avatar}
								alt={`${user.name}'s profile picture`}
								className='w-24 h-24 rounded-full ring-2 ring-gray-100 shadow-lg'
								onError={(e) => {
									e.target.style.display = 'none';
									e.target.nextSibling.style.display = 'flex';
								}}
							/>
							<div 
								className='w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center ring-2 ring-gray-100 shadow-lg'
								style={{ display: 'none' }}
								role="img"
								aria-label={`${user.name}'s profile picture placeholder`}
							>
								<span className='text-2xl font-bold text-indigo-700' aria-hidden="true">
									{(user.name || user.email || 'U').charAt(0).toUpperCase()}
								</span>
							</div>
						</div>
						<h3 className='text-xl font-semibold text-gray-900 mb-1'>
							{user.name}
						</h3>
						<p className='text-gray-600 text-sm'>{user.email}</p>
						<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mt-2'>
							<span className="sr-only">Account status: </span>
							Active Account
						</span>
					</div>

					<div className='grid grid-cols-2 gap-4 mb-6' role="group" aria-label="Account statistics">
						<div className='bg-gray-50/80 rounded-xl p-4 text-center border border-gray-100/50'>
							<div className='text-2xl font-bold text-indigo-600 mb-1' aria-hidden="true">
								{userStats?.totalUrls || 0}
							</div>
							<div className='text-sm text-gray-600'>URLs Created</div>
							<span className="sr-only">{userStats?.totalUrls || 0} URLs created</span>
						</div>
						<div className='bg-gray-50/80 rounded-xl p-4 text-center border border-gray-100/50'>
							<div className='text-2xl font-bold text-indigo-600 mb-1' aria-hidden="true">
								{userStats?.totalClicks || 0}
							</div>
							<div className='text-sm text-gray-600'>Total Clicks</div>
							<span className="sr-only">{userStats?.totalClicks || 0} total clicks</span>
						</div>
					</div>

					<div className='space-y-4'>
						<div>
							<label id="profile-name-label" className='text-sm font-medium text-gray-700 mb-1 block'>
								Full Name
							</label>
							<div 
								className='bg-gray-50/80 rounded-xl p-3 text-gray-900 border border-gray-100/50'
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
								className='bg-gray-50/80 rounded-xl p-3 text-gray-900 border border-gray-100/50'
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
								className='bg-gray-50/80 rounded-xl p-3 text-gray-900 border border-gray-100/50'
								aria-labelledby="profile-member-label"
							>
								<time dateTime={user.createdAt}>
									{user.createdAt
										? new Date(user.createdAt).toLocaleDateString("en-GB", {
												day: "2-digit",
												month: "2-digit",
												year: "numeric"
										  })
										: "Recently joined"}
								</time>
							</div>
						</div>
					</div>
				</div>

				<div className='p-6 border-t border-gray-100/60 bg-gray-50/30 rounded-b-2xl'>
					<button
						onClick={onClose}
						className='w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2'>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};

export default UserProfileModal;
