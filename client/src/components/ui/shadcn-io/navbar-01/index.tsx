"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import Logo from "@/assets/logo.webp";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";

// Hamburger icon component
const HamburgerIcon = ({
  className,
  ...props
}: React.SVGAttributes<SVGElement>) => (
  <svg
    className={cn("pointer-events-none", className)}
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M4 12L20 12"
      className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
    />
    <path
      d="M4 12H20"
      className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
    />
    <path
      d="M4 12H20"
      className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
    />
  </svg>
);

// Types
export interface Navbar01NavLink {
  href: string;
  label: string;
  active?: boolean;
}

export interface Navbar01Props extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  logoHref?: string;
  navigationLinks?: Navbar01NavLink[];
  logOutText?: string;
  logOutHref?: string;
  onLogOutClick?: () => void;
  isAdmin: boolean;
}

// Default navigation links
const defaultNavigationLinks: Navbar01NavLink[] = [
  { href: "home", label: "Home" },
  { href: "products", label: "Products" },
  { href: "records", label: "Records" },
  { href: "admin", label: "Admin" },
  { href: "templates", label: "Templates" },
  { href: "approvals", label: "Approvals" },
  { href: "profile", label: "Profile" },
  { href: "logs", label: "Logs" },
];

export const Navbar01 = React.forwardRef<HTMLElement, Navbar01Props>(
  (
    {
      className,
      logo = <img src={Logo} className="h-8 w-auto object-contain"></img>,
      logoHref = "#",
      navigationLinks = defaultNavigationLinks,
      logOutText = "Logout",
      logOutHref = "#logout",
      onLogOutClick,
      isAdmin,
      ...props
    },
    ref
  ) => {
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLElement>(null);
    const { logout, isAuthenticated } = useAuth0();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth0();
    const userEmail = user?.email || "";
    useEffect(() => {
      const checkWidth = () => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth;
          setIsMobile(width < 768); // 768px is md breakpoint
        }
      };

      checkWidth();

      const resizeObserver = new ResizeObserver(checkWidth);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    // Combine refs
    const combinedRef = React.useCallback(
      (node: HTMLElement | null) => {
        containerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    // Helper function to check if a link is active
    const isLinkActive = (href: string) => {
      if (href === "home") {
        return location.pathname === "/home" || location.pathname === "/";
      }
      return location.pathname === `/${href}`;
    };

    return (
      <header
        ref={combinedRef}
        className={cn(
          "sticky top-0 z-50 w-full border-b bg-gray-100 px-4 md:px-6 [&_*]:no-underline",
          className
        )}
        {...props}
      >
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4">
          {/* Left side */}
          <div className="flex items-center gap-2">
            {/* Mobile menu trigger */}
            {isMobile && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="group h-9 w-9 hover:bg-accent hover:text-accent-foreground"
                    variant="ghost"
                    size="icon"
                  >
                    <HamburgerIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-48 p-2">
                  <NavigationMenu className="max-w-none">
                    <NavigationMenuList className="flex-col items-start gap-1">
                      {navigationLinks.map((link, index) => (
                        <NavigationMenuItem key={index} className="w-full">
                          <button
                            onClick={() => navigate(`/${link.href}`)}
                            className={cn(
                              "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer no-underline",
                              isLinkActive(link.href)
                                ? "bg-accent text-accent-foreground"
                                : "text-foreground/80"
                            )}
                          >
                            {link.label}
                          </button>
                        </NavigationMenuItem>
                      ))}
                    </NavigationMenuList>
                  </NavigationMenu>
                </PopoverContent>
              </Popover>
            )}
            {/* Main nav */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate("/home")}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">NBI</span>
                </div>
                <span className="hidden font-bold text-xl sm:inline-block text-gray-700">
                  NepBio Batch Records
                </span>
              </button>
              {/* Navigation menu */}
              {!isMobile && (
                <NavigationMenu className="flex">
                  <NavigationMenuList className="gap-1">
                    {navigationLinks.map((link, index) => (
                      <NavigationMenuItem key={index}>
                        <button
                          onClick={() => navigate(`/${link.href}`)}
                          className={cn(
                            "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-200 focus:bg-gray-200 focus:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer no-underline",
                            isLinkActive(link.href)
                              ? "bg-gray-200 text-gray-900"
                              : "text-gray-600 hover:text-gray-900"
                          )}
                        >
                          {link.label}
                        </button>
                      </NavigationMenuItem>
                    ))}
                  </NavigationMenuList>
                </NavigationMenu>
              )}
            </div>
          </div>
          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* User Profile Icon with Dropdown - Only show when authenticated */}
            {isAuthenticated && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center space-x-2 cursor-pointer hover:bg-gray-200 rounded-md p-1 transition-colors">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">👤</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-60 p-2">
                  <div className="space-y-1">
                    <div className="flex-col">
                      <div className="px-3 py-2 text-sm text-gray-700 border-b border-gray-200 overflow-hidden text-ellipsis whitespace-nowrap">
                        <p>{userEmail}</p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          logout({
                            logoutParams: {
                              returnTo: window.location.origin,
                            },
                          });
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer">
                        <span>{logOutText}</span>
                      </button >
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </header>
    );
  }
);

Navbar01.displayName = "Navbar01";

export { Logo, HamburgerIcon };
