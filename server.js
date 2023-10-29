const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 5001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/api/customers", (req, res) => {
  res.send([
    {
      id: 1,
      image: "https://placeimg.com/64/64/1",
      name: "김동현",
      birthday: "9999",
      gender: "남자",
      job: "대학생",
    },
    {
      id: 2,
      image: "https://placeimg.com/64/64/2",
      name: "김동현 22",
      birthday: "9999",
      gender: "남자",
      job: "대학생",
    },
    {
      id: 3,
      image: "https://placeimg.com/64/64/3",
      name: "김동현 33",
      birthday: "999",
      gender: "남자",
      job: "대학생",
    },
  ]);
});

app.listen(port, () => console.log("listening on port " + port));
