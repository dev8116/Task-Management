import React, { useState } from 'react';
import './DataTable.css';

const DataTable = ({ title, columns, data, searchable = true, actions }) => {
  const [search, setSearch] = useState('');

  const filteredData = data.filter((row) =>
    columns.some((col) => {
      const val = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
      return String(val || '').toLowerCase().includes(search.toLowerCase());
    })
  );

  return (
    <div className="data-table-container">
      <div className="data-table-header">
        <h3>{title}</h3>
        {searchable && (
          <input
            className="data-table-search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
      </div>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx}>{col.header}</th>
              ))}
              {actions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                  No data found
                </td>
              </tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr key={row._id || idx}>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx}>
                      {col.render
                        ? col.render(row)
                        : typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : row[col.accessor]}
                    </td>
                  ))}
                  {actions && <td>{actions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;