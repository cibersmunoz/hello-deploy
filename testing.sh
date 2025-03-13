url="localhost:3000"

curl -X POST "$url/recon?domain=example.com&APIKEY=1234"

curl -X POST "$url/recon" -d '{
  "domain": "example.com",
  "APIKEY": "1234"
}' -H "Content-Type: application/json" -H "Accept: application/json"