# First API Endpoint

A minimal Express.js API with two JSON endpoints.

## Installation

```bash
npm install
```

## How to Run

```bash
npm start
```

The server will start on port 3000 (or the port set in the `PORT` environment variable).

## Endpoints

### GET /

Returns a greeting message.

**Response:**
```json
{
  "message": "Hello, World!"
}
```

### GET /health

Returns the health status of the API.

**Response:**
```json
{
  "status": "ok"
}
```

## Testing with a Browser

Open the following URLs in your browser:

- [http://localhost:3000/](http://localhost:3000/)
- [http://localhost:3000/health](http://localhost:3000/health)

## Testing with curl

```bash
# Root endpoint
curl http://localhost:3000/

# Health endpoint
curl http://localhost:3000/health
```
