import AppCatalogShell from '../components/app/AppCatalogShell';
import AppNavbar from '../components/app/AppNavbar';

const EMPTY_MAIN_PROPS = {};

const CatalogPageShell = ({
  children,
  mainClassName = 'flex-1',
  mainProps = EMPTY_MAIN_PROPS
}) => {
  const { className: mainPropsClassName, ...restMainProps } = mainProps;

  return (
    <AppCatalogShell>
      <AppNavbar />
      <main
        id="main-content"
        className={[mainClassName, mainPropsClassName]
          .filter(Boolean)
          .join(' ')}
        {...restMainProps}
      >
        {children}
      </main>
    </AppCatalogShell>
  );
};

export default CatalogPageShell;
