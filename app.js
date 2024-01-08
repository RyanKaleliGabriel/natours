const express = require("express");
const fs = require("fs");
const app = express();

// app.get("/", (req, res) => {
//   res
//     .status(404)
//     .json({ message: "Hello from the server siiiiiiide", app: "Natours" });
// });

// app.post("/", (req, res) => {
//   res.send("You can post to this endpoint..");
// });

//Converts to a js object
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

app.get("/api/v1/tours", (req, res) => {
  res.status(200).json({
    //success 200 code    //fail if there was an error at the client      //error if there was an error in the client
    status: "success",
    results: tours.length,
    data: {
      tours: tours,
    },
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
