import { Footer as FooterType } from "@/types/blocks/footer";
import Icon from "@/components/icon";

export default function Footer({ footer }: { footer: FooterType }) {
  if (footer.disabled) {
    return null;
  }

  return (
    <section id={footer.name} className="py-16">
      <div className="max-w-7xl mx-auto px-8">
        <footer>
          <div className="flex flex-col items-center justify-between gap-10 text-center lg:flex-row lg:text-left">
            <div className="flex w-full max-w-96 shrink flex-col items-center justify-between gap-6 lg:items-start">
              {footer.brand && (
                <div>
                  <div className="flex items-center justify-center gap-2 lg:justify-start">
                    {footer.brand.logo && (
                      <img
                        src={footer.brand.logo.src}
                        alt={footer.brand.logo.alt || footer.brand.title}
                        className="h-11"
                      />
                    )}
                    {footer.brand.title && (
                      <p className="text-3xl font-semibold">
                        {footer.brand.title}
                      </p>
                    )}
                  </div>
                  {footer.brand.description && (
                    <p className="mt-6 text-md text-muted-foreground">
                      {footer.brand.description}
                    </p>
                  )}
                </div>
              )}
              {footer.social && (
                <ul className="flex items-center space-x-6 text-muted-foreground">
                  {footer.social.items?.map((item, i) => (
                    <li key={i} className="font-medium hover:text-primary">
                      <a href={item.url} target={item.target}>
                        {item.icon && (
                          <Icon name={item.icon} className="size-4" />
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-wrap gap-6 lg:gap-12 justify-center lg:justify-start">
              {footer.nav?.items?.map((item, i) => (
                <div key={i} className="text-center lg:text-left">
                  {/* 主标题 */}
                  {item.title === "Support" || !item.url ? (
                    <p className="font-bold text-lg mb-4">{item.title}</p>
                  ) : (
                    <a 
                      href={item.url} 
                      target={item.target || "_self"}
                      className="font-bold text-lg hover:text-primary transition-colors duration-200 block mb-4"
                    >
                      {item.title}
                    </a>
                  )}
                  
                  {/* 子菜单垂直排列在对应主标题下方 */}
                  {item.children && item.children.length > 0 && (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {item.children.map((iitem, ii) => (
                        <li key={ii} className="font-medium hover:text-primary">
                          <a href={iitem.url} target={iitem.target}>
                            {iitem.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 flex flex-col justify-between gap-4 border-t pt-8 text-center text-sm font-medium text-muted-foreground lg:flex-row lg:items-center lg:text-left">
            {footer.copyright && (
              <p>
                {footer.copyright}
                {process.env.NEXT_PUBLIC_SHOW_POWERED_BY === "false" ? null : (
                  <a
                    href="https://shipany.ai"
                    target="_blank"
                    className="px-2 text-primary"
                  >
                    build with ShipAny
                  </a>
                )}
              </p>
            )}

            {footer.agreement && (
              <ul className="flex justify-center gap-4 lg:justify-start">
                {footer.agreement.items?.map((item, i) => (
                  <li key={i} className="hover:text-primary">
                    <a href={item.url} target={item.target}>
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </footer>
      </div>
    </section>
  );
}
