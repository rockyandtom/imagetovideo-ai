import { Footer as FooterType } from "@/types/blocks/footer";
import Icon from "@/components/icon";

export default function Footer({ footer }: { footer: FooterType }) {
  if (footer.disabled) {
    return null;
  }

  return (
    <section id={footer.name} className="py-16">
      <div className="container pl-2 lg:pl-4">
        <footer>
          {/* 所有主标题强制在同一排横向排列，不换行 */}
          <div className="flex justify-start gap-4 lg:gap-6 xl:gap-8">
            {/* 品牌标题作为第一个主标题 */}
            {footer.brand && footer.brand.title && (
              <div className="text-left flex-shrink-0 min-w-fit max-w-xs">
                <p className="font-bold text-lg mb-3 text-gray-900 whitespace-nowrap">
                  {footer.brand.title}
                </p>
                {footer.brand.description && (
                  <p className="text-sm text-gray-600 max-w-xs">
                    {footer.brand.description}
                  </p>
                )}
              </div>
            )}

            {/* 所有导航链接主标题 */}
            {footer.nav?.items?.map((item, i) => (
              <div key={i} className="text-left flex-shrink-0 min-w-fit">
                {/* 主标题 */}
                {item.title === "Support" || !item.url ? (
                  <p className="font-bold text-lg mb-3 text-gray-900 whitespace-nowrap">{item.title}</p>
                ) : (
                  <a 
                    href={item.url} 
                    target={item.target || "_self"}
                    className="font-bold text-lg hover:text-primary transition-colors duration-200 block mb-3 text-gray-900 whitespace-nowrap"
                  >
                    {item.title}
                  </a>
                )}
                
                {/* 子菜单垂直排列在对应主标题下方 */}
                {item.children && item.children.length > 0 && (
                  <ul className="space-y-2 text-sm text-gray-600">
                    {item.children.map((iitem, ii) => (
                      <li key={ii} className="font-medium hover:text-primary transition-colors duration-200 whitespace-nowrap">
                        {iitem.url && iitem.url.trim() !== "" ? (
                          <a href={iitem.url} target={iitem.target}>
                            {iitem.title}
                          </a>
                        ) : (
                          <span>{iitem.title}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col justify-between gap-4 pt-8 text-center text-sm font-medium text-muted-foreground lg:flex-row lg:items-center lg:text-left">
            {footer.copyright && (
              <p>
                {footer.copyright}
              </p>
            )}

            {footer.agreement && footer.agreement.items && footer.agreement.items.length > 0 && (
              <ul className="flex justify-center gap-4 lg:justify-start">
                {footer.agreement.items.map((item, i) => (
                  <li key={i} className="hover:text-primary">
                    {item.url && item.url.trim() !== "" ? (
                      <a href={item.url} target={item.target}>
                        {item.title}
                      </a>
                    ) : (
                      <span>{item.title}</span>
                    )}
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
