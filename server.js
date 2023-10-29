const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 5001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/api/hello", (req, res) => {
  res.send({ message: "Hello!" });
});

app.listen(port, () => console.log("listening on port " + port));
