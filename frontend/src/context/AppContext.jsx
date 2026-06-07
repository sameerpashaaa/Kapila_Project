import { createContext, useContext, useState, useCallback } from "react";
import * as api from "../api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Lightweight global cache — screens can pull fresh data themselves,
  // but stock names and details are shared across Indent autocomplete + Issuance
  const [stockNames, setStockNames] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [currentScreen, setCurrentScreen] = useState("dashboard");
  const [indentPreFill, setIndentPreFill] = useState(null);

  const refreshStockNames = useCallback(async () => {
    try {
      const res = await api.stock.list({ limit: 200, sort: "name", order: "asc" });
      setStocks(res.data || []);
      setStockNames((res.data || []).map((s) => s.name));
    } catch {}
  }, []);

  return (
    <AppContext.Provider value={{ 
      stockNames, 
      stocks, 
      refreshStockNames, 
      currentScreen, 
      setCurrentScreen,
      indentPreFill,
      setIndentPreFill
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
