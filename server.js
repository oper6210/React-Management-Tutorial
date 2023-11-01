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
const multer = require("multer");
const upload = multer({ dest: "./upload" });

connection.connect((err) => {
  if (err) console.log(err);
  else {
    console.log("db ok");
  }
});

app.get("/api/customers", (req, res) => {
  connection.query(
    "SELECT * FROM CUSTOMER WHERE isDeleted = '0' ORDER BY ID",
    (err, result) => {
      if (err != null) {
        console.log("Error");
        res.sendStatus(500);
      } else {
        console.log("ok");
        res.send(result.rows);
      }
    }
  );
});

app.use("/image", express.static("./upload"));

app.post("/api/customers", upload.single("image"), (req, res) => {
  let sql =
    "INSERT INTO CUSTOMER (image, name, birthday, gender, job, createdDate, isdeleted) VALUES ($1,$2,$3,$4,$5,now(), 0)";
  let image = "http://localhost:3000/image/" + req.file.filename;
  let name = req.body.userName;
  let birthday = req.body.birthday;
  let gender = req.body.gender;
  let job = req.body.job;
  console.log(image);
  let params = [image, name, birthday, gender, job];
  connection.query(sql, params, (err, rows, fields) => {
    res.send(rows);
    console.log(sql);
    console.log(params);
    console.log(err);
  });
});

app.delete("/api/customers/:id", (req, res) => {
  let sql = "UPDATE CUSTOMER SET isDeleted = 1 WHERE id  = $1";
  let params = [req.params.id];
  connection.query(sql, params, (err, rows, fields) => {
    res.send(rows);
  });
});

app.listen(port, () => console.log("listening on port " + port));
