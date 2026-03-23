import { useState } from "react";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import NoDataFound from "../nodatafound/NoDataFound";
import "./UniversalTable.scss";

const UniversalTable = ({
  columns = [],
  data,
  isLoading = false,
  skeletonRows = 6,
  actions,
  onSort,
  sortBy,
  sortOrder,
  onRowClick,
}) => {
  const safeData = Array.isArray(data) ? data : [];

  const [internalSortBy, setInternalSortBy] = useState(null);
  const [internalSortOrder, setInternalSortOrder] = useState("asc");

  const activeSortBy = onSort ? sortBy : internalSortBy;
  const activeSortOrder = onSort ? sortOrder : internalSortOrder;

  const handleSort = (col) => {
    if (!col.sortable) return;
    const isActive = activeSortBy === col.key;
    const newOrder = isActive && activeSortOrder === "asc" ? "desc" : "asc";

    if (onSort) {
      onSort(col.key, newOrder);
    } else {
      setInternalSortBy(col.key);
      setInternalSortOrder(newOrder);
    }
  };

  const sortedData = onSort
    ? safeData
    : [...safeData].sort((a, b) => {
        if (!internalSortBy) return 0;
        const aVal = a[internalSortBy];
        const bVal = b[internalSortBy];
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;
        const cmp =
          typeof aVal === "string"
            ? aVal.localeCompare(bVal)
            : aVal < bVal
              ? -1
              : aVal > bVal
                ? 1
                : 0;
        return internalSortOrder === "asc" ? cmp : -cmp;
      });

  const showActions = Boolean(actions);
  const isEmpty = !isLoading && sortedData.length === 0;

  const SortIcon = ({ col }) => {
    if (!col.sortable) return null;
    if (activeSortBy !== col.key)
      return <UnfoldMoreIcon className="ut__sort-icon ut__sort-icon--idle" />;
    return activeSortOrder === "asc" ? (
      <ArrowUpwardIcon className="ut__sort-icon ut__sort-icon--active" />
    ) : (
      <ArrowDownwardIcon className="ut__sort-icon ut__sort-icon--active" />
    );
  };

  return (
    <div className="ut">
      {isEmpty ? (
        <NoDataFound />
      ) : (
        <div className="ut__wrap">
          <table className="ut__table">
            <thead className="ut__thead">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`ut__th${col.sortable ? " ut__th--sortable" : ""}${activeSortBy === col.key ? " ut__th--sorted" : ""}`}
                    style={{ width: col.width || "auto" }}
                    onClick={() => handleSort(col)}>
                    <span className="ut__th-inner">
                      {col.label}
                      <SortIcon col={col} />
                    </span>
                  </th>
                ))}
                {showActions && (
                  <th className="ut__th ut__th--actions">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="ut__tbody">
              {isLoading
                ? Array.from({ length: skeletonRows }).map((_, ri) => (
                    <tr key={`skel-${ri}`} className="ut__tr ut__tr--skeleton">
                      {columns.map((col) => (
                        <td key={col.key} className="ut__td">
                          <span
                            className="ut__skeleton"
                            style={{ width: `${55 + Math.random() * 35}%` }}
                          />
                        </td>
                      ))}
                      {showActions && (
                        <td className="ut__td ut__td--actions">
                          <span className="ut__skeleton ut__skeleton--action" />
                        </td>
                      )}
                    </tr>
                  ))
                : sortedData.map((row, ri) => (
                    <tr
                      key={row.id ?? ri}
                      className={`ut__tr${onRowClick ? " ut__tr--clickable" : ""}`}
                      onClick={() => onRowClick && onRowClick(row)}>
                      {columns.map((col) => (
                        <td key={col.key} className="ut__td">
                          {col.render
                            ? col.render(row[col.key], row)
                            : (row[col.key] ?? "—")}
                        </td>
                      ))}
                      {showActions && (
                        <td
                          className="ut__td ut__td--actions"
                          onClick={(e) => e.stopPropagation()}>
                          <div className="ut__actions">{actions(row)}</div>
                        </td>
                      )}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UniversalTable;
