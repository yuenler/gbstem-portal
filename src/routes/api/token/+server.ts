import type { RequestHandler } from '@sveltejs/kit';
import { CLIENT_ID, CLIENT_SECRET } from '$env/static/private';

export const POST: RequestHandler = async () => {
  try {
    const response = await fetch('https://login.microsoftonline.com/c9f983d8-6c86-4534-8471-99c48eaab882/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'client_id': CLIENT_ID,
        'scope': 'https://graph.microsoft.com/.default',
        'client_secret': CLIENT_SECRET,
        'grant_type': 'client_credentials'
      }).toString()
    }).then(res => res.json());
    
    return {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Allow all origins
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', // Allow specific methods
        'Access-Control-Allow-Headers': 'Content-Type' // Allow specific headers
      },
      body: response
    };
  } catch (err) {
    return {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*', // Allow all origins
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', // Allow specific methods
        'Access-Control-Allow-Headers': 'Content-Type' // Allow specific headers
      },
      body: { error: 'Failed to get token' }
    };
  }
};

export const OPTIONS: RequestHandler = async () => {
    return {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Allow all origins
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', // Allow specific methods
        'Access-Control-Allow-Headers': 'Content-Type' // Allow specific headers
      }
    };
  };