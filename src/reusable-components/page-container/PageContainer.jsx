import "./PageContainer.scss";

const PageContainer = ({
  title,
  titleIcon,
  titleColor,
  subtitle,
  titleAction,
  actions,
  children,
  pagination,
}) => {
  return (
    <div className="page-container">
      {(title || actions) && (
        <div
          className={`page-container__header${!title && actions ? " page-container__header--centered" : ""}`}>
          {title && (
            <div className="page-container__header-left">
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
              {subtitle && (
                <p className="page-container__subtitle">{subtitle}</p>
              )}
              {titleAction && titleAction}
            </div>
          )}
          {actions && <div className="page-container__actions">{actions}</div>}
        </div>
      )}

      <div className="page-container__body">{children}</div>

      {pagination && (
        <div className="page-container__pagination">{pagination}</div>
      )}
    </div>
  );
};

export default PageContainer;
