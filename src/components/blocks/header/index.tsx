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
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
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
import React from "react";
import Image from "next/image";

export default function Header({ header = {} }: { header?: HeaderType }) {
  if (header.disabled) {
    return null;
  }

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
                          <NavigationMenuTrigger
                            className={cn(
                              "inline-flex h-10 items-center gap-2 rounded-md border border-transparent bg-background px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-blue-600 focus-visible:outline-hidden"
                            )}
                          >
                            {item.icon && (
                              <Icon name={item.icon} className="size-4 shrink-0" />
                            )}
                            <span>{item.title}</span>
                          </NavigationMenuTrigger>
                          <NavigationMenuContent className="min-w-[320px] rounded-xl border border-slate-100 bg-white/90 p-4 shadow-lg backdrop-blur">
                            <div className="flex flex-col gap-3">
                              <NavigationMenuLink asChild>
                                <Link
                                  href={item.url as any}
                                  target={item.target}
                                  className="flex flex-col rounded-lg border border-slate-200/70 bg-slate-50/80 p-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/80"
                                >
                                  <span className="text-sm font-semibold text-slate-700">
                                    Explore {item.title}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    View the complete {item.title?.toLowerCase()} experience
                                  </span>
                                </Link>
                              </NavigationMenuLink>
                              {item.children.map((child, ii) => (
                                <NavigationMenuLink asChild key={ii}>
                                  <Link
                                    className="flex flex-col gap-1 rounded-lg border border-transparent p-3 transition-colors hover:border-blue-100 hover:bg-blue-50/70"
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
                                </NavigationMenuLink>
                              ))}
                            </div>
                          </NavigationMenuContent>
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
