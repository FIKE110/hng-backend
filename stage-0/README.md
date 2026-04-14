# HNG Stage 0 - Gender Classification API

A backend API that classifies names by gender using the Genderize API with custom processing rules.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Language**: TypeScript

## Project Structure

```
stage-0/
├── dist/                  # Compiled output
├── src/
│   ├── index.ts          # App entry point
│   ├── model.ts          # Data types
│   ├── service.ts        # Genderize API integration
│   ├── controller.ts    # Routes & validation
│   └── controller.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Quick Start

```bash
bun install
bun run dev
```

Server runs at `http://localhost:3000`

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Development with hot reload |
| `bun run build` | Build for production |
| `bun run start` | Run production build |
| `bun test` | Run tests |

## API Endpoint

### GET /api/classify

Classifies a name by gender.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | The name to classify |

**Example Request:**

```bash
curl "http://localhost:3000/api/classify?name=john"
```

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "name": "john",
    "gender": "male",
    "probability": 1,
    "sample_size": 2692560,
    "is_confident": true,
    "processed_at": "2026-04-14T14:30:06.856Z"
  }
}
```

**Error Responses:**

| Status Code | Condition | Example |
|-------------|-----------|---------|
| 400 | Missing name | `{"status":"error","message":"Missing name query parameter"}` |
| 400 | Empty name | `{"status":"error","message":"Missing name query parameter"}` |
| 422 | Non-string name | `{"status":"error","message":"Name must be a string"}` |
| 400 | No prediction | `{"status":"error","message":"No prediction available for the provided name"}` |
| 500 | API error | `{"status":"error","message":"External API unavailable"}` |

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| status | string | "success" or "error" |
| name | string | Input name |
| gender | string | "male" or "female" |
| probability | number | Confidence score (0-1) |
| sample_size | number | Number of records in database |
| is_confident | boolean | High confidence flag |
| processed_at | string | UTC timestamp (ISO 8601) |

## Processing Rules

1. **Data Extraction**: Extract gender, probability, count from Genderize API
2. **Field Renaming**: count → sample_size
3. **Confidence Logic**: is_confident = true when:
   - probability ≥ 0.7 **AND**
   - sample_size ≥ 100
4. **Timestamp**: processed_at generated on every request in UTC ISO 8601

## Edge Cases Handled

- Missing query parameter → 400
- Empty name → 400
- Name with no prediction (gender: null) → error message
- Count = 0 → error message
- External API failure (502) → error message

## CORS

The API allows cross-origin requests:

```
Access-Control-Allow-Origin: *
```

## Testing

Run all tests:

```bash
bun test
```

Test coverage:
- Valid name classification
- Field renaming (count → sample_size)
- Confidence logic (is_confident)
- Error handling (400, 422)
- Edge cases (null gender)
- Timestamp format
- CORS headers

## Environment

The API works out of the box. No environment variables required.

Default config:
- Port: 3000
- External API: https://api.genderize.io

## Deployment

This API is ready for deployment on any Bun-compatible platform.

Build for production:

```bash
bun run build
```

The compiled output is in `dist/index.js`.

## License

MIT