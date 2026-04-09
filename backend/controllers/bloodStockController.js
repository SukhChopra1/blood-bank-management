const fs = require("fs");
const path = require("path");

const DONORS_FILE = path.join(__dirname, "../data/donors.json");
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const initializeDonorsFile = () => {
  try {
    if (!fs.existsSync(DONORS_FILE)) {
      fs.writeFileSync(DONORS_FILE, JSON.stringify([], null, 2), "utf-8");
    }
    const content = fs.readFileSync(DONORS_FILE, "utf-8");
    if (!content.trim()) {
      fs.writeFileSync(DONORS_FILE, JSON.stringify([], null, 2), "utf-8");
    }
    JSON.parse(content);
  } catch (error) {
    console.error("Error initializing donors file for blood stock:", error);
    fs.writeFileSync(DONORS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
};

const readDonors = () => {
  try {
    initializeDonorsFile();
    const data = fs.readFileSync(DONORS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error reading donors for blood stock:", error);
    return [];
  }
};

exports.getBloodStock = (req, res) => {
  try {
    const donors = readDonors();
    const stock = BLOOD_GROUPS.map((group) => ({
      group,
      units: donors.filter((donor) => donor.bloodGroup === group).length
    }));
    res.json(stock);
  } catch (error) {
    console.error("Error computing blood stock:", error);
    res.status(500).json({ message: "Error retrieving blood stock" });
  }
};
