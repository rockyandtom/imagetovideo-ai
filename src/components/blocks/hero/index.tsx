import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HappyUsers from "./happy-users";
import HeroBg from "./bg";
import { Hero as HeroType } from "@/types/blocks/hero";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";

export default function Hero({ hero }: { hero: HeroType }) {
  if (hero.disabled) {
    return null;
  }

  const highlightText = hero.highlight_text;
  let texts = null;
  if (highlightText) {
    texts = hero.title?.split(highlightText, 2);
  }

  return (
    <>
      <HeroBg />
      <section className="bright-hero py-16 md:py-20 relative">
        <div className="container relative z-10">
          {hero.show_badge && (
            <div className="flex items-center justify-center mb-12 fade-in-up">
              <div className="glass-effect rounded-full p-4">
                <img
                  src="/imgs/badges/phdaily.svg"
                  alt="phdaily"
                  className="h-12 object-cover"
                />
              </div>
            </div>
          )}
          <div className="text-center space-y-6">
            {hero.announcement && (
              <div className="fade-in-up stagger-1">
                <Link
                  href={hero.announcement.url as any}
                  className="mx-auto inline-flex items-center gap-3 glass-effect rounded-full px-6 py-3 text-sm font-medium hover:bg-white/40 transition-all duration-300"
                >
                  {hero.announcement.label && (
                    <Badge className="bg-blue-500 text-white">{hero.announcement.label}</Badge>
                  )}
                  {hero.announcement.title}
                </Link>
              </div>
            )}

            <div className="fade-in-up stagger-2">
              {texts && texts.length > 1 ? (
                <h1 className="mx-auto max-w-5xl text-balance text-4xl font-bold lg:text-7xl text-shadow-soft leading-tight">
                  {texts[0]}
                  <span className="gradient-text">
                    {highlightText}
                  </span>
                  {texts[1]}
                </h1>
              ) : (
                <h1 className="mx-auto max-w-5xl text-balance text-4xl font-bold lg:text-7xl text-shadow-soft leading-tight">
                  {hero.title}
                </h1>
              )}
            </div>

            <div className="fade-in-up stagger-3">
              <p
                className="mx-auto max-w-3xl text-slate-600 text-base lg:text-xl leading-relaxed"
                dangerouslySetInnerHTML={{ __html: hero.description || "" }}
              />
            </div>
            {hero.buttons && (
              <div className="fade-in-up stagger-4">
                <div className="flex flex-col justify-center gap-6 sm:flex-row">
                  {hero.buttons.map((item, i) => {
                    return (
                      <Link
                        key={i}
                        href={item.url || "#"}
                        target={item.target || ""}
                        className="flex items-center"
                      >
                        <Button
                          className="btn-hover-effect px-8 py-4 text-lg font-semibold rounded-full min-w-[200px]"
                          size="lg"
                          variant={item.variant || "default"}
                        >
                          {item.icon && <Icon name={item.icon} className="mr-2" />}
                          {item.title}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            {hero.tip && (
              <div className="fade-in-up stagger-4">
                <p className="text-lg text-slate-500 font-medium">{hero.tip}</p>
              </div>
            )}
            {hero.show_happy_users && (
              <div className="fade-in-up stagger-4">
                <HappyUsers />
              </div>
            )}

            {/* 展示案例图片 */}
            {hero.image && (
              <div className="fade-in-up stagger-5 mt-12">
                <div className="mx-auto max-w-4xl">
                  <img
                    src={hero.image.src}
                    alt={hero.image.alt || hero.title}
                    className="w-full h-auto rounded-2xl shadow-2xl border border-white/20"
                    loading="eager"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
