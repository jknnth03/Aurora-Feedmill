import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "./TablePagination.scss";

const ROWS_OPTIONS = [5, 10, 25, 50, 100];

const TablePagination = ({
  total = 0,
  page = 1,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const from = total === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const to = Math.min(page * rowsPerPage, total);

  return (
    <div className="tp">
      <div className="tp__rows">
        <span className="tp__label">Rows per page:</span>
        <select
          className="tp__select"
          value={rowsPerPage}
          onChange={(e) => {
            onRowsPerPageChange?.(Number(e.target.value));
          }}>
          {ROWS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <span className="tp__info">
        {from}–{to} of {total}
      </span>

      <div className="tp__controls">
        <button
          className="tp__btn"
          onClick={() => onPageChange?.(page - 1)}
          disabled={page <= 1}>
          <ChevronLeftIcon fontSize="small" />
        </button>
        <button
          className="tp__btn"
          onClick={() => onPageChange?.(page + 1)}
          disabled={page >= totalPages}>
          <ChevronRightIcon fontSize="small" />
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
