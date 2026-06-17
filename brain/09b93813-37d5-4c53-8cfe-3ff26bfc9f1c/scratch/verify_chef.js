const db = require("c:/Users/SAMEER PASHA/OneDrive/Documents/Projects/Kapila_Project/backend/db");
const { getUserAuthContext } = require("c:/Users/SAMEER PASHA/OneDrive/Documents/Projects/Kapila_Project/backend/services/permissionService");

async function verify() {
  try {
    const chefUser = await db("users").where("email", "chef.tiffins@kapila.local").first();
    if (!chefUser) {
      console.error("Chef user not found!");
      return;
    }

    const authContext = await getUserAuthContext(chefUser.id);
    console.log("Chef user found:", authContext.name);
    console.log("Assigned Roles:", authContext.roles.map(r => r.key));
    console.log("Assigned Permissions count:", authContext.permissions.length);
    console.log("Permissions List:", authContext.permissions);
    
    // Expected permissions:
    const expected = [
      "recipes.view", "recipes.create", "recipes.edit", "recipes.delete",
      "indents.view", "indents.create", "indents.edit", "indents.delete", "indents.approve",
      "production.view", "production.create", "production.edit", "production.delete",
      "leftovers.view", "leftovers.create", "leftovers.edit", "leftovers.delete",
      "waste_analytics.view", "waste_analytics.export"
    ];

    const missing = expected.filter(p => !authContext.permissions.includes(p));
    const extra = authContext.permissions.filter(p => !expected.includes(p));

    console.log("\n--- Verification Report ---");
    if (missing.length === 0 && extra.length === 0) {
      console.log("✅ SUCCESS: Chef permissions are exactly as requested!");
    } else {
      if (missing.length > 0) {
        console.error("❌ MISSING permissions:", missing);
      }
      if (extra.length > 0) {
        console.error("❌ EXTRA permissions:", extra);
      }
    }
  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    db.destroy();
  }
}

verify();
