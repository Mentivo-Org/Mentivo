import type { Request, Response } from "express";
import { emailValidator } from "../utils/mailIdLoader.ts";

export const iitNameExporter = async (req:Request,res: Response) => {
    try {
        const {email} = req.body;
        const name = await emailValidator(email);
        // console.log(typeof name);
        console.log(name);
        if(name && name!=='null') {
            return res.status(200).json({
                name_of_iit: JSON.parse(name),
            })
        }
        else {
            return res.status(400).json({
                error: "Invalid College Email ID",
            })
        }
    }
    catch (err) {
        console.log("Error in validating email server-side ", err);
        return res.status(500).json({
            error: err
        })
    }
}