// api/update.js
import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  const data = req.body;
  const filePath = path.join(process.cwd(), "serverdata.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  res.status(200).send("Updated successfully");
}
