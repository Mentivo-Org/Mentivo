import {readFile} from 'fs/promises'
import validator from 'validator';
const { isEmail } = validator;
const loadData = async () => {
    try {
        const rawData = await readFile(new URL('../utils/iit_mailId.json', import.meta.url), 'utf-8');
        const jsonData = JSON.parse(rawData);
        // console.log("Mail list:");
        // console.log(jsonData);
        return jsonData;
    }
    catch (err) {
        console.error("Error in loading mail IDs ", err);
    }
}

const mailList = await loadData();

export const emailValidator:object = async (email: string) => {
    try {
        if(!isEmail(email)) {
        return null;
        }
        const [name, domain] = email.split('@');
        // console.log(domain);
        // console.log(mailList[domain], typeof mailList[domain]);
        const iitName =JSON.stringify(mailList[domain]!==undefined?('IIT ' + mailList[domain]):null);
        return iitName;
    }
    catch (err) {
        console.log("Error in verifying email ID ", err)
    }
}
