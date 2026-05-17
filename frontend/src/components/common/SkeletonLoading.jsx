import PropTypes from "prop-types";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

const toneClasses = {
  slate: "bg-slate-200/90",
  light: "bg-white/70",
  blue: "bg-blue-100/80",
  emerald: "bg-emerald-100/80",
  neo: "bg-white/55",
};

export const SkeletonBlock = ({
  className = "",
  rounded = "rounded-lg",
  tone = "slate",
}) => (
  <span
    aria-hidden="true"
    className={joinClasses(
      "block animate-pulse",
      toneClasses[tone] || toneClasses.slate,
      rounded,
      className
    )}
  />
);

SkeletonBlock.propTypes = {
  className: PropTypes.string,
  rounded: PropTypes.string,
  tone: PropTypes.oneOf(["slate", "light", "blue", "emerald", "neo"]),
};

export const InlineBusySkeleton = ({
  label = "Working...",
  tone = "light",
  className = "",
}) => (
  <span className={joinClasses("inline-flex items-center gap-2", className)}>
    <SkeletonBlock className="h-4 w-4 flex-shrink-0" rounded="rounded-full" tone={tone} />
    <span>{label}</span>
  </span>
);

InlineBusySkeleton.propTypes = {
  label: PropTypes.node,
  tone: PropTypes.oneOf(["slate", "light", "blue", "emerald", "neo"]),
  className: PropTypes.string,
};

export const TableSkeleton = ({
  rows = 5,
  columns = 4,
  className = "",
  showHeader = true,
}) => (
  <div className={joinClasses("overflow-hidden rounded-xl border border-slate-200 bg-white", className)}>
    {showHeader && (
      <div className="grid gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <SkeletonBlock key={`table-head-${index}`} className="h-3 w-20 max-w-full" />
        ))}
      </div>
    )}
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`table-row-${rowIndex}`}
          className="grid gap-4 px-4 py-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <SkeletonBlock
              key={`table-cell-${rowIndex}-${columnIndex}`}
              className={joinClasses("h-4", columnIndex === 0 ? "w-28" : "w-full")}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

TableSkeleton.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
  className: PropTypes.string,
  showHeader: PropTypes.bool,
};

export const ForecastSkeleton = ({ className = "", showSearch = true }) => (
  <div className={joinClasses("space-y-6", className)}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <SkeletonBlock className="h-5 w-44" />
        <SkeletonBlock className="h-4 w-32" />
      </div>
      {showSearch && (
        <div className="flex w-full gap-2 sm:w-[360px]">
          <SkeletonBlock className="h-10 flex-1" rounded="rounded-lg" />
          <SkeletonBlock className="h-10 w-24" rounded="rounded-lg" tone="blue" />
        </div>
      )}
    </div>

    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-300 to-blue-500 shadow-lg">
      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <SkeletonBlock className="h-8 w-32" tone="light" />
            <SkeletonBlock className="h-5 w-40" tone="light" />
          </div>
          <SkeletonBlock className="h-9 w-28" rounded="rounded-lg" tone="light" />
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <SkeletonBlock className="h-20 w-20" rounded="rounded-full" tone="light" />
            <div className="space-y-3">
              <SkeletonBlock className="h-12 w-28" tone="light" />
              <SkeletonBlock className="h-5 w-36" tone="light" />
              <SkeletonBlock className="h-4 w-52" tone="light" />
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 md:w-72">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={`forecast-stat-${index}`} className="h-5 w-full" tone="light" />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <SkeletonBlock className="h-6 w-40" tone="light" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`forecast-hour-${index}`} className="min-w-[70px] rounded-lg bg-white/10 p-3">
                <SkeletonBlock className="mx-auto mb-3 h-4 w-10" tone="light" />
                <SkeletonBlock className="mx-auto mb-3 h-8 w-8" rounded="rounded-full" tone="light" />
                <SkeletonBlock className="mx-auto h-4 w-9" tone="light" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/30 p-4">
        <SkeletonBlock className="mb-3 h-5 w-36" tone="light" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={`forecast-day-${index}`} className="rounded-lg bg-white/10 p-3">
              <SkeletonBlock className="mx-auto mb-3 h-4 w-12" tone="light" />
              <SkeletonBlock className="mx-auto mb-3 h-8 w-8" rounded="rounded-full" tone="light" />
              <SkeletonBlock className="mx-auto h-4 w-10" tone="light" />
            </div>
          ))}
        </div>
      </div>
    </div>

    <TableSkeleton rows={4} columns={6} />
  </div>
);

ForecastSkeleton.propTypes = {
  className: PropTypes.string,
  showSearch: PropTypes.bool,
};

export const PageSkeleton = ({ className = "" }) => (
  <div className={joinClasses("container mx-auto min-h-[50vh] px-4 pb-10 pt-28 sm:px-6 md:pt-32 lg:px-8", className)}>
    <div className="space-y-6">
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="h-9 w-64 max-w-full" />
        <SkeletonBlock className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`page-card-${index}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SkeletonBlock className="mb-4 h-32 w-full" rounded="rounded-lg" />
            <SkeletonBlock className="mb-2 h-5 w-3/4" />
            <SkeletonBlock className="h-4 w-full" />
          </div>
        ))}
      </div>
      <TableSkeleton rows={3} columns={4} />
    </div>
  </div>
);

PageSkeleton.propTypes = {
  className: PropTypes.string,
};
