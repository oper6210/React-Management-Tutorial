const fs = require("fs");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 5001;
const bcrypt = require("bcrypt");

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
const sessionOption = require("./lib/sessionOption");
const PgSession = require("connect-pg-simple")(session);

const sessionPool = new Client({
  connectionString: sessionOption.connectionString, // PostgreSQL 연결 문자열을 사용하거나 별도의 호스트, 포트, 사용자, 데이터베이스 정보를 제공할 수 있습니다.
});

const sessionStore = new PgSession({
  pool: sessionPool,
  tableName: "session", // 세션 정보를 저장할 테이블 이름
});

app.use(
  session({
    key: "session_cookie_name",
    secret: sessionOption.password, // 세션 암호화를 위한 비밀 키
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
  })
);

const multer = require("multer");
const upload = multer({ dest: "./upload" });

connection.connect((err) => {
  if (err) console.log(err);
  else {
    console.log("db ok");
  }
});

app.get("/", (req, res) => {
  req.sendFile(path.join(__dirname, ""));
});

app.get("/authcheck", (req, res) => {
  const sendData = { isLogin: "" };
  if (req.session.is_logined) {
    sendData.isLogin = "True";
  } else {
    sendData.isLogin = "False";
  }
  res.send(sendData);
});

app.get("/logout", function (req, res) {
  req.session.destroy(function (err) {
    res.redirect("/");
  });
});

app.post("/login", (req, res) => {
  // 데이터 받아서 결과 전송
  const username = req.body.userId;
  const password = req.body.userPassword;
  const sendData = { isLogin: "" };

  if (username && password) {
    // id와 pw가 입력되었는지 확인
    connection.query(
      "SELECT * FROM userTable WHERE username = $1",
      [username],
      function (error, rows, fields) {
        if (error) throw error;
        if (rows.rows.length) {
          // db에서의 반환값이 있다 = 일치하는 아이디가 있다.

          bcrypt.compare(password, rows.rows[0].password, (err, result) => {
            // 입력된 비밀번호가 해시된 저장값과 같은 값인지 비교
            if (result === true) {
              // 비밀번호가 일치하면
              sendData.isLogin = "True";
              res.send(sendData);
            } else {
              // 비밀번호가 다른 경우
              sendData.isLogin = "로그인 정보가 일치하지 않습니다.";
              res.send(sendData);
            }
          });
        } else {
          // db에 해당 아이디가 없는 경우
          sendData.isLogin = "아이디 정보가 일치하지 않습니다.";
          res.send(sendData);
        }
      }
    );
  } else {
    // 아이디, 비밀번호 중 입력되지 않은 값이 있는 경우
    sendData.isLogin = "아이디와 비밀번호를 입력하세요!";
    res.send(sendData);
  }
});

app.post("/signin", (req, res) => {
  // 데이터 받아서 결과 전송
  const username = req.body.userId;
  const password = req.body.userPassword;
  const password2 = req.body.userPassword2;

  const sendData = { isSuccess: "" };

  if (username && password && password2) {
    let sql = "SELECT * FROM userTable WHERE username = $1";
    let params = [username];
    connection.query(sql, params, (err, rows, fields) => {
      if (
        (rows.rows.length == 0 ||
          (rows.rows.length == 1 && rows.rows[0].username != username)) &&
        password == password2
      ) {
        // DB에 같은 이름의 회원아이디가 없고, 비밀번호가 올바르게 입력된 경우
        const hasedPassword = bcrypt.hashSync(password, 10); // 입력된 비밀번호를 해시한 값
        connection.query(
          "INSERT INTO userTable (username, password) VALUES($1,$2)",
          [username, hasedPassword],
          function (err, data) {
            if (err) throw error;
            sendData.isSuccess = "True";
            res.send(sendData);
          }
        );
      } else if (password != password2) {
        // 비밀번호가 올바르게 입력되지 않은 경우
        sendData.isSuccess = "입력된 비밀번호가 서로 다릅니다.";
        res.send(sendData);
      } else {
        // DB에 같은 이름의 회원아이디가 있는 경우
        sendData.isSuccess = "이미 존재하는 아이디 입니다!";
        res.send(sendData);
      }
    });
  } else {
    sendData.isSuccess = "아이디와 비밀번호를 입력하세요!";
    res.send(sendData);
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
