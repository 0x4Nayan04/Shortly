import AppCatalogShell from '../components/app/AppCatalogShell';
import AppNavbar from '../components/app/AppNavbar';

const CatalogPageShell = ({
  children,
  mainClassName = 'flex-1',
  mainProps = {}
}) => {
  const { className: mainPropsClassName, ...restMainProps } = mainProps;

  return (
    <AppCatalogShell>
      <AppNavbar />
      <main
        id='main-content'
        className={[mainClassName, mainPropsClassName]
          .filter(Boolean)
          .join(' ')}
        role='main'
        {...restMainProps}>
        {children}
      </main>
    </AppCatalogShell>
  );
};

export default CatalogPageShell;
