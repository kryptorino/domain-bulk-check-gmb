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
    return {
        location_name: 'United Kingdom',
        language_code: 'en'
    };
}

/**
 * Extract business name from domain
 */
function extractBusinessName(domain) {
    let name = domain.replace(/\.(co\.uk|uk|com|de|net|org|io)$/i, '');
    name = name.split(/[-_.]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    return name;
}

/**
 * Check Google My Business for a single domain
 */
async function checkGoogleMyBusiness(domain, credentials) {
    try {
        const endpoint = '/business_data/google/my_business_info/live';
        const location = getLocationFromDomain(domain);
        const businessName = extractBusinessName(domain);

        const searchVariants = [
            domain,
            `https://${domain}`,
            businessName
        ];

        // Try ONLY the business name (most efficient)
        const requestData = [{
            "keyword": businessName,
            "location_name": location.location_name,
            "language_code": location.language_code
        }];

        try {
            const response = await makeDataForSEORequest(endpoint, requestData, credentials);

            if (response.tasks && response.tasks.length > 0) {
                const task = response.tasks[0];

                if (task.status_code === 20000 && task.result?.[0]) {
                    const result = task.result[0];

                    if (result.items && result.items.length > 0) {
                        for (const item of result.items) {
                            const itemWebsite = item.url || item.domain || '';
                            const cleanDomain = domain.replace(/^www\./, '');
                            const cleanItemWebsite = itemWebsite.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

                            if (cleanItemWebsite.includes(cleanDomain) || cleanDomain.includes(cleanItemWebsite.split('/')[0])) {
                                return {
                                    domain: domain,
                                    status: 'found',
                                    gmbName: item.title || 'N/A',
                                    address: item.address || 'N/A',
                                    rating: item.rating?.value || 0,
                                    reviewsCount: item.rating?.votes_count || 0,
                                    phone: item.phone || 'N/A',
                                    website: item.url || item.domain || 'N/A',
                                    category: item.category || 'N/A',
                                    workingHours: item.work_hours || null,
                                    cid: item.cid || null
                                };
                            }
                        }

                        const firstItem = result.items[0];
                        return {
                            domain: domain,
                            status: 'found',
                            gmbName: firstItem.title || 'N/A',
                            address: firstItem.address || 'N/A',
                            rating: firstItem.rating?.value || 0,
                            reviewsCount: firstItem.rating?.votes_count || 0,
                            phone: firstItem.phone || 'N/A',
                            website: firstItem.url || firstItem.domain || 'N/A',
                            category: firstItem.category || 'N/A',
                            workingHours: firstItem.work_hours || null,
                            cid: firstItem.cid || null
                        };
                    }
                }
            }
        } catch (error) {
            // Business name search failed, no GMB found
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
 * Process domains in batches of 10 in parallel
 */
async function processBatch(domains, credentials, batchSize = 10) {
    const results = [];

    for (let i = 0; i < domains.length; i += batchSize) {
        const batch = domains.slice(i, i + batchSize);

        // Process batch in parallel
        const batchPromises = batch.map(domain =>
            checkGoogleMyBusiness(domain.trim(), credentials)
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Small delay between batches
        if (i + batchSize < domains.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return results;
}

/**
 * Vercel Serverless Function Handler
 */
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { domains, credentials } = req.body;

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
        res.status(400).json({ error: 'Domains array is required' });
        return;
    }

    if (!credentials || !credentials.login || !credentials.password) {
        res.status(400).json({ error: 'API credentials are required' });
        return;
    }

    const cleanDomains = domains.map(d => d.trim()).filter(d => d);

    // Process in batches of 10 in parallel
    const results = await processBatch(cleanDomains, credentials, 10);

    res.status(200).json({
        success: true,
        results: results,
        total: results.length,
        found: results.filter(r => r.status === 'found').length,
        notFound: results.filter(r => r.status === 'not-found').length,
        errors: results.filter(r => r.status === 'error').length
    });
};
