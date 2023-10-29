const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 5001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const data = fs.readFileSync("./database.json");
const conf = JSON.parse(data);
const { Client } = require("pg");

const connection = new Client({
  host: conf.host,
  user: conf.user,
  password: conf.password,
  database: conf.database,
  port: conf.port,
});

connection.connect((err) => {
  if (err) console.log(err);
  else {
    console.log("db ok");
  }
});

app.get("/api/customers", (req, res) => {
  connection.query("SELECT * FROM CUSTOMER ORDER BY ID", (err, result) => {
    if (err != null) {
      console.log("Error");
      res.sendStatus(500);
    } else {
      console.log("ok");
      res.send(result.rows);
    }
  });
});

app.listen(port, () => console.log("listening on port " + port));
