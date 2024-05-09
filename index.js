const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};

//middlewares
app.use(cors(corsOptions));
app.use(express.json());
// app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello from my server!");
});

app.listen(port, () => {
  console.log(`my app is listening on port ${port}`);
});
