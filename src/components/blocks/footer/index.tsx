import { Footer as FooterType } from "@/types/blocks/footer";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";

export default function Footer({ footer }: { footer: FooterType }) {
  if (footer.disabled) {
    return null;
  }

  // 获取品牌链接，如果没有则默认为首页
  const brandUrl = footer.brand?.url || "/";

  return (
    <section id={footer.name} className="py-16">
      <div className="container pl-2 lg:pl-4">
        <footer>
          {/* Logo 和品牌信息放在顶部，添加链接以传递权重回首页 */}
          {footer.brand && (
            <div className="mb-8 text-left">
              {footer.brand.logo && (
                <div className="mb-3">
                  <Link
                    href={brandUrl as any}
                    className="inline-block hover:opacity-80 transition-opacity"
                    title={footer.brand.title || "Home"}
                  >
                    <img 
                      src={footer.brand.logo.src} 
                      alt={footer.brand.logo.alt || footer.brand.title} 
                      className="h-8 w-auto"
                    />
                  </Link>
                </div>
              )}
              {footer.brand.title && (
                <Link
                  href={brandUrl as any}
                  className="font-bold text-lg mb-2 text-gray-900 hover:text-primary transition-colors block"
                >
                  {footer.brand.title}
                </Link>
              )}
              {footer.brand.description && (
                <p className="text-sm text-gray-600 max-w-md">
                  {footer.brand.description}
                </p>
              )}
            </div>
          )}
          
          {/* 导航链接在下方横向排列 */}
          <div className="flex justify-start gap-6 lg:gap-8 xl:gap-12">

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
