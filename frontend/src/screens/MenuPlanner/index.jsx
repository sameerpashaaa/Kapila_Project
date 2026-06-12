import { useEffect, useMemo, useState } from "react";
import { BookOpen, Plus, Save, Trash2, Utensils, X } from "lucide-react";
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

const blankIngredient = () => ({
  item_name: "",
  base_qty: "",
  base_plates: 100,
  unit: "kg",
});

const toRecipeDraft = (recipe) => ({
  name: recipe?.name || "",
  category: recipe?.category || "GENERAL",
  description: recipe?.description || "",
  items: recipe?.items?.length
    ? recipe.items.map((item) => ({
      item_name: item.item_name || item.name || "",
      base_qty: item.base_qty ?? item.qty ?? "",
      base_plates: item.base_plates || 100,
      unit: item.unit || "kg",
    }))
    : [blankIngredient()],
});

function RecipeModal({ open, onClose, onSave, saving, stocks }) {
  const [draft, setDraft] = useState(() => toRecipeDraft());

  useEffect(() => {
    if (open) setDraft(toRecipeDraft());
  }, [open]);

  if (!open) return null;

  const updateItem = (index, patch) => {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    }));
  };

  const removeItem = (index) => {
    setDraft((current) => ({
      ...current,
      items: current.items.length === 1 ? current.items : current.items.filter((_, idx) => idx !== index),
    }));
  };

  return (
    <div className="recipe-modal-backdrop">
      <div className="recipe-modal">
        <div className="recipe-modal-header">
          <div>
            <p className="eyebrow">Create Recipe</p>
            <h3>New recipe module</h3>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close create recipe">
            <X size={18} />
          </button>
        </div>

        <div className="recipe-form-grid">
          <Input label="Recipe Name" value={draft.name} onChange={(e) => setDraft((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Category" value={draft.category} onChange={(e) => setDraft((f) => ({ ...f, category: e.target.value }))} />
        </div>
        <Input label="Description" value={draft.description} onChange={(e) => setDraft((f) => ({ ...f, description: e.target.value }))} />

        <div className="recipe-modal-table">
          <div className="recipe-table-head">
            <span>Ingredient</span>
            <span>Quantity</span>
            <span>Unit</span>
            <span />
          </div>
          {draft.items.map((item, index) => (
            <div className="recipe-edit-row" key={index}>
              <input
                list="stock-items"
                value={item.item_name}
                onChange={(e) => updateItem(index, { item_name: e.target.value })}
                placeholder="Item name"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.base_qty}
                onChange={(e) => updateItem(index, { base_qty: e.target.value })}
                placeholder="0"
              />
              <input value={item.unit} onChange={(e) => updateItem(index, { unit: e.target.value })} placeholder="kg" />
              <button className="icon-button danger" onClick={() => removeItem(index)} aria-label="Delete ingredient">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <Btn variant="ghost" onClick={() => setDraft((f) => ({ ...f, items: [...f.items, blankIngredient()] }))} icon={<Plus size={15} />}>
            Add Item
          </Btn>
          <div className="modal-action-spacer" />
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => onSave(draft)} loading={saving} icon={<Save size={15} />}>
            Save Recipe
          </Btn>
        </div>
      </div>
    </div>
  );
}

export default function MenuPlannerScreen() {
  const { setCurrentScreen, setIndentPreFill, stocks = [] } = useAppContext();
  const [recipesList, setRecipesList] = useState([]);
  const [deptsList, setDeptsList] = useState([]);
  const [menuList, setMenuList] = useState([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [recipeDraft, setRecipeDraft] = useState(toRecipeDraft());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);

  const [form, setForm] = useState({
    dept: "",
    date: today(),
    recipe_id: "",
    target_plates: "100",
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectedRecipe = useMemo(
    () => recipesList.find((recipe) => String(recipe.id) === String(selectedRecipeId)),
    [recipesList, selectedRecipeId]
  );

  const selectedPlan = useMemo(
    () => menuList.find((plan) => String(plan.recipe_id) === String(selectedRecipeId)),
    [menuList, selectedRecipeId]
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recipesRes, deptsRes, menuRes] = await Promise.all([
        api.recipes.list(),
        api.departments.list(),
        api.menu.list(),
      ]);

      const nextRecipes = recipesRes.success ? recipesRes.data || [] : [];
      const nextRecipeId = selectedRecipeId || form.recipe_id || (nextRecipes[0]?.id || "").toString();

      setRecipesList(nextRecipes);
      setSelectedRecipeId(nextRecipeId);
      setForm((current) => ({
        ...current,
        recipe_id: current.recipe_id || nextRecipeId,
      }));

      if (deptsRes.success && deptsRes.data.length > 0) {
        setDeptsList(deptsRes.data);
        setForm((current) => ({ ...current, dept: current.dept || deptsRes.data[0].name }));
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

  useEffect(() => {
    if (selectedRecipe) {
      setRecipeDraft(toRecipeDraft(selectedRecipe));
      setForm((current) => ({ ...current, recipe_id: String(selectedRecipe.id) }));
    }
  }, [selectedRecipe]);

  const submitMenu = async () => {
    if (!form.recipe_id) return;
    try {
      const res = await api.menu.create({
        ...form,
        recipe_id: parseInt(form.recipe_id),
        target_plates: parseInt(form.target_plates),
      });
      if (res.success) {
        setMsg("Menu scheduled successfully");
        setTimeout(() => setMsg(""), 2000);
        loadData();
      }
    } catch (e) {
      setMsg("Error: " + e.message);
    }
  };

  const updateDraftItem = (index, patch) => {
    setRecipeDraft((current) => ({
      ...current,
      items: current.items.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    }));
  };

  const addDraftItem = () => {
    setRecipeDraft((current) => ({ ...current, items: [...current.items, blankIngredient()] }));
  };

  const removeDraftItem = (index) => {
    setRecipeDraft((current) => ({
      ...current,
      items: current.items.length === 1 ? current.items : current.items.filter((_, idx) => idx !== index),
    }));
  };

  const saveSelectedRecipe = async () => {
    if (!selectedRecipe) return;
    setSavingRecipe(true);
    try {
      const res = await api.recipes.update(selectedRecipe.id, recipeDraft);
      if (res.success) {
        setRecipesList((current) => current.map((recipe) => (recipe.id === selectedRecipe.id ? res.data : recipe)));
        setMsg("Recipe saved");
        setTimeout(() => setMsg(""), 2000);
      }
    } catch (e) {
      setMsg("Error: " + e.message);
    } finally {
      setSavingRecipe(false);
    }
  };

  const createRecipe = async (draft) => {
    setSavingRecipe(true);
    try {
      const res = await api.recipes.create(draft);
      if (res.success) {
        setRecipesList((current) => [...current, res.data].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedRecipeId(String(res.data.id));
        setForm((current) => ({ ...current, recipe_id: String(res.data.id) }));
        setIsCreateOpen(false);
        setMsg("Recipe created");
        setTimeout(() => setMsg(""), 2000);
      }
    } catch (e) {
      setMsg("Error: " + e.message);
    } finally {
      setSavingRecipe(false);
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
    setIndentPreFill({
      dept: plan.dept,
      items: plan.items,
    });
    setCurrentScreen("indent");
  };

  const handleAutoIndentFill = () => {
    if (!selectedRecipe) return;
    const targetPlates = parseFloat(form.target_plates) || 100;
    const scaleFactor = targetPlates / 100;

    const items = (recipeDraft.items || [])
      .filter((it) => it.item_name && it.item_name.trim() !== "")
      .map((it) => ({
        name: it.item_name,
        qty: (parseFloat(it.base_qty) || 0) * scaleFactor,
        unit: it.unit || "kg",
      }));

    setIndentPreFill({
      dept: selectedPlan?.dept || form.dept || "TIFFINS",
      items,
    });
    setCurrentScreen("indent");
  };

  return (
    <Section title="Menu Planner & Recipe Scaling" sub="Schedule menus and maintain recipe quantities from one focused workspace">
      <style>{`
        .menu-planner-grid { display: grid; grid-template-columns: minmax(320px, 380px) 1fr; gap: 20px; align-items: start; }
        .planner-left { display: flex; flex-direction: column; gap: 14px; }
        .panel-title { font-size: 12px; color: ${COLORS.muted}; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
        .create-recipe-tile { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid ${COLORS.border}; border-radius: 8px; background: #f8fafc; color: ${COLORS.text}; cursor: pointer; text-align: left; }
        .create-recipe-tile:hover { border-color: ${COLORS.brand}; background: #fff9ec; }
        .create-icon { width: 38px; height: 38px; border-radius: 8px; display: grid; place-items: center; background: ${COLORS.brand}22; color: ${COLORS.brand}; flex-shrink: 0; }
        .recipe-select-list { display: flex; flex-direction: column; gap: 6px; max-height: 240px; overflow: auto; scrollbar-width: thin; }
        .recipe-list-button { width: 100%; border: 1px solid ${COLORS.border}; border-radius: 8px; padding: 10px 12px; background: #fff; text-align: left; cursor: pointer; color: ${COLORS.text}; }
        .recipe-list-button.active { border-color: ${COLORS.brand}; background: #fff8e8; }
        .recipe-list-button strong { display: block; font-size: 13px; margin-bottom: 2px; }
        .recipe-list-button span { display: block; font-size: 11px; color: ${COLORS.muted}; }
        .status-line { margin: 10px 0 0; color: ${COLORS.success}; font-size: 12px; text-align: center; }
        .recipe-editor-card { padding: 0; overflow: hidden; }
        .recipe-editor-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; padding: 18px 20px; border-bottom: 1px solid ${COLORS.border}; }
        .recipe-editor-title { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .recipe-editor-title h3 { margin: 0; color: ${COLORS.text}; font-size: 18px; font-weight: 700; }
        .recipe-editor-title p { margin: 4px 0 0; color: ${COLORS.muted}; font-size: 12px; }
        .recipe-editor-body { padding: 18px 20px 20px; }
        .recipe-meta-grid { display: grid; grid-template-columns: 1.3fr 0.7fr; gap: 12px; }
        .recipe-items-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 10px 0; }
        .recipe-items-toolbar h4 { margin: 0; font-size: 13px; color: ${COLORS.text}; }
        .recipe-items-toolbar span { color: ${COLORS.muted}; font-size: 12px; }
        .recipe-table { border: 1px solid ${COLORS.border}; border-radius: 8px; overflow: hidden; background: #fff; }
        .recipe-table-head, .recipe-edit-row { display: grid; grid-template-columns: minmax(180px, 1fr) 120px 90px 44px; align-items: center; }
        .recipe-table-head { background: #f8fafc; border-bottom: 1px solid ${COLORS.border}; }
        .recipe-table-head span { padding: 9px 12px; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
        .recipe-edit-row { border-bottom: 1px solid ${COLORS.border}; }
        .recipe-edit-row:last-child { border-bottom: 0; }
        .recipe-edit-row input { border: 0; border-right: 1px solid ${COLORS.border}; border-radius: 0; min-height: 40px; padding: 8px 12px; color: ${COLORS.text}; background: #fff; }
        .recipe-edit-row input:focus { outline: 2px solid ${COLORS.brand}44; outline-offset: -2px; }
        .recipe-edit-row .icon-button { margin: 0 auto; }
        .recipe-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 14px; }
        .plan-summary { border: 1px solid ${COLORS.border}; border-radius: 8px; padding: 12px; background: #f8fafc; display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
        .plan-summary strong { display: block; color: ${COLORS.text}; font-size: 13px; }
        .plan-summary span { display: block; color: ${COLORS.muted}; font-size: 11px; margin-top: 2px; }
        .icon-button { width: 32px; height: 32px; border: 1px solid ${COLORS.border}; border-radius: 8px; background: #fff; color: ${COLORS.text}; display: inline-grid; place-items: center; cursor: pointer; }
        .icon-button:hover { background: #f8fafc; border-color: ${COLORS.brand}; }
        .icon-button.danger { color: ${COLORS.danger}; }
        .recipe-modal-backdrop { position: fixed; inset: 0; z-index: 400; background: rgba(15, 23, 42, 0.45); display: grid; place-items: center; padding: 24px; }
        .recipe-modal { width: min(760px, 100%); max-height: calc(100vh - 48px); overflow: auto; background: ${COLORS.surface}; border-radius: 10px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.24); border: 1px solid ${COLORS.border}; padding: 20px; }
        .recipe-modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
        .recipe-modal-header h3 { margin: 2px 0 0; color: ${COLORS.text}; font-size: 18px; }
        .eyebrow { margin: 0; color: ${COLORS.muted}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
        .recipe-form-grid { display: grid; grid-template-columns: 1.3fr 0.7fr; gap: 12px; }
        .recipe-modal-table { border: 1px solid ${COLORS.border}; border-radius: 8px; overflow: hidden; margin-top: 8px; }
        .modal-actions { display: flex; align-items: center; gap: 10px; margin-top: 16px; }
        .modal-action-spacer { flex: 1; }
        @media (max-width: 980px) {
          .menu-planner-grid { grid-template-columns: 1fr; }
          .recipe-meta-grid, .recipe-form-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .recipe-editor-header, .recipe-footer, .plan-summary { flex-direction: column; align-items: stretch; }
          .recipe-table { overflow-x: auto; }
          .recipe-table-head, .recipe-edit-row { min-width: 560px; }
        }
      `}</style>

      <RecipeModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSave={createRecipe} saving={savingRecipe} stocks={stocks} />
      <datalist id="stock-items">
        {stocks.map((stock) => <option key={stock.id || stock.item_code || stock.name} value={stock.name} />)}
      </datalist>

      <div className="menu-planner-grid">
        <div className="planner-left">
          <Card>
            <button className="create-recipe-tile" onClick={() => setIsCreateOpen(true)}>
              <span className="create-icon"><Plus size={20} /></span>
              <span>
                <strong style={{ display: "block", fontSize: 14 }}>Create Recipe</strong>
                <span style={{ display: "block", fontSize: 12, color: COLORS.muted }}>Add recipe name, ingredients and quantities</span>
              </span>
            </button>
          </Card>

          <Card>
            <p className="panel-title">Schedule Menu</p>

            <Select label="Kitchen/Department" value={form.dept} onChange={(e) => setForm((f) => ({ ...f, dept: e.target.value }))}>
              {deptsList.map((dept) => <option key={dept.id} value={dept.name}>{dept.name} ({dept.code})</option>)}
            </Select>

            <Input label="Date Needed" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />

            <Select
              label="Select Recipe"
              value={form.recipe_id}
              onChange={(e) => {
                setForm((f) => ({ ...f, recipe_id: e.target.value }));
                setSelectedRecipeId(e.target.value);
              }}
            >
              {recipesList.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name} ({recipe.category})</option>)}
            </Select>

            <Input label="Target Plates" type="number" min="1" value={form.target_plates} onChange={(e) => setForm((f) => ({ ...f, target_plates: e.target.value }))} />

            <Btn onClick={submitMenu} style={{ width: "100%" }} icon={<Utensils size={15} />}>Schedule & Scale</Btn>
            {msg && <p className="status-line">{msg}</p>}
          </Card>

          <Card>
            <p className="panel-title">Recipes</p>
            <div className="recipe-select-list">
              {recipesList.map((recipe) => (
                <button
                  key={recipe.id}
                  className={`recipe-list-button ${String(recipe.id) === String(selectedRecipeId) ? "active" : ""}`}
                  onClick={() => {
                    setSelectedRecipeId(String(recipe.id));
                    setForm((f) => ({ ...f, recipe_id: String(recipe.id) }));
                  }}
                >
                  <strong>{recipe.name}</strong>
                  <span>{recipe.category} | {recipe.items?.length || 0} items</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <Card className="recipe-editor-card">
          {loading ? (
            <p style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>Loading recipes...</p>
          ) : error ? (
            <ErrorMsg error={error} />
          ) : !selectedRecipe ? (
            <p style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>Select or create a recipe to begin</p>
          ) : (
            <>
              <div className="recipe-editor-header">
                <div className="recipe-editor-title">
                  <span className="create-icon"><BookOpen size={20} /></span>
                  <div>
                    <h3>{selectedRecipe.name}</h3>
                    <p>Editing base quantities per 100 plates</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  <Btn onClick={saveSelectedRecipe} loading={savingRecipe} icon={<Save size={15} />}>Save Changes</Btn>
                  <button
                    type="button"
                    onClick={handleAutoIndentFill}
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid #e8a838",
                      borderRadius: "6px",
                      color: "#e8a838",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      outline: "none",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fff8e8"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    Auto Indent Fill
                  </button>
                </div>
              </div>

              <div className="recipe-editor-body">
                {selectedPlan && (
                  <div className="plan-summary">
                    <div>
                      <strong>Scheduled for {selectedPlan.dept}</strong>
                      <span>{String(selectedPlan.date).slice(0, 10)} | {selectedPlan.target_plates} plates</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn small variant="ghost" onClick={() => handleSendIndent(selectedPlan)}>Generate Indent</Btn>
                      <button className="icon-button danger" onClick={() => deleteMenu(selectedPlan.id)} aria-label="Cancel plan">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="recipe-meta-grid">
                  <Input label="Recipe Name" value={recipeDraft.name} onChange={(e) => setRecipeDraft((f) => ({ ...f, name: e.target.value }))} />
                  <Input label="Category" value={recipeDraft.category} onChange={(e) => setRecipeDraft((f) => ({ ...f, category: e.target.value }))} />
                </div>
                <Input label="Description" value={recipeDraft.description} onChange={(e) => setRecipeDraft((f) => ({ ...f, description: e.target.value }))} />

                <div className="recipe-items-toolbar">
                  <div>
                    <h4>Ingredients</h4>
                    <span>Quantities are stored as the base recipe for 100 plates.</span>
                  </div>
                  <Btn small variant="ghost" onClick={addDraftItem} icon={<Plus size={15} />}>Add Item</Btn>
                </div>

                <div className="recipe-table">
                  <div className="recipe-table-head">
                    <span>Item Name</span>
                    <span>Quantity</span>
                    <span>Unit</span>
                    <span />
                  </div>
                  {recipeDraft.items.map((item, index) => (
                    <div className="recipe-edit-row" key={index}>
                      <input
                        list="stock-items"
                        value={item.item_name}
                        onChange={(e) => updateDraftItem(index, { item_name: e.target.value })}
                        placeholder="Ingredient"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.base_qty}
                        onChange={(e) => updateDraftItem(index, { base_qty: e.target.value })}
                        placeholder="0"
                      />
                      <input value={item.unit} onChange={(e) => updateDraftItem(index, { unit: e.target.value })} placeholder="kg" />
                      <button className="icon-button danger" onClick={() => removeDraftItem(index)} aria-label="Delete ingredient">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="recipe-footer">
                  <span style={{ color: COLORS.muted, fontSize: 12 }}>
                    {recipeDraft.items.length} ingredient{recipeDraft.items.length === 1 ? "" : "s"} in this recipe
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                    <Btn onClick={saveSelectedRecipe} loading={savingRecipe} icon={<Save size={15} />}>Save Changes</Btn>
                    <button
                      type="button"
                      onClick={handleAutoIndentFill}
                      style={{
                        backgroundColor: "transparent",
                        border: "1px solid #e8a838",
                        borderRadius: "6px",
                        color: "#e8a838",
                        cursor: "pointer",
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "4px 10px",
                        outline: "none",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fff8e8"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      Auto Indent Fill
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </Section>
  );
}
