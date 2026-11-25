import { useTranslation } from 'react-i18next';
import { DateTime } from 'luxon';

const Footer = () => {
  const [t] = useTranslation();

  return (
    <footer className="main-footer">
      <strong>
        <span>{t("Copyright ©")} {DateTime.now().toFormat('y')} </span>
        <a href="https://www.itdoseinfo.com" target="_blank" rel="noopener noreferrer">
          {t("itdoseinfo.com")}
        </a>
        {/* <a href="https://www.google.com/" target="_blank" rel="noopener noreferrer">
          xyz.com
        </a> */}
        <span>.</span>
      </strong>
      <div className="float-right d-none d-sm-inline-block">
        <b>{t('version')}  </b>
        <span>&nbsp; 11.0.0</span>
      </div>
    </footer>
  );
};

export default Footer;
