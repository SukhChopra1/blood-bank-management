const fs = require("fs");
const path = require("path");

const REQUESTS_FILE = path.join(__dirname, "../data/requests.json");
const DONORS_FILE = path.join(__dirname, "../data/donors.json");

// Ensure requests.json exists
const initializeRequestsFile = () => {
  try {
    if (!fs.existsSync(REQUESTS_FILE)) {
      fs.writeFileSync(REQUESTS_FILE, JSON.stringify([], null, 2), "utf-8");
    }
    const content = fs.readFileSync(REQUESTS_FILE, "utf-8");
    if (!content.trim()) {
      fs.writeFileSync(REQUESTS_FILE, JSON.stringify([], null, 2), "utf-8");
    }
    JSON.parse(content);
  } catch (error) {
    console.error("Error initializing requests file:", error);
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
};

const readRequests = () => {
  try {
    initializeRequestsFile();
    const data = fs.readFileSync(REQUESTS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    const arr = Array.isArray(parsed) ? parsed : [];

    // Migrate existing requests to ensure id and createdAt
    let changed = false;
    for (let i = 0; i < arr.length; i++) {
      const r = arr[i];
      if (!r.id) {
        r.id = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
        changed = true;
      }
      if (!r.createdAt) {
        r.createdAt = new Date().toISOString();
        changed = true;
      }
    }
    if (changed) {
      try { fs.writeFileSync(REQUESTS_FILE, JSON.stringify(arr, null, 2), "utf-8"); } catch (e) { console.error('Error migrating requests ids', e); }
    }

    return arr;
  } catch (error) {
    console.error("Error reading requests:", error);
    return [];
  }
};

const saveRequests = (requests) => {
  try {
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error saving requests:", error);
    return false;
  }
};

const readDonors = () => {
  try {
    const data = fs.readFileSync(DONORS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error reading donors:", error);
    return [];
  }
};

initializeRequestsFile();

exports.createRequest = (req, res) => {
  try {
    const { patient, bloodGroup, units } = req.body;

    // Validation
    if (!patient || !bloodGroup || !units) {
      return res.status(400).json({ message: "Patient, blood group, and units are required" });
    }

    if (units <= 0) {
      return res.status(400).json({ message: "Units must be greater than 0" });
    }

    const requests = readRequests();
    const newRequest = {
      id: Date.now().toString(),
      patient,
      bloodGroup,
      units,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    requests.push(newRequest);
    const saved = saveRequests(requests);

    if (!saved) {
      return res.status(500).json({ message: "Error saving request data" });
    }

    res.status(201).json({ message: "Blood request submitted", request: newRequest });
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
};

exports.matchDonors = (req, res) => {
  try {
    const { bloodGroup } = req.params;

    const donors = readDonors();
    const matched = donors.filter(d => d.bloodGroup === bloodGroup);

    res.json(matched);
  } catch (error) {
    console.error("Error matching donors:", error);
    res.status(500).json({ message: "Error matching donors" });
  }
};

exports.getRequests = (req, res) => {
  try {
    const requests = readRequests();
    res.json(requests);
  } catch (error) {
    console.error("Error getting requests:", error);
    res.status(500).json({ message: "Error retrieving requests" });
  }
};

exports.updateRequestStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ message: "Request ID and status are required" });
    }

    if (!["pending", "approved", "completed", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const requests = readRequests();
    const request = requests.find(r => r.id === id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = status;
    request.updatedAt = new Date().toISOString();

    const saved = saveRequests(requests);

    if (!saved) {
      return res.status(500).json({ message: "Error updating request" });
    }

    res.json({ message: "Request status updated", request });
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
};

exports.deleteRequest = (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Request id required" });

    const requests = readRequests();
    const idx = requests.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ message: "Request not found" });

    const [removed] = requests.splice(idx, 1);
    const saved = saveRequests(requests);
    if (!saved) return res.status(500).json({ message: "Error deleting request" });

    res.json({ message: "Request deleted", request: removed });
  } catch (error) {
    console.error("Error deleting request:", error);
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
};
