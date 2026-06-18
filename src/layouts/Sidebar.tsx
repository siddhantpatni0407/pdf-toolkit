import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  Scissors,
  Minimize2,
  RotateCw,
  ArrowUpDown,
  Trash2,
  Crop,
  Wrench,
  FileOutput,
  FileInput,
  Lock,
  Unlock,
  Droplets,
  FileCode2,
  PenLine,
  ScanSearch,
  FormInput,
  ListOrdered,
  History,
  Settings,
  Info,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useThemeStore } from "@/shared/store/themeStore";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/history",   icon: History,         label: "History"   },
      { to: "/batch",     icon: ListOrdered,      label: "Batch"     },
    ],
  },
  {
    label: "Organize",
    items: [
      { to: "/merge",         icon: Layers,       label: "Merge PDF"       },
      { to: "/split",         icon: Scissors,     label: "Split PDF"       },
      { to: "/compress",      icon: Minimize2,    label: "Compress PDF"    },
      { to: "/rotate",        icon: RotateCw,     label: "Rotate Pages"    },
      { to: "/reorder",       icon: ArrowUpDown,  label: "Reorder Pages"   },
      { to: "/remove-pages",  icon: Trash2,       label: "Remove Pages"    },
      { to: "/extract-pages", icon: Crop,         label: "Extract Pages"   },
      { to: "/repair",        icon: Wrench,       label: "Repair PDF"      },
    ],
  },
  {
    label: "Convert",
    items: [
      { to: "/pdf-to", icon: FileOutput, label: "PDF → Files" },
      { to: "/to-pdf", icon: FileInput,  label: "Files → PDF" },
    ],
  },
  {
    label: "Security",
    items: [
      { to: "/protect",   icon: Lock,      label: "Protect PDF"      },
      { to: "/unlock",    icon: Unlock,    label: "Unlock PDF"       },
      { to: "/watermark", icon: Droplets,  label: "Watermark"        },
      { to: "/metadata",  icon: FileCode2, label: "Metadata Editor"  },
      { to: "/signature", icon: PenLine,   label: "Signature"        },
    ],
  },
  {
    label: "Advanced",
    items: [
      { to: "/ocr",       icon: ScanSearch, label: "OCR"       },
      { to: "/edit",      icon: PenLine,    label: "Edit PDF"  },
      { to: "/fill-form", icon: FormInput,  label: "Fill Form" },
    ],
  },
  {
    label: "App",
    items: [
      { to: "/settings", icon: Settings, label: "Settings" },
      { to: "/about",    icon: Info,     label: "About"    },
    ],
  },
] as const;

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useThemeStore();

  return (
    <aside
      className={cn(
        "flex flex-col bg-[var(--bg-sidebar)] border-r border-[var(--border-sidebar)] transition-all duration-300 ease-in-out flex-shrink-0 relative z-10",
        sidebarCollapsed ? "w-[60px]" : "w-[220px]"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-[var(--border-sidebar)] drag-region flex-shrink-0",
          sidebarCollapsed ? "justify-center px-2" : "px-4 gap-3"
        )}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 flex-shrink-0 shadow-md no-drag">
          <FileText className="h-4 w-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col min-w-0 no-drag">
            <span className="text-sm font-bold text-white tracking-tight leading-tight">
              PDFToolKit
            </span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">
              Offline · v1.0
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden space-y-1 scrollbar-thin">
        {NAV_SECTIONS.map(({ label, items }) => (
          <div key={label} className="mb-2">
            {!sidebarCollapsed ? (
              <p className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600 select-none">
                {label}
              </p>
            ) : (
              <div className="mx-3 my-2 h-px bg-slate-800" />
            )}
            <div className="space-y-0.5">
              {items.map(({ to, icon: Icon, label: itemLabel }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={sidebarCollapsed ? itemLabel : undefined}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 select-none",
                      sidebarCollapsed ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2",
                      isActive
                        ? "bg-brand-600/20 text-brand-400 border border-brand-600/30"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          "h-[17px] w-[17px] flex-shrink-0 transition-colors",
                          isActive ? "text-brand-400" : "text-slate-500"
                        )}
                      />
                      {!sidebarCollapsed && (
                        <span className="truncate text-[13px]">{itemLabel}</span>
                      )}
                      {!sidebarCollapsed && isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-[var(--border-sidebar)]">
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all text-sm",
            sidebarCollapsed && "justify-center"
          )}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span className="text-[13px]">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
