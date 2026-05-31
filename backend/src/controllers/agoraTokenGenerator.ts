import agora from 'agora-token';
import jwt from 'jsonwebtoken'
import type {Request, Response} from 'express';
const {RtcTokenBuilder, RtcRole} = agora;

const AGORA_APP_ID = process.env.AGORA_APP_ID as string;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE as string;
const AGORA_SECRET_TOKEN_GENERATOR = process.env.AGORA_SECRET_TOKEN_GENERATOR;

const generateChannelName = async (student_id: string, mentor_id: string) => {
    if(!AGORA_SECRET_TOKEN_GENERATOR) {
        console.log("Secret generator not found");
        return null;
    }
    return jwt.sign({student_id, mentor_id}, AGORA_SECRET_TOKEN_GENERATOR);
}

export const generateAgoraToken = async (req:Request, res:Response) => {
    const user_id = req.params?.user_id as string;
    const mentor_id = req.params?.mentor_id as string;
    try {
        if(user_id===null || mentor_id ===null) {
            return res.status(400).json({
                error: "Invalid request"
            })
        }
        const channelName = await generateChannelName(user_id, mentor_id);
        if(!channelName) {
            return res.status(401).json({
                error: "Error generating channel name"
            });
        }
    
        if(!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
            console.error("Agora APP ID or Certificate is missing in environment");
            return res.status(400).json({
                error: "Server error"
            })
        }
    
        const estimatedTimeStamp = Math.floor(Date.now()/1000) + 3600;
    
        const token = RtcTokenBuilder.buildTokenWithUserAccount(
            AGORA_APP_ID,
            AGORA_APP_CERTIFICATE,
            channelName,
            user_id,
            RtcRole.PUBLISHER,
            300,
            estimatedTimeStamp
        );
    return res.status(201).json({
        rtcToken: token
    })
    }
    catch (err) {
        console.error("Error in generating Agora token ",err);
        return res.status(500).json({
            error: "Error in creating access due to "+ err
        })
    }
}