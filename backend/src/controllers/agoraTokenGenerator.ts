import agora from 'agora-token';
import type {Request, Response} from 'express';
import { generateChannelName } from '../services/agora.ts';
const {RtcTokenBuilder, RtcRole} = agora;

const AGORA_APP_ID = process.env.AGORA_APP_ID as string;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE as string;

export const generateAgoraToken = async (req:Request, res:Response) => {
    const user_id = req.params?.user_id as string;
    const mentor_id = req.params?.mentor_id as string;
    try {
        if(!user_id || !mentor_id) {
            return res.status(400).json({
                error: "Invalid request"
            })
        }
        const channelName = generateChannelName(user_id, mentor_id);
        if(!channelName) {
            return res.status(500).json({
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