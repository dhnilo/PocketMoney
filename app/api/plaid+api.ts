import { ExpoRequest, ExpoResponse } from 'expo-router/server';

// api.ts
export const createLinkToken = async () => {
  try {
    const response = await fetch(`http://localhost:8000/create_link_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 'localhost': "localhost" }),
    });
    const data = await response.json();
    console.log(data);
    return data.link_token;
  } catch (err) {
    console.log(err);
  }
};