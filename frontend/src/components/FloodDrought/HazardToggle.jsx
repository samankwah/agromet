import PropTypes from "prop-types";
import { Droplets, Sun } from "lucide-react";

import T from "../common/T";
import useT from "../../hooks/useT";

const OPTIONS = [
  { value: "flood", label: "Flood", icon: Droplets },
  { value: "drought", label: "Drought", icon: Sun },
];

/**
 * Switches which hazard the whole page encodes.
 *
 * This replaces the old four-tab bar, and it is deliberately not a tab bar: it
 * changes the encoding channel of one page rather than swapping between four
 * different pages of content. The map, the region list and the detail panel all
 * follow it, so a reader never has to reconcile two views.
 *
 * Implemented as a radiogroup with arrow-key movement, which is the correct
 * pattern for a small set of mutually exclusive options.
 */
export default function HazardToggle({ value, onChange, counts }) {
  const { t } = useT();

  const handleKeyDown = (event) => {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!delta) return;
    event.preventDefault();
    const index = OPTIONS.findIndex((option) => option.value === value);
    onChange(OPTIONS[(index + delta + OPTIONS.length) % OPTIONS.length].value);
  };

  return (
    <div
      role="radiogroup"
      aria-label={t("Hazard shown")}
      onKeyDown={handleKeyDown}
      className="inline-flex rounded-full border border-neo-border/50 bg-neo-bg-soft p-1"
    >
      {OPTIONS.map(({ value: option, label, icon: Icon }) => {
        const active = option === value;
        const count = counts?.[option];

        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neo-focus ${
              active
                ? "bg-neo-surface text-neo-text shadow-sm"
                : "text-neo-muted hover:text-neo-text"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <T>{label}</T>
            {count > 0 && (
              // A count of regions needing attention, so the inactive half of
              // the toggle can still say "there is something over here".
              <span
                className={`rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
                  active ? "bg-neo-bg-soft text-neo-text" : "bg-neo-border/30 text-neo-muted"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

HazardToggle.propTypes = {
  value: PropTypes.oneOf(["flood", "drought"]).isRequired,
  onChange: PropTypes.func.isRequired,
  counts: PropTypes.shape({
    flood: PropTypes.number,
    drought: PropTypes.number,
  }),
};
