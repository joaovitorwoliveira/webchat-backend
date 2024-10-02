import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const chatRouter = Router();
const prisma = new PrismaClient();

// GET
