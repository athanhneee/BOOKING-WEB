type FilterChipGroupProps<T extends string> = {
    options: T[];
    selectedValues: T[];
    onToggle: (value: T) => void;
    columnsClassName?: string;
};

const FilterChipGroup = <T extends string>({
    options,
    selectedValues,
    onToggle,
    columnsClassName = "grid-cols-2 lg:grid-cols-3",
}: FilterChipGroupProps<T>) => {
    return (
        <div className={`grid gap-3 ${columnsClassName}`}>
            {options.map((option) => {
                const isSelected = selectedValues.includes(option);

                return (
                    <button
                        key={option}
                        type="button"
                        onClick={() => onToggle(option)}
                        className={`rounded-full border px-4 py-3 text-left text-sm font-medium transition ${isSelected
                            ? "border-cyan-500 bg-cyan-50 text-cyan-700 shadow-[0_14px_30px_-22px_rgba(8,145,178,0.7)]"
                            : "border-slate-200 bg-white text-zinc-700 hover:border-cyan-200 hover:bg-cyan-50/50"
                            }`}
                    >
                        {option}
                    </button>
                );
            })}
        </div>
    );
};

export default FilterChipGroup;