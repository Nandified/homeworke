export type PortalNavItem = { href: string; label: string };

export function buildProNav(basePath: "/pro" | "/partner"): PortalNavItem[] {
  return [
    { href: `${basePath}/dashboard`, label: "Dashboard" },
    { href: `${basePath}/express-estimate`, label: "Express Estimate" },
    { href: `${basePath}/jobs`, label: "Jobs" },
    { href: `${basePath}/clients`, label: "My Clients" },
    { href: `${basePath}/properties`, label: "Properties" },
    { href: `${basePath}/messages`, label: "Messages" },
    { href: `${basePath}/marketing-tools`, label: "Marketing Tools" },
    { href: `${basePath}/support`, label: "Support" },
    { href: `${basePath}/account`, label: "My Account" },
  ];
}
