import type { ReactNode } from "react";

type FilterSectionProps = {
    title: string;
    description?: string;
    children: ReactNode;
};

const FilterSection = ({ title, description, children }: FilterSectionProps) => {
    return (
        <section className="border-b border-slate-100 py-6 first:pt-0 last:border-b-0 last:pb-0">
            <div className="mb-4">
                <h3 className="text-xl font-semibold text-zinc-900">{title}</h3>
                {description ? <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p> : null}
            </div>

            {children}
        </section>
    );
};

export default FilterSection;
