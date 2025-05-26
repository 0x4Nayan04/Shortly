import express from "express";

const app = express();

/* Create */

app.post("/api/create", (req, res) => {});

/* Redirect */

app.get("/api/redirect", (req, res) => {});

app.listen(3000, () => {
  console.log(`Server is running on 3000`);
});
