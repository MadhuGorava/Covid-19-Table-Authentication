const express = require("express");
const Express = express();
Express.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    Express.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

initializeDbAndServer();

Express.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  }
  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`;
    const dbResponse = await db.run(createUserQuery);
    const newUserId = dbResponse.lastID;
    response.send("User created successfully");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

Express.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

Express.put("/change-password", async (request, response) => {
  const { username, password, newPassword } = request.body;
  const getUser = `SELECT * FROM user WHERE username = ${username}`;
  const dbUser = await db.get(getUser);
  const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
  if (isPasswordMatched === false) {
    response.status(400);
    response.send("Invalid current password");
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const updateQuery = `UPDATE user SET username = '${username}', password = '${oldPassword}', password = '${hashedPassword}')`;
  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    await db.run(updateQuery);
    response.status(200);
    response.send("Password updated");
  }
});

module.exports = Express;
