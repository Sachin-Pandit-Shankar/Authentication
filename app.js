const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

app.use(express.json());
const dbPath = path.join(__dirname, "./userData.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1 register

app.post("/register", async (request, response) => {
  const { username, name, gender, password, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getUserQuery = `
    SELECT * FROM user WHERE username = ${username};`;

  const dbUser = await db.get(getUserQuery);
  if (dbUser === undefined) {
    let postNewUserQuery = `
       INSERT INTO user (username,password,name,location,gender)
       VALUES (
           ${username},
           ${hashPassword},
           ${name},
           ${gender},
           ${location}
       ;)`;
    if (password.length < 5) {
      response.status(400);
      request.send("Password is too short");
    } else {
      let newUserDetails = await db.run(postNewUserQuery);
      response.status(200);
      response.send("User create successfully");
    }
  } else {
    response.status(400);
    response.send("User already exits");
  }
});

//login user

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUSerQuery = `
    SELECT * FROM user WHERE username = ${username};`;
  const dbUser = await db.get(getUserQuery);
  if (dbUser === undefined) {
    //invalid user
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("invalid password");
    }
  }
});

//api3 change password

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const newUserQuery = `
    SELECT * FROM user WHERE username = ${username};`;
  const dbUser = await db.get(newUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("User not Registered");
  } else {
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (isValidPassword === true) {
      const lengthOfThePassword = newPassword.length;
      if (lengthOfThePassword < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        if (encryptedPassword === true) {
          const updateUserPassword = `
                    UPDATE user SET password = ${encryptedPassword}
                    WHERE username = ${username};`;
          await db.run(updateUserPassword);
          response.send("Updated password");
        } else {
          response.status(400);
          response.send("Invalid current password");
        }
      }
    }
  }
});
module.exports = app;
