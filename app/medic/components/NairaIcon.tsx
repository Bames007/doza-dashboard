import React from "react";

interface NairaIconProps {
  className?: string;
  size?: number;
}

const NairaIcon: React.FC<NairaIconProps> = ({ className = "", size = 20 }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Vertical N */}
      <path d="M6 3v18h2V9l8 12h2V3h-2v12L8 3H6z" />

      {/* Horizontal bars */}
      <rect x="4" y="9" width="16" height="1.5" />
      <rect x="4" y="13.5" width="16" height="1.5" />
    </svg>
  );
};

export default NairaIcon;
