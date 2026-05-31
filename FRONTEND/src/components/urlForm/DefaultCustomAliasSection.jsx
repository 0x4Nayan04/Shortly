import { formCompoundClass } from '../../utils/designFormClasses';
import CustomAliasInput from './CustomAliasInput';

const DefaultCustomAliasSection = ({
  user,
  useCustomAlias,
  onUseCustomAliasChange,
  customAlias,
  onCustomAliasChange,
  onCustomAliasBlur,
  touched,
  fieldErrors
}) => {
  const aliasHasError = touched.customAlias && fieldErrors.customAlias;

  return (
    <>
      <div className='flex items-center gap-3'>
        <label
          htmlFor='custom-alias-checkbox'
          className={`flex items-center gap-3 ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            id='custom-alias-checkbox'
            type='checkbox'
            checked={useCustomAlias}
            disabled={!user}
            onChange={onUseCustomAliasChange}
            className='h-4 w-4 shrink-0 min-w-0 min-h-0 accent-[var(--color-primary)] cursor-pointer disabled:opacity-50'
            aria-describedby='custom-alias-description'
          />
          <span
            className={`text-sm font-medium ${!user ? 'text-muted' : 'text-muted-strong'}`}
            id='custom-alias-description'>
            Use custom alias
            {!user && (
              <span className='ml-1 text-primary'>(requires login)</span>
            )}
          </span>
        </label>
      </div>

      {useCustomAlias && (
        <div className={formCompoundClass(aliasHasError)}>
          <CustomAliasInput
            customAlias={customAlias}
            onChange={onCustomAliasChange}
            onBlur={onCustomAliasBlur}
            touched={touched}
            fieldErrors={fieldErrors}
            placeholder='your-custom-alias'
          />
        </div>
      )}
    </>
  );
};

export default DefaultCustomAliasSection;
