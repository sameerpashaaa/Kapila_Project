const db = require("../db");
const fs = require("fs");
const path = require("path");

async function seed() {
  console.log("🌱 Starting 15-Day Stock Database Seeding...");

  try {
    // 1. Clean up existing transaction and stock data to prevent conflicts
    await db("stock_adjustments").del();
    await db("leftovers").del();
    await db("production").del();
    await db("issuance_items").del();
    await db("issuances").del();
    await db("indent_items").del();
    await db("indents").del();
    await db("stock").del();
    await db("goods_receipt_items").del();
    await db("goods_receipt_notes").del();
    await db("purchase_order_items").del();
    await db("purchase_orders").del();
    await db("reorder_points").del();
    await db("stock_transfer_items").del();
    await db("stock_transfers").del();

    console.log("🧹 Existing transaction and stock data cleaned.");

    // 2. Ensure Suppliers exist
    let suppliers = await db("suppliers").select("id", "name");
    if (suppliers.length === 0) {
      suppliers = await db("suppliers").insert([
        {
          name: "Super Foods Supplier",
          contact_name: "Ramesh Naidu",
          phone: "+91 98765 43210",
          email: "ramesh@superfoods.com",
          gstin: "37AAAAA1111A1Z1",
          address: "12/4 Broad Road, Guntur, AP"
        },
        {
          name: "Kapila Dairy Farms",
          contact_name: "Koteswara Rao",
          phone: "+91 87654 32109",
          email: "orders@kapiladairy.com",
          gstin: "37BBBBB2222B1Z2",
          address: "Dairy Colony, Vijayawada, AP"
        },
        {
          name: "Sri Venkateswara Provisions",
          contact_name: "Venkatesh S.",
          phone: "+91 76543 21098",
          email: "orders@svprovisions.com",
          gstin: "37CCCCC3333C1Z3",
          address: "Bazar Street, Nellore, AP"
        },
        {
          name: "Royal Disposables & Packaging",
          contact_name: "Suresh Kumar",
          phone: "+91 65432 10987",
          email: "suresh@royalpack.com",
          gstin: "33DDDDD4444D1Z4",
          address: "Red Hills Industrial Area, Chennai, TN"
        }
      ]).returning(["id", "name"]);
      console.log("🏭 Seeded 4 default suppliers.");
    }

    // 3. Read department_items.json
    const jsonPath = path.join(__dirname, "../db/department_items.json");
    if (!fs.existsSync(jsonPath)) {
      throw new Error("department_items.json not found!");
    }
    const mapping = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

    // Extract unique item names (case-insensitive)
    const uniqueNamesMap = new Map();
    for (const dept in mapping) {
      if (Array.isArray(mapping[dept])) {
        mapping[dept].forEach(item => {
          const trimmed = item.trim();
          if (trimmed && trimmed !== "PREPARED BY:") {
            const key = trimmed.toLowerCase();
            if (!uniqueNamesMap.has(key)) {
              uniqueNamesMap.set(key, trimmed.toUpperCase());
            }
          }
        });
      }
    }
    const uniqueNames = Array.from(uniqueNamesMap.values());
    console.log(`🔍 Found ${uniqueNames.length} unique items in department_items.json.`);

    // 4. Generate stock records
    const today = new Date();
    const d = (daysAgo) => {
      const date = new Date(today);
      date.setDate(today.getDate() - daysAgo);
      return date.toISOString().slice(0, 10);
    };
    const expDate = (daysAhead) => {
      const date = new Date(today);
      date.setDate(today.getDate() + daysAhead);
      return date.toISOString().slice(0, 10);
    };

    const stockItems = [];
    const reorderPoints = [];
    let counter = 1000;

    // Helper to estimate unit and price
    const getUnitAndPrice = (name) => {
      const lower = name.toLowerCase();
      if (lower.includes("oil") || lower.includes("milk") || lower.includes("ghee") || lower.includes("juice") || lower.includes("water") || lower.includes("beverage")) {
        return { unit: "L", price: Math.floor(Math.random() * 100) + 60 };
      }
      if (lower.includes("carry bag") || lower.includes("paper") || lower.includes("roll") || lower.includes("cup") || lower.includes("plate") || lower.includes("box") || lower.includes("spoon") || lower.includes("softy") || lower.includes("tiffin")) {
        return { unit: "pcs", price: Math.floor(Math.random() * 10) + 1.5 };
      }
      if (lower.includes("butter") || lower.includes("cheese") || lower.includes("paneer") || lower.includes("curd")) {
        return { unit: "pcs", price: Math.floor(Math.random() * 150) + 100 }; // packets/blocks
      }
      // default is kg
      return { unit: "kg", price: Math.floor(Math.random() * 200) + 30 };
    };

    // Keep some standard items with consistent codes
    const standardCodes = {
      "premium basmati rice": "KPL-101",
      "refined sunflower oil": "KPL-102",
      "butter (500g)": "KPL-103",
      "ghee": "KPL-104",
      "sugar": "KPL-105"
    };

    for (const name of uniqueNames) {
      counter++;
      const { unit, price } = getUnitAndPrice(name);
      const cleanLower = name.toLowerCase();
      const itemCode = standardCodes[cleanLower] || `KPL-${counter}`;

      // Pick a supplier
      let supplierObj = suppliers[counter % suppliers.length];
      // Keep dairy/milk/butter/cheese/paneer mostly with Kapila Dairy Farms (id/index 1 in suppliers list)
      if (cleanLower.includes("milk") || cleanLower.includes("butter") || cleanLower.includes("cheese") || cleanLower.includes("paneer") || cleanLower.includes("curd") || cleanLower.includes("ghee")) {
        supplierObj = suppliers.find(s => s.name.includes("Dairy")) || supplierObj;
      }
      // Keep disposables mostly with Royal Disposables
      if (cleanLower.includes("roll") || cleanLower.includes("bag") || cleanLower.includes("cup") || cleanLower.includes("spoon") || cleanLower.includes("napkin")) {
        supplierObj = suppliers.find(s => s.name.includes("Royal")) || supplierObj;
      }

      // Generate a generous amount to last 15 days (e.g. between 300 and 800)
      const qty = Math.floor(Math.random() * 500) + 300;
      const remaining = qty; // Fully stocked

      stockItems.push({
        name,
        qty,
        remaining,
        unit,
        price,
        supplier: supplierObj.name,
        supplier_id: supplierObj.id,
        date: d(2), // Received 2 days ago
        expiry_date: expDate(Math.floor(Math.random() * 150) + 30), // Expires in 30-180 days
        item_code: itemCode,
        min_alert_qty: Math.floor(qty * 0.15) // Alert at 15% remaining
      });

      // Configure a reorder point rule for this item
      reorderPoints.push({
        item_code: itemCode,
        name,
        min_qty: Math.floor(qty * 0.15),
        reorder_qty: Math.floor(qty * 0.75)
      });
    }

    // Insert stock in batches of 100 to prevent query parameter limit errors in knex/pg
    const batchSize = 100;
    for (let i = 0; i < stockItems.length; i += batchSize) {
      const batch = stockItems.slice(i, i + batchSize);
      await db("stock").insert(batch);
    }
    console.log(`📦 Inserted ${stockItems.length} stock batch records.`);

    for (let i = 0; i < reorderPoints.length; i += batchSize) {
      const batch = reorderPoints.slice(i, i + batchSize);
      await db("reorder_points").insert(batch);
    }
    console.log(`🔔 Configured ${reorderPoints.length} reorder point rules.`);

    // 5. Seed some basic transactions for history
    // Create an initial draft PO for low stock items (none yet, but let's make one draft)
    const [po] = await db("purchase_orders").insert({
      po_number: "PO-20260612-0001",
      supplier_id: suppliers[0].id,
      date: d(0),
      status: "Draft",
      total_amount: 15000.00,
      notes: "Initial restocking draft"
    }).returning("*");

    await db("purchase_order_items").insert([
      { po_id: po.id, item_code: "KPL-101", name: "Premium Basmati Rice", qty: 100, unit: "kg", unit_price: 90, total_price: 9000 },
      { po_id: po.id, item_code: "KPL-102", name: "Refined Sunflower Oil", qty: 50, unit: "L", unit_price: 120, total_price: 6000 }
    ]);

    console.log("🧾 Initial RESTocking Purchase Order created.");

    // Create a pending indent for TIFFINS
    const [ind] = await db("indents").insert({
      dept: "TIFFINS",
      date: d(0),
      status: "pending"
    }).returning("*");

    await db("indent_items").insert([
      { indent_id: ind.id, name: "Poha", qty: 20, unit: "kg", item_code: stockItems.find(s => s.name === "Poha")?.item_code || "KPL-NEW" },
      { indent_id: ind.id, name: "GOLD MILK", qty: 50, unit: "L", item_code: stockItems.find(s => s.name === "GOLD MILK")?.item_code || "KPL-NEW" }
    ]);

    console.log("📋 Initial pending Indents placed for TIFFINS.");

    console.log("🎉 Database Successfully Seeded with a Rich 15-Day Supply! 🎉");
  } catch (err) {
    console.error("❌ Seeding failed:", err.stack);
  } finally {
    db.destroy();
  }
}

seed();
