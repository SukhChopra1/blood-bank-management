// Authentication module
const fs = require("fs");
const USERS_FILE = "./data/users.json";

function readUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

module.exports = { readUsers, saveUsers };
