import { useState, useEffect } from "react";
import Section from "../../components/Section";
import Card from "../../components/Card";
import Btn from "../../components/Btn";
import Input from "../../components/Input";
import Select from "../../components/Select";
import ErrorMsg from "../../components/ErrorMsg";
import { COLORS } from "../../styles/colors";
import * as api from "../../api";
import { useAppContext } from "../../context/AppContext";

import { today } from "../../utils/dates";

export default function MenuPlannerScreen() {
  const { setCurrentScreen, setIndentPreFill } = useAppContext();
  const [recipesList, setRecipesList] = useState([]);
  const [deptsList, setDeptsList] = useState([]);
  const [menuList, setMenuList] = useState([]);
  
  const [form, setForm] = useState({
    dept: "",
    date: today(),
    recipe_id: "",
    target_plates: "100"
  });
  
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const recipesRes = await api.recipes.list();
      const deptsRes = await api.departments.list();
      const menuRes = await api.menu.list();
      
      if (recipesRes.success) setRecipesList(recipesRes.data || []);
      if (deptsRes.success && deptsRes.data.length > 0) {
        setDeptsList(deptsRes.data);
        setForm(f => ({ 
          ...f, 
          dept: f.dept || deptsRes.data[0].name,
          recipe_id: f.recipe_id || (recipesRes.data?.[0]?.id || "").toString()
        }));
      }
      if (menuRes.success) setMenuList(menuRes.data || []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const submitMenu = async () => {
    if (!form.recipe_id) return;
    try {
      const res = await api.menu.create({
        ...form,
        recipe_id: parseInt(form.recipe_id),
        target_plates: parseInt(form.target_plates)
      });
      if (res.success) {
        setMsg("Menu scheduled successfully ✓");
        setTimeout(() => setMsg(""), 2000);
        loadData();
      }
    } catch (e) {
      setMsg("Error: " + e.message);
    }
  };

  const deleteMenu = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this plan?")) return;
    try {
      await api.menu.remove(id);
      loadData();
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const handleSendIndent = (plan) => {
    // prefill indent items using scaled values
    setIndentPreFill({
      dept: plan.dept,
      items: plan.items
    });
    // navigate to indent screen
    setCurrentScreen("indent");
  };

  return (
    <Section title="Menu Planner & Recipe Scaling" sub="Schedule menus and automatically calculate required inventory quantities">
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 20 }}>
        {/* Left column: Schedule Form */}
        <Card>
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Schedule Menu</p>
          
          <Select label="Kitchen/Department" value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))}>
            {deptsList.map(d => <option key={d.id} value={d.name}>{d.name} ({d.code})</option>)}
          </Select>

          <Input label="Date Needed" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />

          <Select label="Select Recipe" value={form.recipe_id} onChange={e => setForm(f => ({ ...f, recipe_id: e.target.value }))}>
            {recipesList.map(r => <option key={r.id} value={r.id}>{r.name} ({r.category})</option>)}
          </Select>

          <Input label="Target Plates" type="number" value={form.target_plates} onChange={e => setForm(f => ({ ...f, target_plates: e.target.value }))} />

          <Btn onClick={submitMenu} style={{ width: "100%" }}>Schedule & Scale</Btn>
          {msg && <p style={{ color: COLORS.success, fontSize: 12, marginTop: 8, textAlign: "center" }}>{msg}</p>}
        </Card>

        {/* Right column: Current Menu Schedule & Calculations */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
            <h3 style={{ fontSize: 14, color: COLORS.text, fontWeight: 600, margin: 0 }}>Planned Meals Schedule</h3>
          </div>

          {loading ? (
            <p style={{ color: COLORS.muted, textAlign: "center", padding: 32 }}>Loading schedule…</p>
          ) : error ? (
            <ErrorMsg error={error} />
          ) : menuList.length === 0 ? (
            <p style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>No meals planned yet</p>
          ) : (
            <div style={{ overflowY: "auto", maxHeight: 500 }}>
              {menuList.map((plan) => (
                <div key={plan.id} style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}22` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: COLORS.accent, margin: 0 }}>{plan.recipe_name}</h4>
                      <p style={{ fontSize: 11, color: COLORS.muted, margin: "2px 0 0" }}>
                        Dept: <strong>{plan.dept}</strong> | Date: <strong>{plan.date.slice(0,10)}</strong>
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 12, background: COLORS.border + "44", borderRadius: 4, padding: "2px 8px", fontWeight: 600 }}>
                        {plan.target_plates} Plates
                      </span>
                      <Btn variant="danger" small onClick={() => deleteMenu(plan.id)}>✕</Btn>
                    </div>
                  </div>

                  {/* Scaled Ingredients Grid */}
                  <div style={{ background: COLORS.bg + "55", border: `1px solid ${COLORS.border}55`, borderRadius: 6, padding: 10, marginTop: 8 }}>
                    <p style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>Scaled Ingredients Needed</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {plan.items.map((ing, idx) => (
                        <span key={idx} style={{ fontSize: 12, background: COLORS.surface, border: `1px solid ${COLORS.border}aa`, borderRadius: 4, padding: "3px 8px", color: COLORS.text }}>
                          {ing.name}: <strong>{ing.qty} {ing.unit}</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Order Button */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                    <button 
                      onClick={() => handleSendIndent(plan)}
                      style={{
                        background: COLORS.accent,
                        color: "#000",
                        border: "none",
                        borderRadius: 4,
                        padding: "5px 12px",
                        fontSize: 11,
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      ⚡ Auto-Generate Indent Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Section>
  );
}
