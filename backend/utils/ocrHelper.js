const tesseract = require('tesseract.js');

const processImageForOCR = async (imagePath) => {
    try {
        const { data: { text } } = await tesseract.recognize(
            imagePath,
            'ind+eng', // Indonesian and English
            { logger: m => console.log(m) }
        );

        console.log("OCR Extracted Text:", text);

        // Regex to find "Rp x.xxx" pattern
        const rpRegex = /Rp\s?([\d.,]+)/g;
        let match;
        let amounts = [];

        while ((match = rpRegex.exec(text)) !== null) {
            // Clean up formatting (dots, commas)
            const cleanStr = match[1].replace(/[^\d]/g, '');
            if (cleanStr) {
                amounts.push(parseInt(cleanStr, 10));
            }
        }

        if (amounts.length > 0) {
            // Pick the biggest number found with Rp
            console.log("Found amounts with Rp:", amounts);
            return Math.max(...amounts);
        }

        // If no Rp pattern, find all chunks of numbers
        const allNumRegex = /[\d.,]+/g;
        amounts = [];
        while ((match = allNumRegex.exec(text)) !== null) {
            const cleanStr = match[0].replace(/[^\d]/g, '');
            if (cleanStr && cleanStr.length > 3) { // usually nominal is > 1000
                amounts.push(parseInt(cleanStr, 10));
            }
        }

        if (amounts.length > 0) {
            console.log("Found pure numbers:", amounts);
            return Math.max(...amounts);
        }

        return null; // Could not detect
    } catch (error) {
        console.error("OCR Error:", error);
        throw error;
    }
};

module.exports = { processImageForOCR };
