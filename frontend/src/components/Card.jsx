import { useState } from "react";
import { COLORS } from "../styles/colors";

export default function Card({ children, style = {}, onClick, variant = "default", ...props }) {
  const [isHovered, setIsHovered] = useState(false);
  const isInteractive = variant === "interactive" || !!onClick;

  const getVariantStyles = () => {
    switch (variant) {
      case "interactive":
        return {
          cursor: "pointer",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          borderColor: isHovered ? "var(--color-accent-green)" : COLORS.border,
          boxShadow: isHovered 
            ? "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)" 
            : "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.04)",
        };
      case "highlighted":
        return {
          background: "#f8fafc",
          borderColor: "var(--color-border-strong)",
        };
      default:
        return {};
    }
  };

  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => isInteractive && setIsHovered(true)}
      onMouseLeave={() => isInteractive && setIsHovered(false)}
      style={{ 
        background: COLORS.surface, 
        border: `1px solid ${COLORS.border}`, 
        borderRadius: 12, 
        padding: 20, 
        boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.04)",
        ...getVariantStyles(),
        ...style 
      }}
      {...props}
    >
      {children}
    </div>
  );
}

