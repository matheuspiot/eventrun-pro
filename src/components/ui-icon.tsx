type IconName =
  | "plus"
  | "download"
  | "search"
  | "chart"
  | "spark"
  | "library"
  | "edit"
  | "calendar";

type UiIconProps = {
  name: IconName;
  className?: string;
};

export function UiIcon({ name, className = "h-4 w-4" }: UiIconProps) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    className,
  };

  switch (name) {
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case "download":
      return (
        <svg {...common}>
          <path d="M12 4v10" />
          <path d="m8 10 4 4 4-4" />
          <path d="M5 19h14" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6" />
          <path d="m20 20-4.2-4.2" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M4 19h16" />
          <path d="M7 15V9" />
          <path d="M12 15V5" />
          <path d="M17 15v-7" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path d="M12 3 13.8 8.2 19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
        </svg>
      );
    case "library":
      return (
        <svg {...common}>
          <path d="M4 6h16" />
          <path d="M6 6v12" />
          <path d="M12 6v12" />
          <path d="M18 6v12" />
          <path d="M4 18h16" />
        </svg>
      );
    case "edit":
      return (
        <svg {...common}>
          <path d="m4 20 4.5-1 9-9a2.1 2.1 0 0 0-3-3l-9 9L4 20Z" />
          <path d="m13.5 6.5 3 3" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M4 10h16" />
        </svg>
      );
    default:
      return null;
  }
}
