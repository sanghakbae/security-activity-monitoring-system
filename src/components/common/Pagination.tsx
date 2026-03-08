type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium ${
            page === value ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'
          }`}
        >
          {value}
        </button>
      ))}
    </div>
  );
}
