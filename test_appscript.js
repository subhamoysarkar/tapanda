const url = "https://script.google.com/macros/s/AKfycbxCRW5j9NzhodHzRqJjaSeaDp7dxFyG--XlB2BQM6qpcHuDMjqdkkVrclj6Z_I3Gnz_/exec";
const payload = {
  formType: 'consult',
  name: 'Test Name',
  phone: '1234567890',
  email: 'test@example.com'
};

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify(payload)
})
.then(res => res.text())
.then(text => console.log("Response:", text))
.catch(err => console.error("Error:", err));
