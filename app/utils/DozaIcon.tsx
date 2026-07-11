import Image from "next/image";

interface DozaNetworkIconProps {
  size?: number;
  className?: string;
  invert?: boolean;
}

const DozaNetworkIcon = ({
  size = 24,
  className = "",
  invert,
}: DozaNetworkIconProps) => {
  // Auto-detect invert from className if not explicitly provided
  const shouldInvert =
    invert !== undefined ? invert : className.includes("text-white");

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.png"
        alt="Doza Network"
        fill
        className={`object-contain transition-all duration-300 ${
          shouldInvert ? "brightness-0 invert" : ""
        }`}
      />
    </div>
  );
};

export default DozaNetworkIcon;
