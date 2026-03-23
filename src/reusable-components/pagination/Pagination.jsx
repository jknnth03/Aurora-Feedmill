import NoDataFound from "../nodatafound/NoDataFound";
import "./PageContainer.scss";

const PageContainer = ({
  title,
  titleIcon,
  titleColor,
  subtitle,
  actions,
  children,
  isEmpty = false,
  pagination,
}) => {
  return (
    <div className="page-container">
      {(title || actions) && (
        <div className="page-container__header">
          <div className="page-container__header-left">
            {title && (
              <h1
                className="page-container__title"
                style={titleColor ? { color: titleColor } : {}}>
                {titleIcon && (
                  <span className="page-container__title-icon">
                    {titleIcon}
                  </span>
                )}
                {title}
              </h1>
            )}
            {subtitle && <p className="page-container__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="page-container__actions">{actions}</div>}
        </div>
      )}

      <div className="page-container__body">
        {isEmpty ? <NoDataFound /> : children}
      </div>

      {pagination && !isEmpty && (
        <div className="page-container__pagination">{pagination}</div>
      )}
    </div>
  );
};

export default PageContainer;
