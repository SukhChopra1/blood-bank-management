const fs = require("fs");
const path = require("path");

const DONORS_FILE = path.join(__dirname, "../data/donors.json");

// Ensure donors.json exists
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
    console.error("Error initializing donors file:", error);
    fs.writeFileSync(DONORS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
};

const readDonors = () => {
  try {
    initializeDonorsFile();
    const data = fs.readFileSync(DONORS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    const arr = Array.isArray(parsed) ? parsed : [];

    // Migrate existing donors: ensure each donor has an id and createdAt
    let changed = false;
    for (let i = 0; i < arr.length; i++) {
      const d = arr[i];
      if (!d.id) {
        d.id = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
        changed = true;
      }
      if (!d.createdAt) {
        d.createdAt = new Date().toISOString();
        changed = true;
      }
    }
    if (changed) {
      try { fs.writeFileSync(DONORS_FILE, JSON.stringify(arr, null, 2), "utf-8"); } catch (e) { console.error('Error migrating donors ids', e); }
    }

    return arr;
  } catch (error) {
    console.error("Error reading donors:", error);
    return [];
  }
};

const saveDonors = (donors) => {
  try {
    fs.writeFileSync(DONORS_FILE, JSON.stringify(donors, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error saving donors:", error);
    return false;
  }
};

initializeDonorsFile();

exports.addDonor = (req, res) => {
  try {
    const { name, bloodGroup, mobile } = req.body;

    // Validation
    if (!name || !bloodGroup || !mobile) {
      return res.status(400).json({ message: "Name, blood group, and mobile are required" });
    }

    const donors = readDonors();
    const newDonor = {
      id: Date.now().toString(),
      name,
      bloodGroup,
      mobile,
      createdAt: new Date().toISOString()
    };

    donors.push(newDonor);
    const saved = saveDonors(donors);

    if (!saved) {
      return res.status(500).json({ message: "Error saving donor data" });
    }

    res.status(201).json({ message: "Donor added successfully", donor: newDonor });
  } catch (error) {
    console.error("Error adding donor:", error);
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
};

exports.getDonors = (req, res) => {
  try {
    const donors = readDonors();
    res.json(donors);
  } catch (error) {
    console.error("Error getting donors:", error);
    res.status(500).json({ message: "Error retrieving donors" });
  }
};

exports.deleteDonor = (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Donor id required" });

    const donors = readDonors();
    const idx = donors.findIndex(d => d.id === id);
    if (idx === -1) {
      return res.status(404).json({ message: "Donor not found" });
    }

    const [removed] = donors.splice(idx, 1);
    const saved = saveDonors(donors);
    if (!saved) return res.status(500).json({ message: "Error deleting donor" });

    res.json({ message: "Donor deleted", donor: removed });
  } catch (error) {
    console.error("Error deleting donor:", error);
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
};
