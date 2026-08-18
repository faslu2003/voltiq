

exports.validateAddress = async (body) => {

    const { houseName, locality, city, state, pincode } = body;

    const address = `${houseName}, ${locality}, ${city}, ${state}, ${pincode}, India`;

    const url = `https://api.geoapify.com/v1/geocode/search` +
        `?text=${encodeURIComponent(address)}` +
        `&filter=countrycode:in` +
        `&format=json` +
        `&apiKey=${process.env.GEOAPIFY_API_KEY}`;

    console.log("URL:", url);

    const response = await fetch(url);

    const data = await response.json();

    console.log("STATUS:", response.status);
    console.log("RESPONSE:", data);

    if (!response.ok) {
        throw new Error(data.message || "Geoapify API request failed");
    }

    return data;
}