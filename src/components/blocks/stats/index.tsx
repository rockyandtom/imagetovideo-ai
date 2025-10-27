import { Heart, Zap } from "lucide-react";

import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";

export default function Stats({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-16">
      <div className="container flex flex-col items-center gap-4">
        {section.label && (
          <div className="flex items-center gap-1 text-sm font-semibold text-blue-500">
            {section.icon && (
              <Icon name={section.icon} className="h-6 w-auto text-blue-500" />
            )}
            {section.label}
          </div>
        )}
        <h2 className="text-center text-3xl font-semibold lg:text-4xl">
          {section.title}
        </h2>
        <p className="text-center text-slate-600 lg:text-lg">
          {section.description}
        </p>

        {/* 展示案例图片 */}
        {section.image && (
          <div className="mt-8 mb-8">
            <div className="mx-auto max-w-4xl">
              <img
                src={section.image.src}
                alt={section.image.alt || section.title}
                className="w-full h-auto rounded-xl shadow-lg"
                loading="lazy"
              />
            </div>
          </div>
        )}

        <div className="w-full grid gap-10 md:grid-cols-3 lg:gap-0 mt-8">
          {section.items?.map((item, index) => {
            return (
              <div key={index} className="text-center">
                <p className="text-lg font-semibold text-slate-600">
                  {item.title}
                </p>
                <p className="pt-2 text-7xl font-semibold lg:pt-4 text-blue-500">
                  {item.label}
                </p>
                <p className="text-xl mt-2 font-normal text-slate-500">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
