import {readFile} from 'fs/promises'

const loadData = async () => {
    try {
        const rawData = await readFile(new URL('../utils/iit_mailId.json', import.meta.url), 'utf-8');
        const jsonData = JSON.parse(rawData);
        console.log("Mail list:");
        console.log(jsonData);
        return jsonData;
    }
    catch (err) {
        console.error("Error in loading mail IDs", err);
    }
}

export const iitMails = await loadData();