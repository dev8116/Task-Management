import { HiOutlineSearch } from 'react-icons/hi';

export default function SearchFilter({ search, onSearchChange, filters = [], onFilterChange, placeholder = 'Search...' }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="input-field pl-10"
        />
      </div>
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={filter.value}
          onChange={(e) => onFilterChange(filter.key, e.target.value)}
          className="input-field w-full sm:w-44"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ))}
    </div>
  );
}