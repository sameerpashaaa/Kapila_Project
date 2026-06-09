import { COLORS } from "../styles/colors";

export default function Card({ children, style = {} }) {
  return (
    <div style={{ 
      background: COLORS.surface, 
      border: `1px solid ${COLORS.border}`, 
      borderRadius: 12, 
      padding: 20, 
      boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.04)",
      ...style 
    }}>
      {children}
    </div>
  );
}
