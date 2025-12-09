import { useMemo } from "react";
import { Navbar01, type Navbar01NavLink } from "@/components/ui/shadcn-io/navbar-01";
import { useUserRoles } from "@/hooks/useUserRoles";

type NavItem = Navbar01NavLink & { allowedRoles?: string[] };

const NAV_ITEMS: NavItem[] = [
  { href: "home", label: "Home" },
  { href: "records", label: "Records", allowedRoles: ["USER", "ADMIN", "QA", "QC", "VIEWER"] },
  { href: "templates", label: "Templates", allowedRoles: ["ADMIN", "QA", "QC"] },
  { href: "users", label: "Users", allowedRoles: ["ADMIN"] },
  { href: "products", label: "Products", allowedRoles: ["ADMIN", "QA", "QC"] },
  { href: "logs", label: "Logs", allowedRoles: ["ADMIN", "QC", "QA"] },
  { href: "approvals", label: "Approvals", allowedRoles: ["QA", "QC", "ADMIN"] }
];

const NavBar = () => {
  const { hasAnyRole } = useUserRoles();

  const navigationLinks = useMemo(
    () =>
      NAV_ITEMS.filter(
        (item) => !item.allowedRoles || hasAnyRole(item.allowedRoles)
      ),
    [hasAnyRole]
  );

  return (
    <div className="relative w-full">
      <Navbar01 navigationLinks={navigationLinks} isAdmin={hasAnyRole(["ADMIN"])} />
    </div>
  );
};

export default NavBar;
