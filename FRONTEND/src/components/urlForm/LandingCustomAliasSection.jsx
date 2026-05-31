import {
  ChevronDown,
  ChevronUp,
  Lock,
  Settings2
} from 'lucide-react';
import CustomAliasInput from './CustomAliasInput';

const LandingCustomAliasSection = ({
  user,
  onShowAuth,
  useCustomAlias,
  onToggleCustomAlias,
  customAlias,
  onCustomAliasChange,
  onCustomAliasBlur,
  touched,
  fieldErrors
}) => {
  if (!user) {
    return (
      <div className='catalog-row flex w-full items-center justify-between gap-2 px-4'>
        <button
          type='button'
          onClick={onShowAuth}
          className='flex min-h-[var(--btn-h)] flex-1 items-center gap-1.5 border-0 bg-transparent text-sm font-medium text-muted-strong transition-colors hover:text-ink focus-ring active:scale-[0.99] duration-100'>
          <Settings2 size={15} /> Customize link{' '}
          <ChevronDown
            size={14}
            className='opacity-50'
          />
        </button>
        <span
          className='flex shrink-0 items-center gap-1 rounded bg-background-alt px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-strong cursor-default'
          title='Members only'>
          <Lock
            size={10}
            strokeWidth={2.5}
          />{' '}
          Members
        </span>
      </div>
    );
  }

  return (
    <div className='flex flex-col'>
      <button
        type='button'
        onClick={onToggleCustomAlias}
        className='catalog-row flex w-full items-center gap-1.5 border-0 border-t border-border bg-transparent px-4 text-sm font-medium text-muted-strong transition-colors hover:bg-[color-mix(in_srgb,var(--color-background-alt)_35%,white)] hover:text-ink focus-ring active:scale-[0.99] duration-100'
        aria-expanded={useCustomAlias}>
        <Settings2
          size={15}
          className={useCustomAlias ? 'text-primary' : 'text-muted'}
        />
        <span className={useCustomAlias ? 'text-ink' : 'text-muted-strong'}>
          Customize link
        </span>
        {useCustomAlias ? (
          <ChevronUp
            size={14}
            className='ml-auto opacity-60 text-muted-strong'
          />
        ) : (
          <ChevronDown
            size={14}
            className='ml-auto opacity-50'
          />
        )}
      </button>

      {useCustomAlias && (
        <div className='hero-alias-panel animate-in fade-in slide-in-from-top-1 duration-200'>
          <CustomAliasInput
            customAlias={customAlias}
            onChange={onCustomAliasChange}
            onBlur={onCustomAliasBlur}
            touched={touched}
            fieldErrors={fieldErrors}
          />
        </div>
      )}
    </div>
  );
};

export default LandingCustomAliasSection;
