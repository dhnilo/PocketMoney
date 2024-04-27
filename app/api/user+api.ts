export async function postCreateLink() {
  const response = await fetch('http://localhost:8000/create_link_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    console.error(`Server responded with status ${response.status}`);
    const text = await response.text();
    console.error(`Server response: ${text}`);
    throw new Error('Server error');
  }
  const text = await response.text();
  console.log(`Server response: ${text}`);
  const data = JSON.parse(text);
  return data;
}