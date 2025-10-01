import PropTypes from 'prop-types';
import usePageTitle from '../hooks/usePageTitle';

const PageTitle = ({ title, includeAppName = true }) => {
  usePageTitle(title, includeAppName);
  return null;
};

PageTitle.propTypes = {
  title: PropTypes.string.isRequired,
  includeAppName: PropTypes.bool,
};

export default PageTitle;