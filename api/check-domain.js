const axios = require('axios');

const DATAFORSEO_API_BASE = 'https://api.dataforseo.com/v3';

/**
 * Helper function to make DataForSEO API requests
 */
async function makeDataForSEORequest(endpoint, data, credentials) {
    const auth = Buffer.from(`${credentials.login}:${credentials.password}`).toString('base64');

    try {
        const response = await axios.post(
            `${DATAFORSEO_API_BASE}${endpoint}`,
            data,
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('DataForSEO API Error:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Detect location based on domain TLD
 */
function getLocationFromDomain(domain) {
    if (domain.endsWith('.co.uk') || domain.endsWith('.uk')) {
        return {
            location_name: 'United Kingdom',
            language_code: 'en'
        };
    } else if (domain.endsWith('.de')) {
        return {
            location_name: 'Germany',
            language_code: 'de'
        };
    } else if (domain.endsWith('.com') || domain.endsWith('.net')) {
        return {
            location_name: 'United States',
            language_code: 'en'
        };
    }
    // Default to UK for most cases
    return {
        location_name: 'United Kingdom',
        language_code: 'en'
    };
}

/**
 * Extract business name from domain for better search
 */
function extractBusinessName(domain) {
    // Remove TLD
    let name = domain.replace(/\.(co\.uk|uk|com|de|net|org|io)$/i, '');

    // Split by common separators and capitalize
    name = name.split(/[-_.]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return name;
}

/**
 * Search for GMB using SERP API (local pack detection)
 */
async function searchGMBviaSERP(domain, credentials) {
    try {
        const endpoint = '/serp/google/organic/live/advanced';
        const location = getLocationFromDomain(domain);
        const businessName = extractBusinessName(domain);

        // Try multiple search strategies
        const searchVariants = [
            businessName, // Just business name
            domain // Original domain
        ];

        // Try each search variant
        for (const keyword of searchVariants) {
            const requestData = [{
                "keyword": keyword,
                "language_code": location.language_code,
                "location_name": location.location_name,
                "device": "desktop",
                "os": "windows"
            }];

            try {
                const response = await makeDataForSEORequest(endpoint, requestData, credentials);

                console.log(`\n=== API Call for "${keyword}" ===`);
                console.log('Full response:', JSON.stringify(response, null, 2));

                if (response.tasks && response.tasks.length > 0) {
                    const task = response.tasks[0];

                    console.log('Task status_code:', task.status_code);
                    console.log('Task status_message:', task.status_message);

                    if (task.status_code === 20000 && task.result?.[0]?.items) {
                        const items = task.result[0].items;
                        console.log('Items found:', items.length);
                        console.log('Item types:', items.map(i => i.type));

                        // Look for local_pack with GMB data
                        for (const item of items) {
                            if (item.type === 'local_pack' && item.items && item.items.length > 0) {
                                // Try to find matching domain in local pack
                                for (const localItem of item.items) {
                                    const itemDomain = localItem.domain || localItem.url || '';
                                    if (itemDomain.includes(domain.replace(/^www\./, ''))) {
                                        return {
                                            domain: domain,
                                            status: 'found',
                                            gmbName: localItem.title || 'N/A',
                                            address: localItem.address || 'N/A',
                                            rating: localItem.rating?.value || 0,
                                            reviewsCount: localItem.rating?.votes_count || 0,
                                            phone: localItem.phone || 'N/A',
                                            website: localItem.domain || localItem.url || 'N/A',
                                            category: localItem.category || 'N/A',
                                            workingHours: localItem.work_hours || null
                                        };
                                    }
                                }

                                // If no exact match but found local pack, return first result
                                const localResult = item.items[0];
                                return {
                                    domain: domain,
                                    status: 'found',
                                    gmbName: localResult.title || 'N/A',
                                    address: localResult.address || 'N/A',
                                    rating: localResult.rating?.value || 0,
                                    reviewsCount: localResult.rating?.votes_count || 0,
                                    phone: localResult.phone || 'N/A',
                                    website: localResult.domain || localResult.url || 'N/A',
                                    category: localResult.category || 'N/A',
                                    workingHours: localResult.work_hours || null
                                };
                            }
                        }
                    }
                }
            } catch (variantError) {
                console.log(`Search variant "${keyword}" failed:`, variantError.message);
                continue;
            }
        }

        return {
            domain: domain,
            status: 'not-found',
            message: 'Kein Google My Business Eintrag gefunden'
        };

    } catch (error) {
        return {
            domain: domain,
            status: 'error',
            message: error.response?.data?.status_message || error.message || 'API request failed'
        };
    }
}

/**
 * Check Google My Business for a single domain
 */
async function checkGoogleMyBusiness(domain, credentials) {
    // Use SERP API for GMB detection via local_pack
    return await searchGMBviaSERP(domain, credentials);
}

/**
 * Vercel Serverless Function Handler
 */
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { domain, credentials } = req.body;

    if (!domain) {
        res.status(400).json({ error: 'Domain is required' });
        return;
    }

    if (!credentials || !credentials.login || !credentials.password) {
        res.status(400).json({ error: 'API credentials are required' });
        return;
    }

    const result = await checkGoogleMyBusiness(domain, credentials);
    res.status(200).json(result);
};
