import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";

export default function Feature1({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-12 md:py-16 bg-gradient-to-br from-slate-50/30 to-white/80">
      <div className="container px-8">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col justify-center lg:text-left lg:pr-10 order-2 lg:order-1">
            {section.title && (
              <h2 className="mb-6 text-pretty text-3xl font-bold lg:text-4xl">
                {section.title}
              </h2>
            )}
            {section.description && (
              <p className="mb-8 max-w-xl text-slate-600 lg:max-w-none lg:text-lg">
                {section.description}
              </p>
            )}
            <ul className="flex flex-col justify-center gap-y-8">
              {section.items?.map((item, i) => (
                <li key={i} className="flex">
                  {item.icon && (
                    <Icon
                      name={item.icon}
                      className="mr-2 size-6 shrink-0 lg:mr-2 lg:size-6 text-blue-500"
                    />
                  )}
                  <div>
                    <div className="mb-3 h-5 text-sm font-semibold text-slate-700 md:text-base">
                      {item.title}
                    </div>
                    <div className="text-sm font-medium text-slate-600 md:text-base">
                      {item.description}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {section.image && (
            <div className="order-1 lg:order-2 flex items-center">
              <div className="bg-white/60 rounded-3xl shadow-lg overflow-hidden">
              {section.image.src?.endsWith('.mp4') || section.image.src?.endsWith('.mov') || section.image.src?.endsWith('.webm') ? (
                <video
                  src={section.image.src}
                  className="w-full h-auto max-h-[500px] object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={section.image.src}
                  alt="placeholder hero"
                  className="w-full h-auto max-h-[500px] object-cover"
                />
              )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
