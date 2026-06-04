const mongoose = require("mongoose");
const User = require("./models/user");

mongoose.connect("mongodb://localhost:27017/smart_solution")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

async function createAdmin() {
  try {

    await User.deleteMany({ role: "admin" });

    await User.create({
      username: "queenton",
      email: "tiyiselaniqueentonrabopape@gmail.com",
      phone: "+27636263341",
      password: "ZORO1234", // ✅ plain password ONLY
      role: "admin"
    });

    console.log("✅ Admin created successfully");

  } catch (error) {
    console.log("❌ Error creating admin:", error);
  } finally {
    mongoose.connection.close();
  }
}

createAdmin();