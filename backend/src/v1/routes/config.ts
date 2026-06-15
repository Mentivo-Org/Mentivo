import { Router } from "express";
import prisma from "../config/db.ts";

const router = Router();

router.get("/settings", async (req, res) => {
  try {
    const settings = await prisma.appSetting.findMany();
    const configMap = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(configMap);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

export default router;
