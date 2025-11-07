"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Header as HeaderType } from "@/types/blocks/header";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";
import LocaleToggle from "@/components/locale/toggle";
import { Menu } from "lucide-react";
import SignToggle from "@/components/sign/toggle";
import ThemeToggle from "@/components/theme/toggle";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import Image from "next/image";

export default function Header({ header = {} }: { header?: HeaderType }) {
  if (header.disabled) {
    return null;
  }

  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);

  return (
    <section className="py-3 bg-white/90 backdrop-blur-sm border-b border-slate-100/60">
      <div className="container pl-2 lg:pl-4">
        <nav className="hidden lg:flex items-center w-full">
          <div className="flex items-center gap-2 mr-8">
            <Link
              href={(header.brand?.url as any) || "/"}
              className="flex items-center gap-2"
            >
              {header.brand?.logo?.src && (
                <Image
                  src={header.brand.logo.src as string}
                  alt=""
                  width={32}
                  height={32}
                  className="w-8 h-8"
                  priority
                />
              )}
              {header.brand?.title && (
                <span className="text-2xl gradient-text font-bold whitespace-nowrap">
                  {header.brand?.title || ""}
                </span>
              )}
            </Link>
          </div>
          <div className="flex items-center flex-1 justify-start">
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {header.nav?.items?.map((item, i) => {
                    if (item.children && item.children.length > 0) {
                      return (
                        <NavigationMenuItem key={i}>
                          <div className="relative inline-flex items-center group">
                            <Link
                              href={item.url as any}
                              target={item.target}
                              className="text-slate-700 hover:text-blue-600 inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-hidden"
                              onMouseEnter={() => setOpenDropdownIndex(i)}
                            >
                              {item.icon && (
                                <Icon name={item.icon} className="size-4 shrink-0 mr-2" />
                              )}
                              <span>{item.title}</span>
                            </Link>
                            <div
                              className={cn(
                                "absolute left-0 top-full z-40 mt-2 min-w-[220px] rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur transition-opacity duration-150",
                                openDropdownIndex === i
                                  ? "pointer-events-auto opacity-100"
                                  : "pointer-events-none opacity-0"
                              )}
                              onMouseEnter={() => setOpenDropdownIndex(i)}
                              onMouseLeave={() => setOpenDropdownIndex(null)}
                            >
                              <Link
                                href={item.url as any}
                                target={item.target}
                                className="flex flex-col rounded-lg border border-slate-200/70 bg-slate-50/70 p-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50/70"
                              >
                                Explore {item.title}
                              </Link>
                              <div className="mt-2 flex flex-col gap-2">
                                {item.children.map((child, ii) => (
                                  <Link
                                    key={ii}
                                    className="flex flex-col gap-1 rounded-lg border border-transparent p-3 text-left transition-colors hover:border-blue-100 hover:bg-blue-50/70"
                                    href={child.url as any}
                                    target={child.target}
                                  >
                                    <span className="text-sm font-semibold text-slate-700">
                                      {child.title}
                                    </span>
                                    {child.description && (
                                      <span className="text-xs leading-snug text-slate-500">
                                        {child.description}
                                      </span>
                                    )}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        </NavigationMenuItem>
                      );
                    }

                    return (
                      <NavigationMenuItem key={i}>
                        <NavigationMenuLink asChild>
                          <Link
                            className={cn(
                              "text-slate-700 hover:text-blue-600 font-medium",
                              navigationMenuTriggerStyle,
                              buttonVariants({
                                variant: "ghost",
                              })
                            )}
                            href={item.url as any}
                            target={item.target}
                          >
                            {item.icon && (
                              <Icon
                                name={item.icon}
                                className="size-4 shrink-0 mr-2"
                              />
                            )}
                            {item.title}
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    );
                  })}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="flex gap-2 items-center ml-auto">
            {header.show_locale && <LocaleToggle />}
            {header.buttons?.map((item, i) => {
              return (
                <Button key={i} variant={item.variant}>
                  <Link
                    href={item.url as any}
                    target={item.target || ""}
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    {item.title}
                    {item.icon && (
                      <Icon name={item.icon} className="size-4 shrink-0" />
                    )}
                  </Link>
                </Button>
              );
            })}
            {header.show_sign && <SignToggle />}
          </div>
        </nav>

        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            <Link
              href={(header.brand?.url || "/") as any}
              className="flex items-center gap-2"
            >
              {header.brand?.logo?.src && (
                <Image
                  src={header.brand.logo.src as string}
                  alt=""
                  width={32}
                  height={32}
                  className="w-8 h-8"
                  priority
                />
              )}
              {header.brand?.title && (
                <span className="text-xl gradient-text font-bold whitespace-nowrap">
                  {header.brand?.title || ""}
                </span>
              )}
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="default" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <Link
                      href={(header.brand?.url || "/") as any}
                      className="flex items-center gap-2"
                    >
                      {header.brand?.logo?.src && (
                        <Image
                          src={header.brand.logo.src as string}
                          alt=""
                          width={32}
                          height={32}
                          className="w-8 h-8"
                          priority
                        />
                      )}
                      {header.brand?.title && (
                        <span className="text-xl gradient-text font-bold whitespace-nowrap">
                          {header.brand?.title || ""}
                        </span>
                      )}
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="mb-8 mt-8 flex flex-col gap-4">
                  <Accordion type="single" collapsible className="w-full">
                    {header.nav?.items?.map((item, i) => {
                      if (item.children && item.children.length > 0) {
                        return (
                          <AccordionItem
                            key={i}
                            value={item.title || ""}
                            className="border-b-0"
                          >
                            <AccordionTrigger className="mb-4 py-0 font-semibold hover:no-underline text-left text-slate-700">
                              {item.title}
                            </AccordionTrigger>
                            <AccordionContent className="mt-2">
                              {item.children.map((iitem, ii) => (
                                <Link
                                  key={ii}
                                  className={cn(
                                    "flex select-none gap-4 rounded-md p-3 leading-none outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                  )}
                                  href={iitem.url as any}
                                  target={iitem.target}
                                >
                                  {iitem.icon && (
                                    <Icon
                                      name={iitem.icon}
                                      className="size-4 shrink-0"
                                    />
                                  )}
                                  <div>
                                    <div className="text-sm font-semibold text-slate-700">
                                      {iitem.title}
                                    </div>
                                    <p className="text-sm leading-snug text-slate-500">
                                      {iitem.description}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      }
                      return (
                        <Link
                          key={i}
                          href={item.url as any}
                          target={item.target}
                          className="font-semibold my-4 flex items-center gap-2 px-4 text-slate-700 hover:text-blue-600"
                        >
                          {item.icon && (
                            <Icon
                              name={item.icon}
                              className="size-4 shrink-0 mr-2"
                            />
                          )}
                          {item.title}
                        </Link>
                      );
                    })}
                  </Accordion>
                </div>
                <div className="flex-1"></div>
                <div className="border-t pt-4">
                  <div className="mt-2 flex flex-col gap-3">
                    {header.buttons?.map((item, i) => {
                      return (
                        <Button key={i} variant={item.variant}>
                          <Link
                            href={item.url as any}
                            target={item.target || ""}
                            className="flex items-center gap-1"
                          >
                            {item.title}
                            {item.icon && (
                              <Icon
                                name={item.icon}
                                className="size-4 shrink-0"
                              />
                            )}
                          </Link>
                        </Button>
                      );
                    })}

                    {header.show_sign && <SignToggle />}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {header.show_locale && <LocaleToggle />}
                    <div className="flex-1"></div>

                    {header.show_theme && <ThemeToggle />}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
}
