import axios from 'axios';

// Fetch all countries with their currencies
export const getCountriesWithCurrencies = async () => {
  try {
    const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies');
    
    return response.data.map(country => {
      const currencyCode = Object.keys(country.currencies || {})[0];
      const currencyName = country.currencies?.[currencyCode]?.name || '';
      
      return {
        country: country.name.common,
        currency: currencyCode,
        currencyName: currencyName
      };
    }).filter(item => item.currency);
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
};

// Get currency by country name
export const getCurrencyByCountry = (countryName) => {
  const currencyMap = {
    'India': 'INR',
    'United States': 'USD',
    'United Kingdom': 'GBP',
    'Canada': 'CAD',
    'Australia': 'AUD',
    'Singapore': 'SGD',
    'UAE': 'AED',
    'Germany': 'EUR',
    'France': 'EUR',
    'Japan': 'JPY',
    'China': 'CNY'
  };
  
  return currencyMap[countryName] || 'USD';
};

// Convert currency
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount,
      convertedAmount: amount,
      rate: 1,
      from: fromCurrency,
      to: toCurrency
    };
  }

  try {
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const rate = response.data.rates[toCurrency];
    
    if (!rate) {
      throw new Error(`Conversion rate not found for ${fromCurrency} to ${toCurrency}`);
    }

    const convertedAmount = (amount * rate).toFixed(2);
    
    return {
      originalAmount: amount,
      convertedAmount: parseFloat(convertedAmount),
      rate: rate,
      from: fromCurrency,
      to: toCurrency
    };
  } catch (error) {
    console.error('Currency conversion error:', error);
    throw error;
  }
};

// Format currency display
export const formatCurrency = (amount, currency) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};