import { 
  LayoutDashboard, Users, Box, Layers, Warehouse, 
  ArrowDownCircle, ArrowUpCircle, MapPin, FileText, 
  Calculator, Settings, ClipboardList, IndianRupee, 
  ShieldCheck, History, Printer
} from "lucide-react";

export interface SidebarItem {
  title: string;
  href?: string;
  icon?: any;
  submenu?: SidebarItem[];
}

export const sidebarRoutes: SidebarItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    submenu: [
      { title: "Today's Stats", href: "/dashboard/stats" },
      { title: "Stock Analysis", href: "/dashboard/stock-analysis" },
      { title: "Chamber Analysis", href: "/dashboard/chamber-analysis" },
      { title: "Party Rating", href: "/dashboard/party-rating" },
    ]
  },
  {
    title: "Master Data",
    icon: ShieldCheck,
    submenu: [
      { title: "Party Master", href: "/masters/party" },
      { title: "Item Master", href: "/masters/item" },
      { title: "Category Master", href: "/masters/category" },
      { title: "Unit Master", href: "/masters/unit" },
      { title: "Chamber Master", href: "/masters/chamber" },
      { title: "Party Item Rate", href: "/masters/party-rates" },
    ]
  },
  {
    title: "Chamber In",
    icon: ArrowDownCircle,
    submenu: [
      { title: "Material Inward (MR)", href: "/inward/mr-entry" },
      { title: "Inward Register", href: "/inward/register" },
      { title: "Update MR Details", href: "/inward/update" },
      { title: "Label/QR Printing", href: "/inward/printing" },
    ]
  },
  {
    title: "Party Demand",
    icon: ClipboardList,
    submenu: [
      { title: "Demand Entry", href: "/demand/entry" },
      { title: "Demand Register", href: "/demand/register" },
    ]
  },
  {
    title: "Chamber Out",
    icon: ArrowUpCircle,
    submenu: [
      { title: "Material Outward (GP)", href: "/outward/gp-entry" },
      { title: "Simple Gate Pass", href: "/outward/simple-gp-summary" },
      { title: "Outward Register", href: "/outward/register-detail" },
       { title: "Outward Summary", href: "/outward/register-summary" },
      { title: "Update GP Details", href: "/outward/update-details" },

    ]
  },
  {
    title: "Material Location",
    icon: MapPin,
    submenu: [
      { title: "Pallet Allocation", href: "/location/pallet-entry" },
      { title: "Pallet Report", href: "/location/pallet-report" },
        { title: "Pending Allocation", href: "/location/pending-allocation" },
        { title: "Pending Assign", href: "/location/assign-pallet" },
      { title: "Material Shifting", href: "/location/shifting-entry" },
      { title: "Shifting Report", href: "/location/shifting-report" },
      { title: "Update Stock Location", href: "/location/update-location" },
    ]
  },
  {
    title: "Chamber Billing",
    icon: Calculator,
    submenu: [
      { title: "Pending Bill List", href: "/billing/pending-summary" },
      { title: "Pending Bill Detail", href: "/billing/pending-detail" },
      { title: "Bill Entry", href: "/billing/entry" },
      { title: "Bill Summary", href: "/billing/bill-book" },
      { title: "Proforma (PI) Entry", href: "/billing/pi" },
      {title: "Proforma (PI) Summary", href: "/billing/pi-book"},
      { title: "Bill Book", href: "/billing/bill-book" },
      { title: "Accrued Rent Report", href: "/reports/accrued-detail" },
      { title: "Revenue Analysis", href: "/reports/accrued-summary" },
    ]
  },
  {
    title: "Accounts",
    icon: IndianRupee,
    submenu: [
      { title: "Account Master", href: "/accounts/master" },
      { title: "Voucher Entry", href: "/accounts/voucher" },
      {title: "Voucher Summary", href: "/accounts/voucher-summary"},
      { title: "Ledger Analysis", href: "/accounts/ledger-analysis" },
      {
        title: "Ledger Statement", href: "/accounts/ledger-statement"
      },
      // { title: "GST Summary", href: "/accounts/gst-summary" },
  // { title: "GST 3B", href: "/accounts/gstr-3b" },
      // { title: "Balance Sheet", href: "/accounts/balance-sheet" },
      { title: "Profit & Loss", href: "/accounts/profit-loss" },
    ]
  },

  {
    title: "Utilities",
    icon: Settings,
    submenu: [
      { title: "Admin Settings", href: "/admin/settings" },
      // { title: "Activity Log", href: "/admin/logs" },
      { title: "TDS Master", href: "/admin/tds" },
      { title: "Narration Master", href: "/admin/narrations" },
       
    ]
  }
];
